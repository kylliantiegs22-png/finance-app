/** App state, persisted to localStorage. No backend: everything lives on the device. */
import { useSyncExternalStore } from 'react';
import { dayKey, type Day } from '../logic/dates';
import { newStreak, reconcile, recordSession, type StreakState } from '../logic/streak';
import { grade, introduce, type Cards } from '../logic/leitner';

const KEY = 'tally.v1';

export interface DayLog {
  xp: number;
  lessons: number;
  reviews: number; // review cards answered
  sessions: number;
  seconds: number;
}

export interface NodeRecord {
  at: string;
  score: number; // 0..100
  best: number;
  runs: number;
}

export interface AppState {
  v: 1;
  onboarded: boolean;
  profile: {
    goal: string | null;
    level: 'new' | 'basics';
    cue: string;
    time: string;
    dailyGoal: number;
  };
  settings: {
    theme: 'system' | 'light' | 'dark';
    sound: boolean;
    haptics: boolean;
    motion: 'system' | 'reduced';
  };
  xp: number;
  days: Record<Day, DayLog>;
  completed: Record<string, NodeRecord>;
  passedUnits: number[];
  streak: StreakState;
  cards: Cards;
  missions: Record<string, 'planned' | 'done'>;
  celebrated: string[];
}

export function initialState(): AppState {
  return {
    v: 1,
    onboarded: false,
    profile: { goal: null, level: 'new', cue: 'my morning coffee', time: '08:00', dailyGoal: 60 },
    settings: { theme: 'system', sound: true, haptics: true, motion: 'system' },
    xp: 0,
    days: {},
    completed: {},
    passedUnits: [],
    streak: newStreak(),
    cards: {},
    missions: {},
    celebrated: [],
  };
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState();
    const s = JSON.parse(raw);
    const base = initialState();
    return { ...base, ...s, profile: { ...base.profile, ...s.profile }, settings: { ...base.settings, ...s.settings }, streak: { ...base.streak, ...s.streak } };
  } catch {
    return initialState();
  }
}

let state: AppState = typeof localStorage !== 'undefined' ? load() : initialState();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked: keep going in memory */
  }
}

export function getState() {
  return state;
}

export function setState(fn: (s: AppState) => AppState) {
  state = fn(state);
  persist();
  listeners.forEach((l) => l());
}

export function useApp<T>(sel: (s: AppState) => T): T {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => sel(state),
  );
}

export const today = () => dayKey(new Date());

/** Apply freezes / expire repairs when the app opens. */
export function reconcileToday() {
  setState((s) => ({ ...s, streak: reconcile(s.streak, today()) }));
}

function logDay(s: AppState, d: Day, patch: Partial<DayLog>): Record<Day, DayLog> {
  const cur = s.days[d] ?? { xp: 0, lessons: 0, reviews: 0, sessions: 0, seconds: 0 };
  const next = { ...cur };
  for (const [k, v] of Object.entries(patch)) next[k as keyof DayLog] += v as number;
  return { ...s.days, [d]: next };
}

export interface AnswerLog {
  concept: string;
  qid: string;
  correct: boolean;
  sure: boolean;
  firstTry: boolean;
}

export interface SessionResult {
  kind: 'lesson' | 'review' | 'unit-review' | 'check';
  nodeId?: string;
  xp: number;
  seconds: number;
  correct: number;
  total: number;
  answers: AnswerLog[];
  concepts?: { concept: string; lesson: string }[];
  passed?: boolean;
  unit?: number;
  /** Real-money moves the learner planned on the apply screen. */
  missions?: string[];
}

/** Commit a finished session: XP, day log, streak, review cards, path progress. */
export function commitSession(r: SessionResult): { before: AppState; after: AppState } {
  const before = state;
  const d = today();
  setState((s) => {
    let cards = s.cards;
    if (r.kind === 'lesson' && r.concepts) cards = introduce(cards, r.concepts, d);
    if (r.kind === 'review' || r.kind === 'unit-review') {
      // grade each concept once (first answer counts) in review sessions
      const seen = new Set<string>();
      for (const a of r.answers) {
        if (seen.has(a.concept) || !cards[a.concept]) continue;
        seen.add(a.concept);
        cards = { ...cards, [a.concept]: grade(cards[a.concept], a.correct, a.sure, d, a.qid) };
      }
    }
    if (r.kind === 'lesson') {
      // Confident misses inside a lesson flag the card to come back sooner (due today).
      for (const a of r.answers) {
        if (!a.correct && a.sure && a.firstTry && cards[a.concept]) cards = { ...cards, [a.concept]: { ...cards[a.concept], due: d, lapses: cards[a.concept].lapses + 1 } };
      }
    }
    const completed = { ...s.completed };
    const score = Math.round((r.correct / Math.max(1, r.total)) * 100);
    if (r.nodeId && (r.kind !== 'check' || r.passed)) {
      const prev = completed[r.nodeId];
      completed[r.nodeId] = { at: new Date().toISOString(), score, best: Math.max(score, prev?.best ?? 0), runs: (prev?.runs ?? 0) + 1 };
    }
    const passedUnits = r.kind === 'check' && r.passed && r.unit && !s.passedUnits.includes(r.unit) ? [...s.passedUnits, r.unit] : s.passedUnits;
    const reviewCount = r.kind === 'review' || r.kind === 'unit-review' ? new Set(r.answers.map((a) => a.concept)).size : 0;
    const missions = { ...s.missions };
    for (const id of r.missions ?? []) missions[id] = missions[id] ?? 'planned';
    return {
      ...s,
      missions,
      xp: s.xp + r.xp,
      days: logDay(s, d, { xp: r.xp, lessons: r.kind === 'lesson' ? 1 : 0, reviews: reviewCount, sessions: 1, seconds: r.seconds }),
      streak: recordSession(s.streak, d),
      cards,
      completed,
      passedUnits,
    };
  });
  return { before, after: state };
}

export function exportProgress(): string {
  return JSON.stringify(state, null, 2);
}

export function importProgress(json: string): boolean {
  try {
    const s = JSON.parse(json);
    if (s?.v !== 1 || typeof s.xp !== 'number') return false;
    setState(() => ({ ...initialState(), ...s }));
    return true;
  } catch {
    return false;
  }
}

export function resetProgress() {
  setState(() => initialState());
}
