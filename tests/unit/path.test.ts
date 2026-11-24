import { describe, expect, it } from 'vitest';
import { nodeStates, passed, unitNodes, unitUnlocked } from '../../src/logic/path';
import course from '../../content/course.json';

const u1 = course.units[0];
const u2 = course.units[1];

describe('path and unlocks', () => {
  it('unit 1 has 8 lessons, a review node and a unit check', () => {
    const ids = unitNodes(u1).map((n) => n.id);
    expect(ids).toEqual(['1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8', '1.review', '1.check']);
  });

  it('first node is current, the rest locked', () => {
    const s = nodeStates(u1, {}, []);
    expect(s['1.1']).toBe('current');
    expect(s['1.2']).toBe('locked');
    expect(s['1.check']).toBe('locked');
  });

  it('finishing a lesson unlocks the next', () => {
    const s = nodeStates(u1, { '1.1': {} }, []);
    expect(s['1.1']).toBe('done');
    expect(s['1.2']).toBe('current');
  });

  it('the unit check opens after the review node', () => {
    const done = Object.fromEntries(['1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8', '1.review'].map((k) => [k, {}]));
    expect(nodeStates(u1, done, [])['1.check']).toBe('current');
  });

  it('unit 2 stays locked until unit 1 is passed at 80%', () => {
    expect(unitUnlocked(u2, [])).toBe(false);
    expect(nodeStates(u2, {}, [])['2.1']).toBe('locked');
    expect(passed(9, 12)).toBe(false); // 75%
    expect(passed(10, 12)).toBe(true); // 83%
    expect(passed(8, 10)).toBe(true); // exactly 80%
    expect(unitUnlocked(u2, [1])).toBe(true);
    expect(nodeStates(u2, {}, [1])['2.1']).toBe('current');
  });
});
