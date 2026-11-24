/**
 * Content rules beyond the schema: the 8-step template, screen and word
 * limits, question mix, answer checks and fact/glossary references.
 * Used by scripts/validate-content.ts and by unit tests.
 */
import { Lesson, Question, STEPS, UnitCheck, type Facts, type Step } from './schema';
import { evalArithmetic, factKeys, plain, termKeys, wordCount } from './text';

export const LIMITS = {
  screensMin: 12,
  screensMax: 16,
  questionsMin: 9,
  qtypesMin: 4,
  wordsPerTextScreen: 60,
  wordsExplanation: 35,
  wordsRecapBullet: 16,
  steps: {
    hook: [1, 1],
    try: [1, 2],
    core: [1, 3],
    example: [1, 2],
    guided: [3, 5],
    independent: [2, 4],
    apply: [1, 1],
    recap: [1, 1],
  } as Record<Step, [number, number]>,
};

export interface Ctx {
  facts: Facts['facts'];
  glossary: Record<string, string>;
  seenIds?: Set<string>;
}

function refsCheck(text: string, ctx: Ctx, where: string, errs: string[]) {
  for (const k of factKeys(text)) if (!ctx.facts[k]) errs.push(`${where}: unknown fact {{${k}}}`);
  for (const k of termKeys(text)) if (!ctx.glossary[k]) errs.push(`${where}: glossary term "${k}" not in glossary.json`);
}

function safePlain(text: string, ctx: Ctx) {
  try {
    return plain(text, ctx.facts);
  } catch {
    return text;
  }
}

export function checkQuestion(q: Question, ctx: Ctx, where: string): string[] {
  const errs: string[] = [];
  const w = `${where} [${q.id}]`;
  if (ctx.seenIds) {
    if (ctx.seenIds.has(q.id)) errs.push(`${w}: duplicate question id`);
    ctx.seenIds.add(q.id);
  }
  const texts = [q.prompt, q.explanation, q.hint ?? ''];
  if ('sentence' in q) texts.push(q.sentence);
  if ('options' in q) for (const o of q.options) texts.push(typeof o === 'string' ? o : o.text + ' ' + (o.why ?? ''));
  for (const t of texts) refsCheck(t, ctx, w, errs);

  const promptWords = wordCount(safePlain(q.prompt + ' ' + ('sentence' in q ? q.sentence : ''), ctx));
  if (promptWords > LIMITS.wordsPerTextScreen) errs.push(`${w}: prompt has ${promptWords} words (max ${LIMITS.wordsPerTextScreen})`);
  const ew = wordCount(safePlain(q.explanation, ctx));
  if (ew > LIMITS.wordsExplanation) errs.push(`${w}: explanation has ${ew} words (max ${LIMITS.wordsExplanation})`);

  switch (q.qtype) {
    case 'mcq': {
      if (q.answer < 0 || q.answer >= q.options.length) errs.push(`${w}: answer index out of range`);
      const set = new Set(q.options.map((o) => o.text.toLowerCase()));
      if (set.size !== q.options.length) errs.push(`${w}: duplicate options`);
      break;
    }
    case 'blank': {
      if (q.answer < 0 || q.answer >= q.options.length) errs.push(`${w}: answer index out of range`);
      if (q.sentence.split('___').length !== 2) errs.push(`${w}: sentence needs exactly one ___`);
      if (new Set(q.options).size !== q.options.length) errs.push(`${w}: duplicate options`);
      break;
    }
    case 'numeric':
    case 'slider': {
      if (q.calc !== undefined) {
        let v: number;
        try {
          v = evalArithmetic(q.calc);
          if (Math.abs(v - q.answer) > Math.max(q.tolerance ?? 0, 1e-6)) errs.push(`${w}: calc "${q.calc}" = ${v}, but answer is ${q.answer}`);
        } catch (e) {
          errs.push(`${w}: ${(e as Error).message}`);
        }
      } else if (q.qtype === 'numeric') {
        errs.push(`${w}: numeric questions need a "calc" so the maths is checked`);
      }
      if (q.qtype === 'slider') {
        if (q.answer < q.min || q.answer > q.max) errs.push(`${w}: answer outside slider range`);
        if (q.min >= q.max) errs.push(`${w}: slider min >= max`);
      }
      break;
    }
    case 'match': {
      const l = new Set(q.pairs.map((p) => p[0]));
      const r = new Set(q.pairs.map((p) => p[1]));
      if (l.size !== q.pairs.length || r.size !== q.pairs.length) errs.push(`${w}: match pairs must be distinct`);
      break;
    }
    case 'order': {
      if (new Set(q.items).size !== q.items.length) errs.push(`${w}: order items must be distinct`);
      break;
    }
    case 'sort': {
      const b0 = q.items.filter((i) => i.bucket === 0).length;
      if (b0 === 0 || b0 === q.items.length) errs.push(`${w}: both sort buckets need items`);
      break;
    }
    case 'tap': {
      const v = q.visual;
      if (!v || !(v.type === 'payslip' || v.type === 'statement' || v.type === 'ledger')) errs.push(`${w}: tap needs a payslip, statement or ledger visual`);
      else if (q.answer < 0 || q.answer >= v.rows.length) errs.push(`${w}: tap answer out of range`);
      break;
    }
    case 'truefalse':
      break;
  }
  if (q.visual) checkVisual(q.visual, ctx, w, errs);
  return errs;
}

