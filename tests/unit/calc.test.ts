import { describe, expect, it } from 'vitest';
import { answerValue, evaluate, formatResult } from '../../src/lib/calc';

describe('lesson calculator', () => {
  it('does the four operations with normal precedence', () => {
    expect(evaluate('15 × 52')).toBe(780);
    expect(evaluate('3600 − 1450 − 520 − 180')).toBe(1450);
    expect(evaluate('2 + 3 × 4')).toBe(14);
    expect(evaluate('39000 ÷ 156')).toBe(250);
    expect(evaluate('1500*26/12')).toBe(3250);
  });

  it('handles brackets, decimals, commas and dollar signs', () => {
    expect(evaluate('(2 + 3) × 4')).toBe(20);
    expect(evaluate('92.30 + 88.10 + 105.60 + 79.00')).toBe(365);
    expect(evaluate('$1,000 × 1.05 × 1.05')).toBe(1102.5);
    expect(evaluate('0.1 + 0.2')).toBe(0.3);
    expect(evaluate('-5 + 2')).toBe(-3);
  });

  it('treats % like a phone calculator', () => {
    expect(evaluate('4200 × 20%')).toBe(840);
    expect(evaluate('1000 + 5%')).toBe(1050);
    expect(evaluate('200 − 10%')).toBe(180);
    expect(evaluate('50%')).toBe(0.5);
  });

  it('returns null for unfinished or impossible sums', () => {
    expect(evaluate('')).toBeNull();
    expect(evaluate('12 +')).toBeNull();
    expect(evaluate('(3 + 4')).toBeNull();
    expect(evaluate('5 ÷ 0')).toBeNull();
    expect(evaluate('abc')).toBeNull();
  });

  it('formats results for display and for the answer box', () => {
    expect(formatResult(12345.6)).toBe('12,345.6');
    expect(answerValue(1102.5)).toBe('1102.5');
    expect(answerValue(1 / 3)).toBe('0.33');
  });
});
