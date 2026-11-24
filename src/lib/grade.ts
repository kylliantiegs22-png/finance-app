import type { Question } from '../content/schema';
import { parseTypedNumber, plain } from '../content/text';
import { facts } from './content';

export type Answer =
  | { qtype: 'mcq' | 'blank' | 'tap'; v: number | null }
  | { qtype: 'truefalse'; v: boolean | null }
  | { qtype: 'numeric'; v: string }
  | { qtype: 'slider'; v: number | null }
  | { qtype: 'match'; v: Record<number, number> }
  | { qtype: 'order'; v: number[] }
  | { qtype: 'sort'; v: Record<number, 0 | 1> };

export function emptyAnswer(q: Question): Answer {
  switch (q.qtype) {
    case 'numeric':
      return { qtype: 'numeric', v: '' };
    case 'match':
      return { qtype: 'match', v: {} };
    case 'order':
      return { qtype: 'order', v: [] };
    case 'sort':
      return { qtype: 'sort', v: {} };
    case 'truefalse':
      return { qtype: 'truefalse', v: null };
    case 'slider':
      return { qtype: 'slider', v: null };
    default:
      return { qtype: q.qtype, v: null };
  }
}

export function isComplete(q: Question, a: Answer): boolean {
  switch (a.qtype) {
    case 'numeric':
      return parseTypedNumber(a.v) !== null;
    case 'match':
      return q.qtype === 'match' && Object.keys(a.v).length === q.pairs.length;
    case 'order':
      return q.qtype === 'order' && a.v.length === q.items.length;
    case 'sort':
      return q.qtype === 'sort' && Object.keys(a.v).length === q.items.length;
    default:
      return a.v !== null;
  }
}

export function isCorrect(q: Question, a: Answer): boolean {
  switch (q.qtype) {
    case 'mcq':
    case 'blank':
    case 'tap':
      return a.v === q.answer;
    case 'truefalse':
      return a.v === q.answer;
    case 'numeric': {
      const n = a.qtype === 'numeric' ? parseTypedNumber(a.v) : null;
      return n !== null && Math.abs(n - q.answer) <= (q.tolerance ?? 0) + 1e-9;
    }
    case 'slider':
      return typeof a.v === 'number' && Math.abs(a.v - q.answer) <= q.tolerance + 1e-9;
    case 'match':
      return a.qtype === 'match' && q.pairs.every((_, i) => a.v[i] === i);
    case 'order':
      return a.qtype === 'order' && a.v.length === q.items.length && a.v.every((v, i) => v === i);
    case 'sort':
      return a.qtype === 'sort' && q.items.every((it, i) => a.v[i] === it.bucket);
  }
}

export function fmtNum(n: number, prefix = '', suffix = ''): string {
  const money = prefix.includes('$');
  const s = Number.isInteger(n)
    ? n.toLocaleString('en-AU')
    : n.toLocaleString('en-AU', money ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumFractionDigits: 2 });
  return `${prefix}${s}${suffix}`;
}

/** Text of the right answer, for the "Not quite" sheet. */
export function correctText(q: Question): string | null {
  switch (q.qtype) {
    case 'mcq':
      return plain(q.options[q.answer].text, facts);
    case 'blank':
      return q.sentence.replace('___', q.options[q.answer]);
    case 'truefalse':
      return q.answer ? 'True' : 'False';
    case 'numeric':
      return fmtNum(q.answer, q.prefix, q.suffix);
    case 'slider':
      return q.tolerance ? `About ${fmtNum(q.answer, q.prefix, q.suffix)}` : fmtNum(q.answer, q.prefix, q.suffix);
    case 'tap':
      if (q.visual && 'rows' in q.visual) {
        const r = q.visual.rows[q.answer] as { label?: string; desc?: string };
        return r.label ?? r.desc ?? null;
      }
      return null;
    case 'order':
      return q.items.map((t, i) => `${i + 1}. ${t}`).join('  ');
    default:
      return null;
  }
}

/** Per-option "why" for a wrong mcq pick, if the author wrote one. */
export function wrongWhy(q: Question, a: Answer): string | null {
  if (q.qtype === 'mcq' && typeof a.v === 'number') return q.options[a.v]?.why ?? null;
  return null;
}

/** Deterministic shuffle so options keep a stable order per question. */
export function seededShuffle<T>(arr: T[], seed: string): T[] {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    const j = Math.abs(h) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
