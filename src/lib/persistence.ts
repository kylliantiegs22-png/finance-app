/**
 * Reading and writing saved progress. Pure functions over a Storage-like
 * object so they can be tested with fake storage.
 *
 * Rules (nothing a browser throws at us may lose progress or blank the app):
 *  - Every read is sanitised field by field: a bad field falls back to its
 *    default, the rest of the progress is kept.
 *  - Saved data we can't parse, or from a newer app version, is copied to a
 *    backup key before anything is written over it.
 *  - Writes that fail (quota, private mode) are reported, never thrown. On a
 *    full quota we prune old, rebuildable data and try again.
 */
import { initialState, SCHEMA_VERSION, type AppState, type DayLog, type NodeRecord } from './state';
import type { Card, Cards } from '../logic/leitner';
import type { StreakState } from '../logic/streak';

export const KEY = 'tally.v1';
export const BACKUP_PREFIX = 'tally.backup.';
/** Day logs older than this are dropped when storage is full (the habit grid shows 66). */
export const PRUNE_KEEP_DAYS = 120;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  readonly length: number;
  key(index: number): string | null;
}

/** localStorage if usable; null if absent or blocked (some private modes throw on access). */
export function getStorage(): StorageLike | null {
  try {
    const s = globalThis.localStorage;
    if (!s) return null;
    s.getItem(KEY); // may throw SecurityError
    return s;
  } catch {
    return null;
  }
}

