import { describe, expect, it, vi, afterEach } from 'vitest';
import { grade, introduce, pickSession, interleave, intervalFor, DAILY_REVIEW_CAP, type Cards, type Card } from '../../src/logic/leitner';
import { addDays, dayKey } from '../../src/logic/dates';

afterEach(() => vi.useRealTimers());
function today(iso = '2026-05-10T09:00:00') {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(iso));
  return dayKey(new Date());
}
const card = (over: Partial<Card> = {}): Card => ({ concept: 'c', lesson: '1.1', box: 1, due: '2026-05-10', lapses: 0, seen: 0, ...over });

describe('leitner', () => {
  it('uses the 1/3/7/16/35/90 day ladder', () => {
    expect([1, 2, 3, 4, 5, 6].map(intervalFor)).toEqual([1, 3, 7, 16, 35, 90]);
  });

  it('new concepts start in box 1 due tomorrow', () => {
    const t = today();
    const c = introduce({}, [{ concept: 'net-worth', lesson: '1.2' }], t);
    expect(c['net-worth']).toMatchObject({ box: 1, due: '2026-05-11' });
  });

  it('right + sure moves up one box with the next interval', () => {
    const t = today();
    let c = card();
    const expected = [3, 7, 16, 35, 90, 90];
    for (let i = 0; i < 6; i++) {
      c = grade(c, true, true, t);
      expect(c.due).toBe(addDays(t, expected[i]));
    }
    expect(c.box).toBe(6);
  });

  it('right + guess stays in the same box', () => {
    const t = today();
    const c = grade(card({ box: 3 }), true, false, t);
    expect(c.box).toBe(3);
    expect(c.due).toBe(addDays(t, 7));
  });

  it('wrong + guess demotes per the ladder', () => {
    const t = today();
    expect(grade(card({ box: 3 }), false, false, t).box).toBe(1);
    expect(grade(card({ box: 5 }), false, false, t).box).toBe(2);
    expect(grade(card({ box: 6 }), false, false, t)).toMatchObject({ box: 3, due: addDays(t, 7) });
  });

  it('a confident miss returns sooner than an unsure one', () => {
    const t = today();
    const sure = grade(card({ box: 5 }), false, true, t);
    const guess = grade(card({ box: 5 }), false, false, t);
    expect(sure).toMatchObject({ box: 1, due: t });
    expect(sure.due < guess.due).toBe(true);
  });

  it('takes most-overdue first and caps at 8 a day', () => {
    const t = today();
    const cards: Cards = {};
    for (let i = 0; i < 12; i++) cards['c' + i] = card({ concept: 'c' + i, lesson: `1.${(i % 4) + 1}`, due: addDays(t, -i) });
    const s = pickSession(cards, t, 0);
    expect(s).toHaveLength(DAILY_REVIEW_CAP);
    const ids = new Set(s.map((c) => c.concept));
    for (let i = 4; i < 12; i++) expect(ids.has('c' + i)).toBe(true); // the 8 most overdue
    expect(pickSession(cards, t, 5)).toHaveLength(3);
    expect(pickSession(cards, t, 8)).toHaveLength(0);
  });

  it('does not show cards that are not yet due', () => {
    const t = today();
    expect(pickSession({ a: card({ concept: 'a', due: addDays(t, 2) }) }, t, 0)).toHaveLength(0);
  });

  it('rescue session practises ahead to reach 5 cards', () => {
    const t = today();
    const cards: Cards = {};
    for (let i = 0; i < 7; i++) cards['c' + i] = card({ concept: 'c' + i, due: addDays(t, i) });
    expect(pickSession(cards, t, 0, { rescue: true })).toHaveLength(5);
  });

  it('interleaves so neighbours come from different lessons', () => {
    const items = ['1.1', '1.1', '1.1', '1.2', '1.2', '1.3'].map((lesson, i) => ({ lesson, i }));
    const out = interleave(items);
    for (let i = 1; i < out.length; i++) expect(out[i].lesson).not.toBe(out[i - 1].lesson);
  });
});

import { strength } from '../../src/logic/leitner';
describe('skill strength', () => {
  it('is strong until due, fading when due, weak after a lapse back to box 1', () => {
    const t = today();
    expect(strength(undefined, t)).toBe('new');
    expect(strength(card({ due: addDays(t, 1) }), t)).toBe('strong');
    expect(strength(card({ box: 3, due: t }), t)).toBe('fading');
    expect(strength(grade(card({ box: 4 }), false, true, t), t)).toBe('weak');
  });
});
