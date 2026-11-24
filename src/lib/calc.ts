/**
 * Tiny, safe evaluator for the in-lesson calculator (no eval()).
 * Supports + - × ÷ (or * /), brackets, decimals and a postfix %.
 * Percent works like a phone calculator: "200 + 10%" is 220, "200 × 10%" is 20.
 */

export type Token = { t: 'num'; v: number; pct: boolean } | { t: 'op'; v: '+' | '-' | '*' | '/' } | { t: '('; } | { t: ')' };

const OPS: Record<string, '+' | '-' | '*' | '/'> = { '+': '+', '-': '-', '−': '-', '*': '*', '×': '*', '/': '/', '÷': '/' };

function tokenize(expr: string): Token[] | null {
  const out: Token[] = [];
  const s = expr.replace(/[\s,$]/g, '');
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    const m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
    if (m) {
      i += m[0].length;
      let pct = false;
      if (s[i] === '%') {
        pct = true;
        i++;
      }
      out.push({ t: 'num', v: parseFloat(m[0]), pct });
    } else if (OPS[c]) {
      out.push({ t: 'op', v: OPS[c] });
      i++;
    } else if (c === '(' || c === ')') {
      out.push({ t: c });
      i++;
    } else return null;
  }
  return out;
}

/** Returns the value, or null when the expression is incomplete or invalid (e.g. "12 +", "5 ÷ 0"). */
export function evaluate(expr: string): number | null {
  const toks = tokenize(expr);
  if (!toks || toks.length === 0) return null;
  let i = 0;
  const fail = () => {
    throw new Error('bad');
  };

  // A factor reports whether it was a bare percentage, so + and − can apply it to the left side.
  function factor(): { v: number; pct: boolean } {
    const k = toks![i];
    if (!k) fail();
    if (k.t === 'op' && k.v === '-') {
      i++;
      const f = factor();
      return { v: -f.v, pct: f.pct };
    }
    if (k.t === '(') {
      i++;
      const v = sum();
      if (toks![i]?.t !== ')') fail();
      i++;
      return { v, pct: false };
    }
    if (k.t === 'num') {
      i++;
      return { v: k.pct ? k.v / 100 : k.v, pct: k.pct };
    }
    return fail();
  }
  function term(): { v: number; pct: boolean } {
    let left = factor();
    while (toks![i]?.t === 'op' && ((toks![i] as { v: string }).v === '*' || (toks![i] as { v: string }).v === '/')) {
      const op = (toks![i] as { v: string }).v;
      i++;
      const r = factor();
      if (op === '/' && r.v === 0) fail();
      left = { v: op === '*' ? left.v * r.v : left.v / r.v, pct: false };
    }
    return left;
  }
  function sum(): number {
    let v = term().v;
    while (toks![i]?.t === 'op' && ((toks![i] as { v: string }).v === '+' || (toks![i] as { v: string }).v === '-')) {
      const op = (toks![i] as { v: string }).v;
      i++;
      const r = term();
      const amt = r.pct ? v * r.v : r.v;
      v = op === '+' ? v + amt : v - amt;
    }
    return v;
  }

  try {
    const v = sum();
    if (i !== toks.length || !Number.isFinite(v)) return null;
    // Trim floating-point noise such as 0.1 + 0.2 = 0.30000000000000004.
    return Math.round(v * 1e10) / 1e10;
  } catch {
    return null;
  }
}

/** Shows a result the way people write money: 12,345.6 (up to 4 decimals, no trailing zeros). */
export function formatResult(v: number): string {
  return v.toLocaleString('en-AU', { maximumFractionDigits: 4 });
}

/** The value to drop into a numeric answer box: plain digits, rounded to cents. */
export function answerValue(v: number): string {
  return String(Math.round(v * 100) / 100);
}

/** Show the calculator on number questions, and on any question whose wording has dollar amounts or percentages. */
export function isMathsQuestion(q: { qtype: string; prompt: string }): boolean {
  return q.qtype === 'numeric' || q.qtype === 'slider' || /\$\s?\d|\d\s?%/.test(q.prompt);
}