function checkVisual(v: NonNullable<Question['visual']>, ctx: Ctx, w: string, errs: string[]) {
  if (v.type === 'ledger' || v.type === 'payslip')
    for (const r of v.rows as { amount: number; fact?: string; label: string }[]) {
      if (!r.fact) continue;
      const f = ctx.facts[r.fact];
      if (!f) errs.push(`${w}: row "${r.label}" references unknown fact ${r.fact}`);
      else if (f.value !== r.amount) errs.push(`${w}: row "${r.label}" is ${r.amount} but fact ${r.fact} is ${f.value}`);
    }
  if (v.type === 'split') {
    const sum = v.segments.reduce((a, s) => a + s.pct, 0);
    if (Math.abs(sum - 100) > 0.5) errs.push(`${w}: split segments sum to ${sum}%`);
  }
  if (v.type === 'ledger' && v.total) {
    const sum = v.rows.reduce((a, r) => a + (r.tone === 'debt' || r.tone === 'cost' ? -Math.abs(r.amount) : r.amount), 0);
    if (Math.abs(sum - v.total.amount) > 0.01) errs.push(`${w}: ledger total ${v.total.amount} != rows ${sum}`);
  }
  if (v.type === 'payslip') {
    const earn = v.rows.filter((r) => r.kind === 'earn').reduce((a, r) => a + r.amount, 0);
    const ded = v.rows.filter((r) => r.kind === 'deduct').reduce((a, r) => a + r.amount, 0);
    if (Math.abs(earn - ded - v.net) > 0.01) errs.push(`${w}: payslip net ${v.net} != earnings - deductions ${earn - ded}`);
  }
  if (v.type === 'steps') for (const l of v.lines) refsCheck(l, ctx, w, errs);
  if (v.type === 'stat') refsCheck(v.value + ' ' + v.label, ctx, w, errs);
  if (v.type === 'compare') for (const it of v.items) for (const p of it.points) refsCheck(p, ctx, w, errs);
}

export function lessonQuestions(lesson: Lesson): Question[] {
  return lesson.screens.flatMap((s) => (s.kind === 'question' ? [s.q] : []));
}

