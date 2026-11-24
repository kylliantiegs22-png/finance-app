/** App state, persisted to localStorage. No backend: everything lives on the device. */
import { useSyncExternalStore } from 'react';
import { dayKey, type Day } from '../logic/dates';
import { reconcile, recordSession } from '../logic/streak';
import { grade, introduce } from '../logic/leitner';

export * from './state';
import { initialState, type AppState, type DayLog } from './state';
import { backup, getStorage, KEY, loadFrom, parseSaved, sanitize, saveTo, type LoadStatus } from './persistence';

/** Storage health, shown to the learner when something is wrong (never blocks the app). */
export interface StorageHealth {
  /** Last write failed: progress lives only in this tab until it succeeds. */
  saveFailed: null | 'quota' | 'unavailable';
  /** What happened when saved data was read at start-up. */
  loaded: LoadStatus;
  backupKey: string | null;
  noticeDismissed: boolean;
}

const storage = getStorage();
const first = loadFrom(storage);
let state: AppState = first.state;
let health: StorageHealth = {
  saveFailed: storage ? null : 'unavailable',
  loaded: first.status,
  backupKey: null,
  noticeDismissed: false,
};
// Keep a copy of anything we can't fully read before it is ever overwritten.
if (first.backupRaw !== undefined) health.backupKey = backup(storage, first.backupRaw, new Date());

const listeners = new Set<() => void>();
const healthListeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const emitHealth = () => healthListeners.forEach((l) => l());

function persist() {
  const r = saveTo(storage, state, dayKey(new Date()));
  const next = r.ok ? null : r.reason;
  if (next !== health.saveFailed) {
    health = { ...health, saveFailed: next };
    emitHealth();
  }
}

// Another tab (or the installed app and a browser tab) saved newer progress: adopt it
// instead of later overwriting it with this tab's stale copy.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY || e.newValue === null) return;
    const r = parseSaved(e.newValue);
    if (r.status === 'unreadable') return;
    state = r.state;
    emit();
  });
}

export function getState() {
  return state;
}

export function setState(fn: (s: AppState) => AppState) {
  state = fn(state);
  persist();
  emit();
}

export function getHealth() {
  return health;
}

export function useHealth(): StorageHealth {
  return useSyncExternalStore(
    (cb) => {
      healthListeners.add(cb);
      return () => healthListeners.delete(cb);
    },
    () => health,
  );
}

export function dismissNotice() {
  health = { ...health, noticeDismissed: true };
  emitHealth();
}

/** Retry a failed save (e.g. after the learner frees space). */
export function retrySave() {
  persist();
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
  const r = parseSaved(json);
  if (r.status === 'unreadable' || r.status === 'empty' || r.repaired.includes('root')) return false;
  setState(() => r.state);
  return true;
}

export { sanitize };

export function resetProgress() {
  setState(() => initialState());
}