export type LoadStatus = 'empty' | 'ok' | 'migrated' | 'repaired' | 'unreadable' | 'newer' | 'unavailable';
export interface LoadResult {
  state: AppState;
  status: LoadStatus;
  /** Fields that were invalid and reset to defaults. */
  repaired: string[];
  /** Raw text that must be backed up before the first write (unreadable or newer data). */
  backupRaw?: string;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const isDay = (v: unknown): v is string => typeof v === 'string' && DAY_RE.test(v);
const nonNeg = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const int = (v: unknown, lo: number, hi: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi;

function pickRecord<T>(v: unknown, keyOk: (k: string) => boolean, valueOf: (x: unknown, k: string) => T | null): { out: Record<string, T>; bad: boolean } {
  const out: Record<string, T> = {};
  if (!isObj(v)) return { out, bad: v !== undefined };
  let bad = false;
  for (const [k, x] of Object.entries(v)) {
    const val = keyOk(k) ? valueOf(x, k) : null;
    if (val === null) bad = true;
    else out[k] = val;
  }
  return { out, bad };
}

function dayLog(x: unknown): DayLog | null {
  if (!isObj(x)) return null;
  const d: DayLog = { xp: 0, lessons: 0, reviews: 0, sessions: 0, seconds: 0 };
  for (const k of Object.keys(d) as (keyof DayLog)[]) {
    if (x[k] === undefined) continue;
    if (!nonNeg(x[k])) return null;
    d[k] = x[k] as number;
  }
  return d;
}

function nodeRecord(x: unknown): NodeRecord | null {
  if (!isObj(x)) return null;
  const at = typeof x.at === 'string' ? x.at : new Date(0).toISOString();
  const score = nonNeg(x.score) ? Math.min(100, x.score) : 100;
  const best = nonNeg(x.best) ? Math.min(100, x.best) : score;
  const runs = int(x.runs, 0, 1e6) ? x.runs : 1;
  return { at, score, best, runs };
}

function card(x: unknown, k: string): Card | null {
  if (!isObj(x) || !int(x.box, 1, 6) || !isDay(x.due)) return null;
  return {
    concept: typeof x.concept === 'string' && x.concept ? x.concept : k,
    lesson: typeof x.lesson === 'string' ? x.lesson : '',
    box: x.box,
    due: x.due,
    lapses: int(x.lapses, 0, 1e6) ? x.lapses : 0,
    seen: int(x.seen, 0, 1e6) ? x.seen : 0,
    ...(typeof x.lastQ === 'string' ? { lastQ: x.lastQ } : {}),
  };
}

function streak(x: unknown, bad: (f: string) => void): StreakState {
  const d = initialState().streak;
  if (x === undefined) return d;
  if (!isObj(x)) {
    bad('streak');
    return d;
  }
  const s: StreakState = { ...d };
  const take = <K extends keyof StreakState>(k: K, ok: (v: unknown) => boolean) => {
    if (x[k] === undefined) return;
    if (ok(x[k])) s[k] = x[k] as StreakState[K];
    else bad(`streak.${String(k)}`);
  };
  take('current', (v) => int(v, 0, 1e6));
  take('longest', (v) => int(v, 0, 1e6));
  take('lastDay', (v) => v === null || isDay(v));
  take('freezes', (v) => int(v, 0, 2));
  take('frozenDays', (v) => Array.isArray(v) && v.every(isDay));
  take('repairedDays', (v) => Array.isArray(v) && v.every(isDay));
  take('repair', (v) => v === null || (isObj(v) && isDay(v.missedDay)));
  const sessions = pickRecord(x.sessions, isDay, (v) => (int(v, 0, 1e6) ? v : null));
  if (sessions.bad) bad('streak.sessions');
  s.sessions = sessions.out;
  s.longest = Math.max(s.longest, s.current);
  return s;
}

/** Turn any parsed JSON into a valid AppState, keeping every field that is valid. */
export function sanitize(raw: unknown): { state: AppState; repaired: string[] } {
  const base = initialState();
  const repaired: string[] = [];
  const bad = (f: string) => repaired.push(f);
  if (!isObj(raw)) return { state: base, repaired: ['root'] };

  const st: AppState = { ...base };

  // profile
  const p = isObj(raw.profile) ? raw.profile : {};
  if (raw.profile !== undefined && !isObj(raw.profile)) bad('profile');
  st.profile = {
    goal: typeof p.goal === 'string' || p.goal === null ? (p.goal as string | null) : base.profile.goal,
    level: p.level === 'new' || p.level === 'basics' ? p.level : base.profile.level,
    cue: typeof p.cue === 'string' && p.cue.trim() ? p.cue.slice(0, 120) : base.profile.cue,
    time: typeof p.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(p.time) ? p.time : base.profile.time,
    dailyGoal: int(p.dailyGoal, 10, 500) ? p.dailyGoal : base.profile.dailyGoal,
  };
  for (const k of Object.keys(st.profile) as (keyof AppState['profile'])[]) if (p[k] !== undefined && p[k] !== st.profile[k]) bad(`profile.${k}`);

  // settings
  const se = isObj(raw.settings) ? raw.settings : {};
  st.settings = {
    theme: se.theme === 'light' || se.theme === 'dark' || se.theme === 'system' ? se.theme : base.settings.theme,
    sound: typeof se.sound === 'boolean' ? se.sound : base.settings.sound,
    haptics: typeof se.haptics === 'boolean' ? se.haptics : base.settings.haptics,
    motion: se.motion === 'reduced' || se.motion === 'system' ? se.motion : base.settings.motion,
  };

  const days = pickRecord(raw.days, isDay, (x) => dayLog(x));
  if (days.bad) bad('days');
  st.days = days.out;

  const completed = pickRecord(raw.completed, (k) => /^\d+\.(\d+|review|check)$/.test(k), (x) => nodeRecord(x));
  if (completed.bad) bad('completed');
  st.completed = completed.out;

  if (Array.isArray(raw.passedUnits)) st.passedUnits = [...new Set(raw.passedUnits.filter((u): u is number => int(u, 1, 99)))];
  else if (raw.passedUnits !== undefined) bad('passedUnits');
  // a passed unit check implies the unit is passed, and vice versa
  for (const k of Object.keys(st.completed)) {
    const m = /^(\d+)\.check$/.exec(k);
    if (m && !st.passedUnits.includes(+m[1])) st.passedUnits.push(+m[1]);
  }

  if (nonNeg(raw.xp)) st.xp = Math.round(raw.xp);
  else {
    if (raw.xp !== undefined) bad('xp');
    st.xp = Object.values(st.days).reduce((a, d) => a + d.xp, 0);
  }

  st.streak = streak(raw.streak, bad);

  const cards = pickRecord<Card>(raw.cards, (k) => k.length > 0, (x, k) => card(x, k));
  if (cards.bad) bad('cards');
  st.cards = cards.out as Cards;

  const missions = pickRecord<'planned' | 'done'>(raw.missions, () => true, (x) => (x === 'planned' || x === 'done' ? x : null));
  if (missions.bad) bad('missions');
  st.missions = missions.out;

  if (Array.isArray(raw.celebrated)) st.celebrated = raw.celebrated.filter((x): x is string => typeof x === 'string');

  // Anyone with progress has finished onboarding, even if the flag was lost.
  const hasProgress = Object.keys(st.completed).length > 0 || st.xp > 0;
  st.onboarded = typeof raw.onboarded === 'boolean' ? raw.onboarded || hasProgress : hasProgress;
  if (raw.onboarded !== undefined && typeof raw.onboarded !== 'boolean') bad('onboarded');

  st.v = SCHEMA_VERSION;
  return { state: st, repaired };
}

/** Parse saved text (or null). Never throws. */
export function parseSaved(raw: string | null): LoadResult {
  if (raw === null || raw === '') return { state: initialState(), status: 'empty', repaired: [] };
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { state: initialState(), status: 'unreadable', repaired: ['root'], backupRaw: raw };
  }
  if (!isObj(json)) return { state: initialState(), status: 'unreadable', repaired: ['root'], backupRaw: raw };
  const v = json.v;
  const { state, repaired } = sanitize(json);
  if (typeof v === 'number' && v > SCHEMA_VERSION) return { state, status: 'newer', repaired, backupRaw: raw };
  if (v === undefined || (typeof v === 'number' && v < SCHEMA_VERSION)) return { state, status: 'migrated', repaired };
  return { state, status: repaired.length ? 'repaired' : 'ok', repaired, ...(repaired.length ? { backupRaw: raw } : {}) };
}

export function loadFrom(storage: StorageLike | null): LoadResult {
  if (!storage) return { state: initialState(), status: 'unavailable', repaired: [] };
  let raw: string | null;
  try {
    raw = storage.getItem(KEY);
  } catch {
    return { state: initialState(), status: 'unavailable', repaired: [] };
  }
  return parseSaved(raw);
}

/** Keep a copy of data we're about to overwrite. Best effort. Returns the backup key or null. */
export function backup(storage: StorageLike | null, raw: string, now: Date): string | null {
  if (!storage) return null;
  const key = `${BACKUP_PREFIX}${now.toISOString().replace(/[:.]/g, '-')}`;
  try {
    storage.setItem(key, raw);
    return key;
  } catch {
    return null;
  }
}

export function isQuotaError(e: unknown): boolean {
  if (!(e instanceof Error) && !(typeof e === 'object' && e)) return false;
  const err = e as { name?: string; code?: number };
  return err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED' || err.code === 22 || err.code === 1014;
}

/** Drop data that is safe to lose: old day logs and old backups. Pure. */
export function pruneState(s: AppState, today: string): AppState {
  const cutoff = new Date(Date.parse(today + 'T00:00:00Z') - PRUNE_KEEP_DAYS * 86_400_000).toISOString().slice(0, 10);
  const days: AppState['days'] = {};
  for (const [k, v] of Object.entries(s.days)) if (k >= cutoff) days[k] = v;
  const keepDay = (d: string) => d >= cutoff;
  return { ...s, days, streak: { ...s.streak, frozenDays: s.streak.frozenDays.filter(keepDay), repairedDays: s.streak.repairedDays.filter(keepDay) } };
}

export type SaveResult = { ok: true; pruned: boolean } | { ok: false; reason: 'quota' | 'unavailable' };

export function saveTo(storage: StorageLike | null, state: AppState, today: string): SaveResult {
  if (!storage) return { ok: false, reason: 'unavailable' };
  const write = (s: AppState) => storage.setItem(KEY, JSON.stringify(s));
  try {
    write(state);
    return { ok: true, pruned: false };
  } catch (e) {
    if (!isQuotaError(e)) return { ok: false, reason: 'unavailable' };
  }
  // Storage full: free space we own (old backups), prune rebuildable data, retry.
  try {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && k.startsWith(BACKUP_PREFIX)) keys.push(k);
    }
    keys.sort();
    for (const k of keys.slice(0, -1)) storage.removeItem(k); // keep the newest backup
  } catch {
    /* ignore */
  }
  try {
    write(pruneState(state, today));
    return { ok: true, pruned: true };
  } catch {
    return { ok: false, reason: 'quota' };
  }
}
