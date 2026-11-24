/**
 * Tiny markup used in lesson text:
 *   **bold**           emphasis
 *   [[term]]           tap-to-define glossary term (or [[shown text|term]])
 *   {{factKey}}        value from content/facts.json (yearly-changing figures)
 */
import type { Facts } from './schema';

export const FACT_RE = /\{\{([a-zA-Z0-9_]+)\}\}/g;
export const TERM_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

export function resolveFacts(text: string, facts: Facts['facts']): string {
  return text.replace(FACT_RE, (_, k: string) => {
    const f = facts[k];
    if (!f) throw new Error(`Unknown fact {{${k}}}`);
    return f.display;
  });
}

/** Plain text: facts resolved, markup stripped. */
export function plain(text: string, facts: Facts['facts']): string {
  return resolveFacts(text, facts)
    .replace(TERM_RE, (_, a: string) => a)
    .replace(/\*\*/g, '');
}

export function wordCount(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).filter((w) => /[A-Za-z0-9$%]/.test(w)).length;
}

export function factKeys(text: string): string[] {
  return [...text.matchAll(FACT_RE)].map((m) => m[1]);
}

export function termKeys(text: string): string[] {
  return [...text.matchAll(TERM_RE)].map((m) => (m[2] ?? m[1]).toLowerCase());
}

export type Token =
  | { t: 'text'; v: string }
  | { t: 'bold'; v: string }
  | { t: 'term'; v: string; key: string };

/** Tokenise for rendering (facts are resolved first). */
export function tokenize(text: string, facts: Facts['facts']): Token[] {
  const src = resolveFacts(text, facts);
  const out: Token[] = [];
  const re = /\*\*([^*]+)\*\*|\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  let last = 0;
  for (const m of src.matchAll(re)) {
    if (m.index! > last) out.push({ t: 'text', v: src.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ t: 'bold', v: m[1] });
    else out.push({ t: 'term', v: m[2], key: (m[3] ?? m[2]).toLowerCase() });
    last = m.index! + m[0].length;
  }
  if (last < src.length) out.push({ t: 'text', v: src.slice(last) });
  return out;
}

/** Safe arithmetic evaluator for numeric-answer checks: + - * / ( ) and numbers. */
export function evalArithmetic(expr: string): number {
  const s = expr.replace(/,/g, '').replace(/\s+/g, '');
  let i = 0;
  const peek = () => s[i];
  function num(): number {
    if (peek() === '(') {
      i++;
      const v = add();
      if (s[i++] !== ')') throw new Error(`Bad expression: ${expr}`);
      return v;
    }
    if (peek() === '-') {
      i++;
      return -num();
    }
    const m = /^\d+(\.\d+)?/.exec(s.slice(i));
    if (!m) throw new Error(`Bad expression: ${expr}`);
    i += m[0].length;
    return parseFloat(m[0]);
  }
  function mul(): number {
    let v = num();
    while (peek() === '*' || peek() === '/') {
      const op = s[i++];
      const r = num();
      v = op === '*' ? v * r : v / r;
    }
    return v;
  }
  function add(): number {
    let v = mul();
    while (peek() === '+' || peek() === '-') {
      const op = s[i++];
      const r = mul();
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }
  const v = add();
  if (i !== s.length) throw new Error(`Bad expression: ${expr}`);
  return v;
}

/** Parse a learner's typed number: accepts "1,200", "$1200", "12.5%". */
export function parseTypedNumber(input: string): number | null {
  const s = input.replace(/[\s,$%]/g, '').replace(/^A\$/i, '');
  if (!/^-?\d*\.?\d+$/.test(s)) return null;
  return parseFloat(s);
}
