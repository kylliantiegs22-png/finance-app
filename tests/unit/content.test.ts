import { describe, expect, it } from 'vitest';
import { buildIcs } from '../../src/logic/ics';
import { evalArithmetic, parseTypedNumber, plain, tokenize, wordCount } from '../../src/content/text';
import { lessonXp } from '../../src/logic/xp';

const facts = { fcsLimit: { value: 250000, display: '$250,000', label: '', fy: '2026-27', source: { name: 'x', url: 'https://x.y' }, verified: '' } };

describe('text helpers', () => {
  it('resolves facts and strips markup for word counts', () => {
    const t = 'Up to **{{fcsLimit}}** per [[ADI]] is covered.';
    expect(plain(t, facts)).toBe('Up to $250,000 per ADI is covered.');
    expect(wordCount(plain(t, facts))).toBe(7);
    expect(tokenize(t, facts).map((x) => x.t)).toEqual(['text', 'bold', 'text', 'term', 'text']);
  });
  it('evaluates arithmetic safely', () => {
    expect(evalArithmetic('4,200 - 3150')).toBe(1050);
    expect(evalArithmetic('(2 + 3) * 4 / 2')).toBe(10);
    expect(() => evalArithmetic('alert(1)')).toThrow();
  });
  it('parses typed numbers', () => {
    expect(parseTypedNumber('$1,200')).toBe(1200);
    expect(parseTypedNumber('12.5%')).toBe(12.5);
    expect(parseTypedNumber('abc')).toBeNull();
  });
});

describe('ics reminder', () => {
  it('builds a repeating daily event with an alarm at the chosen time', () => {
    const ics = buildIcs({ cue: 'my morning coffee', time: '07:45', now: new Date(2026, 4, 3, 10, 0) });
    expect(ics).toContain('RRULE:FREQ=DAILY');
    expect(ics).toContain('DTSTART:20260503T074500');
    expect(ics).toContain('DTEND:20260503T075500');
    expect(ics).toContain('SUMMARY:After my morning coffee\\, I do my Tally lesson');
    expect(ics).toContain('BEGIN:VALARM');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });
});

describe('xp', () => {
  it('rewards correct answers and a perfect lesson', () => {
    expect(lessonXp(10, 0, 10)).toBe(65);
    expect(lessonXp(8, 2, 10)).toBe(54);
  });
});
