import { afterEach, describe, expect, it } from 'vitest';
import { addDays, dayKey, diffDays, weekStart } from '../../src/logic/dates';
import { newStreak, recordSession } from '../../src/logic/streak';

const ORIGINAL_TZ = process.env.TZ;
afterEach(() => {
  process.env.TZ = ORIGINAL_TZ;
});

describe('calendar days across daylight saving and timezones', () => {
  it('Sydney DST start (4 Oct 2026) and end (5 Apr 2026): consecutive local days differ by exactly 1', () => {
    process.env.TZ = 'Australia/Sydney';
    // 23-hour and 25-hour days
    const before = dayKey(new Date(2026, 9, 3, 23, 30));
    const after = dayKey(new Date(2026, 9, 4, 23, 30));
    expect([before, after]).toEqual(['2026-10-03', '2026-10-04']);
    expect(diffDays(before, after)).toBe(1);
    expect(diffDays(dayKey(new Date(2026, 3, 4, 12)), dayKey(new Date(2026, 3, 5, 23, 59)))).toBe(1);
  });

  it('a daily habit across a DST change keeps the streak', () => {
    process.env.TZ = 'Australia/Sydney';
    let s = newStreak();
    for (let d = 1; d <= 8; d++) s = recordSession(s, dayKey(new Date(2026, 9, d, 7, 30)));
    expect(s.current).toBe(8);
  });

  it('day keys are local: 11pm in Perth is still "today" there', () => {
    process.env.TZ = 'Australia/Perth';
    expect(dayKey(new Date('2026-11-24T15:30:00Z'))).toBe('2026-11-24'); // 23:30 AWST
    process.env.TZ = 'Australia/Brisbane';
    expect(dayKey(new Date('2026-11-24T15:30:00Z'))).toBe('2026-11-25'); // 01:30 AEST
  });

  it('addDays/diffDays/weekStart are timezone independent', () => {
    for (const tz of ['UTC', 'Australia/Sydney', 'America/Los_Angeles', 'Pacific/Kiritimati']) {
      process.env.TZ = tz;
      expect(addDays('2026-10-03', 1)).toBe('2026-10-04');
      expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
      expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
      expect(diffDays('2026-03-01', '2027-03-01')).toBe(365);
      expect(weekStart('2026-11-29')).toBe('2026-11-23'); // Sunday -> Monday
    }
  });
});