export function validateLesson(raw: unknown, ctx: Ctx, file = 'lesson'): { errors: string[]; lesson?: Lesson } {
  const parsed = Lesson.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.issues.map((i) => `${file}: schema ${i.path.join('.')}: ${i.message}`) };
  }
  const lesson = parsed.data;
  const errs: string[] = [];
  const W = `${file} (${lesson.id})`;
  const n = lesson.screens.length;
  if (n < LIMITS.screensMin || n > LIMITS.screensMax) errs.push(`${W}: ${n} screens (need ${LIMITS.screensMin}-${LIMITS.screensMax})`);

  // Template order and step counts
  let lastIdx = 0;
  const counts = Object.fromEntries(STEPS.map((s) => [s, 0])) as Record<Step, number>;
  lesson.screens.forEach((s, i) => {
    const idx = STEPS.indexOf(s.step);
    if (idx < lastIdx) errs.push(`${W}: screen ${i + 1} step "${s.step}" is out of template order`);
    lastIdx = Math.max(lastIdx, idx);
    counts[s.step]++;
  });
  for (const st of STEPS) {
    const [lo, hi] = LIMITS.steps[st];
    if (counts[st] < lo || counts[st] > hi) errs.push(`${W}: step "${st}" has ${counts[st]} screens (need ${lo}-${hi})`);
  }
  const byStep = (st: Step) => lesson.screens.filter((s) => s.step === st);
  if (byStep('hook').some((s) => s.kind !== 'question')) errs.push(`${W}: hook must be a question the learner can guess at`);
  if (byStep('try').some((s) => s.kind !== 'question')) errs.push(`${W}: try-it screens must be questions`);
  if (!byStep('core').some((s) => s.kind === 'teach')) errs.push(`${W}: core idea needs a teach screen`);
  if (!byStep('example').some((s) => s.kind === 'teach')) errs.push(`${W}: worked example needs a teach screen`);
  for (const st of ['guided', 'independent'] as const)
    if (byStep(st).some((s) => s.kind !== 'question')) errs.push(`${W}: ${st} screens must be questions`);
  if (lesson.screens[n - 1]?.kind !== 'recap') errs.push(`${W}: last screen must be the recap`);

  const qs = lessonQuestions(lesson);
  if (qs.length < LIMITS.questionsMin) errs.push(`${W}: ${qs.length} questions (need >= ${LIMITS.questionsMin})`);
  const types = new Set(qs.map((q) => q.qtype));
  if (types.size < LIMITS.qtypesMin) errs.push(`${W}: only ${types.size} question types (need >= ${LIMITS.qtypesMin})`);

  const guided = byStep('guided').flatMap((s) => (s.kind === 'question' ? [s.q] : []));
  const indep = byStep('independent').flatMap((s) => (s.kind === 'question' ? [s.q] : []));
  if (guided.filter((q) => q.hint).length < 2) errs.push(`${W}: guided practice needs hints on at least 2 questions`);
  if (indep.some((q) => q.hint)) errs.push(`${W}: independent practice must have no hints`);
  if (!indep.some((q) => q.qtype === 'numeric')) errs.push(`${W}: independent practice needs a typed (numeric) answer`);

  // Text limits
  lesson.screens.forEach((s, i) => {
    const where = `${W} screen ${i + 1}`;
    if (s.kind === 'teach') {
      const extra = s.visual?.type === 'steps' ? s.visual.lines.join(' ') : '';
      const words = wordCount(safePlain(`${s.title} ${s.body} ${extra}`, ctx));
      if (words > LIMITS.wordsPerTextScreen) errs.push(`${where}: ${words} words (max ${LIMITS.wordsPerTextScreen})`);
      refsCheck(s.title + ' ' + s.body, ctx, where, errs);
      if (s.visual) checkVisual(s.visual, ctx, where, errs);
    } else if (s.kind === 'apply') {
      const words = wordCount(safePlain(`${s.title} ${s.body} ${s.action}`, ctx));
      if (words > LIMITS.wordsPerTextScreen) errs.push(`${where}: ${words} words (max ${LIMITS.wordsPerTextScreen})`);
      refsCheck(s.title + ' ' + s.body + ' ' + s.action, ctx, where, errs);
    } else if (s.kind === 'recap') {
      for (const b of s.bullets) {
        const words = wordCount(safePlain(b, ctx));
        if (words > LIMITS.wordsRecapBullet) errs.push(`${where}: recap bullet has ${words} words (max ${LIMITS.wordsRecapBullet})`);
        refsCheck(b, ctx, where, errs);
      }
    } else {
      errs.push(...checkQuestion(s.q, ctx, where));
    }
  });

  const concepts = new Set(qs.map((q) => q.concept));
  lesson.reviewBank.forEach((q, i) => {
    errs.push(...checkQuestion(q, ctx, `${W} reviewBank ${i + 1}`));
    if (!concepts.has(q.concept)) errs.push(`${W} reviewBank ${i + 1}: concept "${q.concept}" is not taught in this lesson`);
  });
  return { errors: errs, lesson };
}

export function validateCheck(raw: unknown, ctx: Ctx, file = 'check'): { errors: string[]; check?: UnitCheck } {
  const parsed = UnitCheck.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.issues.map((i) => `${file}: schema ${i.path.join('.')}: ${i.message}`) };
  const check = parsed.data;
  const errs: string[] = [];
  check.questions.forEach((q, i) => errs.push(...checkQuestion(q, ctx, `${file} q${i + 1}`)));
  const concepts = new Set(check.questions.map((q) => q.concept));
  if (concepts.size < 6) errs.push(`${file}: unit check covers only ${concepts.size} concepts (need >= 6)`);
  if (new Set(check.questions.map((q) => q.qtype)).size < 3) errs.push(`${file}: unit check needs >= 3 question types`);
  return { errors: errs, check };
}

export { Question };
