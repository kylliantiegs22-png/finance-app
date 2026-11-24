import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { validateLesson, validateCheck } from '../../src/content/rules';
import facts from '../../content/facts.json';
import glossary from '../../content/glossary.json';

const ctx = () => ({ facts: facts.facts as never, glossary, seenIds: new Set<string>() });
const lesson = () => JSON.parse(readFileSync('content/unit1/1.2.json', 'utf8'));

describe('lesson validator', () => {
  it('accepts a real lesson', () => {
    expect(validateLesson(lesson(), ctx()).errors).toEqual([]);
  });
  it('rejects too many words on a text screen', () => {
    const l = lesson();
    const t = l.screens.find((s: { kind: string }) => s.kind === 'teach');
    t.body = 'word '.repeat(70);
    expect(validateLesson(l, ctx()).errors.join()).toMatch(/words \(max 60\)/);
  });
  it('rejects wrong maths on a numeric answer', () => {
    const l = lesson();
    const q = l.screens.find((s: { q?: { qtype: string } }) => s.q?.qtype === 'numeric').q;
    q.answer += 1;
    expect(validateLesson(l, ctx()).errors.join()).toMatch(/calc/);
  });
  it('rejects a missing explanation and out-of-range answers', () => {
    const l = lesson();
    const q = l.screens.find((s: { q?: { qtype: string } }) => s.q?.qtype === 'mcq').q;
    delete q.explanation;
    expect(validateLesson(l, ctx()).errors.join()).toMatch(/explanation/);
    const l2 = lesson();
    l2.screens.find((s: { q?: { qtype: string } }) => s.q?.qtype === 'mcq').q.answer = 9;
    expect(validateLesson(l2, ctx()).errors.join()).toMatch(/out of range/);
  });
  it('rejects too few questions and out-of-order steps', () => {
    const l = lesson();
    l.screens = l.screens.filter((s: { step: string }) => s.step !== 'independent');
    const errs = validateLesson(l, ctx()).errors.join('\n');
    expect(errs).toMatch(/questions \(need >= 9\)/);
    expect(errs).toMatch(/step "independent" has 0/);
    const l2 = lesson();
    [l2.screens[0], l2.screens[3]] = [l2.screens[3], l2.screens[0]];
    expect(validateLesson(l2, ctx()).errors.join()).toMatch(/out of template order/);
  });
  it('rejects unknown facts and glossary terms', () => {
    const l = lesson();
    l.screens[2].body += ' {{nope}} [[blorp]]';
    const errs = validateLesson(l, ctx()).errors.join();
    expect(errs).toMatch(/unknown fact/);
    expect(errs).toMatch(/glossary term "blorp"/);
  });
  it('validates the unit check', () => {
    const c = JSON.parse(readFileSync('content/unit1/check.json', 'utf8'));
    expect(validateCheck(c, ctx()).errors).toEqual([]);
    c.questions = c.questions.slice(0, 5);
    expect(validateCheck(c, ctx()).errors.length).toBeGreaterThan(0);
  });
});
