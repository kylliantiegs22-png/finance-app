/**
 * Forgiving streak.
 *  - Any finished lesson or review session (a 2-minute rescue counts) keeps the day.
 *  - Freezes: earn 1 at every 7-day multiple, hold at most 2. Missed days are
 *    covered automatically, oldest first.
 *  - Repair: if exactly one missed day is left uncovered and it was yesterday,
 *    the learner has today (24h) to repair it by finishing 2 sessions.
 *  - Never shames: a lost streak just restarts at 1 with the next session.
 */
import { addDays, diffDays, type Day } from './dates';

export const MAX_FREEZES = 2;
export const FREEZE_EVERY = 7;
export const REPAIR_SESSIONS = 2;

export interface StreakState {
  current: number;
  longest: number;
  /** Last day that counts for the streak (active, frozen or repaired). */
  lastDay: Day | null;
  freezes: number;
  frozenDays: Day[];
  repairedDays: Day[];
  /** Pending repair: the missed day, fixable on missedDay + 1. */
  repair: { missedDay: Day } | null;
  /** Sessions finished per day (only recent days are needed). */
  sessions: Record<Day, number>;
}

export function newStreak(): StreakState {
  return { current: 0, longest: 0, lastDay: null, freezes: 0, frozenDays: [], repairedDays: [], repair: null, sessions: {} };
}

/** Bring the streak up to date for `today` (apply freezes, offer/expire repair). */
export function reconcile(s0: StreakState, today: Day): StreakState {
  const s: StreakState = { ...s0, frozenDays: [...s0.frozenDays], repairedDays: [...s0.repairedDays], sessions: { ...s0.sessions } };

  // An unfinished repair expires once its day has passed.
  if (s.repair && diffDays(s.repair.missedDay, today) > 1) {
    const fixDay = addDays(s.repair.missedDay, 1);
    s.repair = null;
    if ((s.sessions[fixDay] ?? 0) > 0) {
      s.current = 1; // the fix day itself was active: a fresh streak of 1
      s.lastDay = fixDay;
    } else {
      s.current = 0;
    }
  }
  if (s.repair || !s.lastDay || s.current === 0) return s;

  const gap = diffDays(s.lastDay, today);
  if (gap <= 1) return s;
  const missed = gap - 1;
  const use = Math.min(missed, s.freezes);
  for (let i = 1; i <= use; i++) s.frozenDays.push(addDays(s.lastDay, i));
  s.freezes -= use;
  const uncovered = missed - use;
  if (uncovered === 0) {
    s.lastDay = addDays(today, -1);
  } else if (uncovered === 1) {
    // The one uncovered day is yesterday: offer a 24h repair.
    s.lastDay = addDays(today, -2);
    s.repair = { missedDay: addDays(today, -1) };
  } else {
    s.current = 0;
  }
  return s;
}

/** Record a finished session (lesson or review) on `today`. */
export function recordSession(s0: StreakState, today: Day): StreakState {
  const s = reconcile(s0, today);
  s.sessions[today] = (s.sessions[today] ?? 0) + 1;
  // keep only the last 120 days of session counts
  for (const d of Object.keys(s.sessions)) if (diffDays(d, today) > 120) delete s.sessions[d];

  // Already counted, or the clock moved backwards (timezone travel, clock fix): keep the streak.
  if (s.lastDay && s.lastDay >= today) return s;

  if (s.repair) {
    if (s.sessions[today] >= REPAIR_SESSIONS) {
      s.repairedDays.push(s.repair.missedDay);
      s.repair = null;
      bump(s, 2, today);
    }
    return s;
  }

  if (s.lastDay && s.current > 0 && diffDays(s.lastDay, today) === 1) bump(s, 1, today);
  else {
    s.current = 0;
    bump(s, 1, today);
  }
  return s;
}

function bump(s: StreakState, by: number, today: Day) {
  for (let i = 0; i < by; i++) {
    s.current += 1;
    if (s.current % FREEZE_EVERY === 0 && s.freezes < MAX_FREEZES) s.freezes += 1;
  }
  s.lastDay = today;
  s.longest = Math.max(s.longest, s.current);
}

/** What the UI should say about today. */
export function streakStatus(s: StreakState, today: Day): 'done-today' | 'repair' | 'keep-going' | 'start' {
  if (s.lastDay && s.lastDay >= today) return 'done-today';
  if (s.repair) return 'repair';
  if (s.current > 0) return 'keep-going';
  return 'start';
}
