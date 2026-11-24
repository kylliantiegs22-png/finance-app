import { describe, expect, it, vi, afterEach } from 'vitest';
import { newStreak, recordSession, reconcile, streakStatus, type StreakState } from '../../src/logic/streak';
import { dayKey } from '../../src/logic/dates';

// Fake the clock: every "today" comes from the mocked Date.
afterEach(() => vi.useRealTimers());
function at(iso: string) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(iso));
  return dayKey(new Date());
}
function daysOfSessions(s: StreakState, startIso: string, n: number): StreakState {
  const start = new Date(startIso);
  for (let i = 0; i < n; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    s = recordSession(s, at(d.toISOString()));
  }
  return s;
}

describe('streak', () => {
  it('starts at 1 and grows on consecutive days', () => {
    let s = recordSession(newStreak(), at('2026-03-01T08:00:00'));
    expect(s.current).toBe(1);
    s = recordSession(s, at('2026-03-01T20:00:00'));
    expect(s.current).toBe(1); // second session same day
    s = recordSession(s, at('2026-03-02T07:30:00'));
    expect(s.current).toBe(2);
    expect(streakStatus(s, at('2026-03-02T21:00:00'))).toBe('done-today');
    expect(streakStatus(s, at('2026-03-03T09:00:00'))).toBe('keep-going');
  });

  it('crosses month and year boundaries', () => {
    let s = recordSession(newStreak(), at('2026-12-31T22:00:00'));
    s = recordSession(s, at('2027-01-01T09:00:00'));
    expect(s.current).toBe(2);
  });

  it('earns a freeze every 7 days, holding at most 2', () => {
    let s = daysOfSessions(newStreak(), '2026-03-01T08:00:00', 6);
    expect(s.freezes).toBe(0);
    s = daysOfSessions(s, '2026-03-07T08:00:00', 1);
    expect(s.current).toBe(7);
    expect(s.freezes).toBe(1);
    s = daysOfSessions(s, '2026-03-08T08:00:00', 14);
    expect(s.current).toBe(21);
    expect(s.freezes).toBe(2);
  });

  it('uses freezes automatically to cover missed days', () => {
    let s = daysOfSessions(newStreak(), '2026-03-01T08:00:00', 14); // 2 freezes
    expect(s.freezes).toBe(2);
    // miss 15th and 16th, come back on the 17th
    s = recordSession(s, at('2026-03-17T08:00:00'));
    expect(s.current).toBe(15);
    expect(s.freezes).toBe(0);
    expect(s.frozenDays).toEqual(['2026-03-15', '2026-03-16']);
  });

  it('offers a 24h repair for one uncovered missed day, fixed by a double session', () => {
    let s = daysOfSessions(newStreak(), '2026-03-01T08:00:00', 5);
    // miss the 6th; return the 7th
    const r = reconcile(s, at('2026-03-07T08:00:00'));
    expect(r.repair).toEqual({ missedDay: '2026-03-06' });
    expect(streakStatus(r, '2026-03-07')).toBe('repair');
    s = recordSession(s, at('2026-03-07T08:00:00'));
    expect(s.current).toBe(5); // one session isn't enough yet
    s = recordSession(s, at('2026-03-07T12:00:00'));
    expect(s.current).toBe(7); // repaired day + today
    expect(s.repairedDays).toEqual(['2026-03-06']);
    expect(s.repair).toBeNull();
  });

  it('a repair not finished in its 24h window expires; the active day starts a new streak', () => {
    let s = daysOfSessions(newStreak(), '2026-03-01T08:00:00', 5);
    s = recordSession(s, at('2026-03-07T08:00:00')); // only one session on repair day
    s = recordSession(s, at('2026-03-08T08:00:00'));
    expect(s.current).toBe(2); // 7th + 8th
    expect(s.longest).toBe(5);
  });

  it('a long gap with no freezes resets to 1 on return, no repair', () => {
    let s = daysOfSessions(newStreak(), '2026-03-01T08:00:00', 3);
    const r = reconcile(s, at('2026-03-10T08:00:00'));
    expect(r.repair).toBeNull();
    expect(r.current).toBe(0);
    s = recordSession(s, at('2026-03-10T08:00:00'));
    expect(s.current).toBe(1);
    expect(s.longest).toBe(3);
  });

  it('freeze covers the older miss and repair covers yesterday', () => {
    let s = daysOfSessions(newStreak(), '2026-03-01T08:00:00', 7); // 1 freeze
    const r = reconcile(s, at('2026-03-10T08:00:00')); // missed 8th, 9th
    expect(r.frozenDays).toEqual(['2026-03-08']);
    expect(r.repair).toEqual({ missedDay: '2026-03-09' });
    s = recordSession(recordSession(s, at('2026-03-10T08:00:00')), at('2026-03-10T09:00:00'));
    expect(s.current).toBe(9); // 7 + repaired 9th + today (frozen days hold, not add)
  });

  it('clock going backwards (flying west, clock fix) never resets the streak', () => {
    let s = daysOfSessions(newStreak(), '2026-03-01T08:00:00', 5); // last day 5 March
    s = recordSession(s, at('2026-03-04T23:30:00')); // device now thinks it is the 4th
    expect(s.current).toBe(5);
    expect(s.lastDay).toBe('2026-03-05');
    expect(streakStatus(s, '2026-03-04')).toBe('done-today');
    // and normal life resumes on the 6th
    s = recordSession(s, at('2026-03-06T08:00:00'));
    expect(s.current).toBe(6);
  });

  it('reconcile ignores a lastDay in the future', () => {
    const s = daysOfSessions(newStreak(), '2026-03-01T08:00:00', 3);
    const r = reconcile(s, '2026-02-27');
    expect(r.current).toBe(3);
    expect(r.repair).toBeNull();
  });
});
