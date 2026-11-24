import { describe, expect, it } from 'vitest';
import { retryPosition } from '../../src/logic/session';

const q = (id: string) => ({ kind: 'question' as const, id });
const t = (id: string) => ({ kind: 'teach' as const, id });
const apply = () => ({ kind: 'apply' as const, id: 'apply' });

describe('where a missed question comes back', () => {
  it('3 to 5 screens later (2 if the learner was sure), inside the practice', () => {
    const items = Array.from({ length: 12 }, (_, i) => q('q' + i));
    expect(retryPosition(items, 2, false)).toBe(7); // pos 2 + 1 + 4
    expect(retryPosition(items, 2, true)).toBe(5); // pos 2 + 1 + 2
  });

  it('never lands after the "Your money" screen: the lesson must end on apply then recap', () => {
    // the last practice question is missed with the apply screen right behind it
    const items = [t('core'), q('a'), q('b'), q('c'), apply()];
    const at = retryPosition(items, 3, false); // pos 3 + 1 + 4 = 8, past the end
    expect(at).toBeLessThanOrEqual(4); // before the apply screen at index 4
    const next = [...items.slice(0, at), q('retry'), ...items.slice(at)];
    expect(next.map((i) => i.id)).toEqual(['core', 'a', 'b', 'c', 'retry', 'apply']);
  });

  it('with the apply screen two ahead, the retry still sits before it', () => {
    const items = [q('a'), q('b'), q('c'), apply()];
    expect(retryPosition(items, 1, true)).toBeLessThanOrEqual(3);
  });

  it('review and check sessions (no apply screen) may push it to the end', () => {
    const items = [q('a'), q('b')];
    expect(retryPosition(items, 0, false)).toBe(2);
  });
});
