import { describe, expect, it } from 'vitest';
import { GOAL_UNITS, isGoalUnit } from '../../src/logic/goals';
import course from '../../content/course.json';

describe('goal to unit mapping', () => {
  it('every mapped unit exists in the course', () => {
    const ids = new Set(course.units.map((u) => u.id));
    for (const units of Object.values(GOAL_UNITS)) for (const u of units) expect(ids.has(u)).toBe(true);
  });
  it('matches the goals offered in onboarding', () => {
    expect(isGoalUnit('debt', 3)).toBe(true);
    expect(isGoalUnit('pay', 4)).toBe(true);
    expect(isGoalUnit('invest', 6)).toBe(true);
    expect(isGoalUnit('debt', 4)).toBe(false);
    expect(isGoalUnit(null, 3)).toBe(false);
    expect(isGoalUnit('unknown', 3)).toBe(false);
  });
});
