import { z } from 'zod';

/**
 * Lesson content schema. Shared by the app (types) and the validator
 * (scripts/validate-content.ts). Lessons are pure data: adding a unit is
 * adding JSON files that pass this schema plus the rules in rules.ts.
 */

export const STEPS = ['hook', 'try', 'core', 'example', 'guided', 'independent', 'apply', 'recap'] as const;
export type Step = (typeof STEPS)[number];

const money = z.number();

// ---- Visuals: small finance "kit" drawn in the palette --------------------
const LedgerRow = z.object({
  label: z.string(),
  amount: money,
  tone: z.enum(['asset', 'debt', 'income', 'cost', 'neutral']).optional(),
  note: z.string().optional(),
  /** Key in facts.json this amount must equal (yearly-changing figures). */
  fact: z.string().optional(),
});

export const Visual = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ledger'),
    title: z.string().optional(),
    rows: z.array(LedgerRow).min(1).max(8),
    total: z.object({ label: z.string(), amount: money }).optional(),
  }),
  z.object({
    type: z.literal('payslip'),
    employer: z.string(),
    period: z.string(),
    rows: z.array(z.object({ label: z.string(), amount: money, kind: z.enum(['earn', 'deduct', 'info']), fact: z.string().optional() })).min(2).max(7),
    net: money,
  }),
  z.object({
    type: z.literal('statement'),
    title: z.string(),
    rows: z.array(z.object({ date: z.string(), desc: z.string(), amount: money })).min(2).max(8),
  }),
  z.object({
    type: z.literal('split'),
    title: z.string().optional(),
    segments: z
      .array(z.object({ label: z.string(), pct: z.number().min(0).max(100), amount: money.optional() }))
      .min(2)
      .max(5),
  }),
  z.object({ type: z.literal('steps'), lines: z.array(z.string()).min(2).max(6) }),
  z.object({ type: z.literal('stat'), value: z.string(), label: z.string() }),
  z.object({
    type: z.literal('compare'),
    items: z.array(z.object({ title: z.string(), icon: z.string().optional(), points: z.array(z.string()).min(1).max(3) })).min(2).max(3),
  }),
  z.object({ type: z.literal('icon'), name: z.string(), caption: z.string().optional() }),
]);
export type Visual = z.infer<typeof Visual>;

// ---- Questions ------------------------------------------------------------
const QBase = {
  id: z.string().regex(/^[a-z0-9-]+$/),
  concept: z.string().regex(/^[a-z0-9-]+$/),
  prompt: z.string().min(3),
  /** One-line "why" shown on the feedback sheet (right or wrong). */
  explanation: z.string().min(10),
  hint: z.string().optional(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  visual: Visual.optional(),
};

const Option = z.object({ text: z.string().min(1), why: z.string().optional() });

export const Question = z.discriminatedUnion('qtype', [
  z.object({ ...QBase, qtype: z.literal('mcq'), options: z.array(Option).min(2).max(4), answer: z.number().int() }),
  z.object({ ...QBase, qtype: z.literal('truefalse'), answer: z.boolean() }),
  z.object({
    ...QBase,
    qtype: z.literal('numeric'),
    answer: z.number(),
    tolerance: z.number().min(0).default(0),
    prefix: z.string().optional(),
    suffix: z.string().optional(),
    /** Arithmetic the validator re-computes, e.g. "4200 - 3150". */
    calc: z.string().optional(),
  }),
  z.object({
    ...QBase,
    qtype: z.literal('slider'),
    min: z.number(),
    max: z.number(),
    step: z.number().positive(),
    answer: z.number(),
    tolerance: z.number().min(0),
    prefix: z.string().optional(),
    suffix: z.string().optional(),
    calc: z.string().optional(),
  }),
  z.object({
    ...QBase,
    qtype: z.literal('blank'),
    /** Sentence containing exactly one "___". */
    sentence: z.string().includes('___'),
    options: z.array(z.string()).min(2).max(4),
    answer: z.number().int(),
  }),
  z.object({ ...QBase, qtype: z.literal('match'), pairs: z.array(z.tuple([z.string(), z.string()])).min(3).max(4) }),
  z.object({ ...QBase, qtype: z.literal('order'), items: z.array(z.string()).min(3).max(5) }),
  z.object({
    ...QBase,
    qtype: z.literal('sort'),
    buckets: z.tuple([z.string(), z.string()]),
    items: z.array(z.object({ text: z.string(), bucket: z.union([z.literal(0), z.literal(1)]) })).min(4).max(6),
  }),
  z.object({
    ...QBase,
    qtype: z.literal('tap'),
    /** Index of the row in the visual (payslip/statement/ledger) to tap. */
    answer: z.number().int(),
  }),
]);
export type Question = z.infer<typeof Question>;
export type QType = Question['qtype'];

// ---- Screens --------------------------------------------------------------
export const TeachScreen = z.object({
  kind: z.literal('teach'),
  step: z.enum(STEPS),
  title: z.string(),
  body: z.string(),
  visual: Visual.optional(),
});
export const QuestionScreen = z.object({ kind: z.literal('question'), step: z.enum(STEPS), q: Question });
export const ApplyScreen = z.object({
  kind: z.literal('apply'),
  step: z.literal('apply'),
  title: z.string(),
  body: z.string(),
  action: z.string(),
});
export const RecapScreen = z.object({
  kind: z.literal('recap'),
  step: z.literal('recap'),
  bullets: z.array(z.string()).length(3),
});
export const Screen = z.discriminatedUnion('kind', [TeachScreen, QuestionScreen, ApplyScreen, RecapScreen]);
export type Screen = z.infer<typeof Screen>;

export const Source = z.object({ name: z.string(), url: z.string().url() });

export const Lesson = z.object({
  id: z.string().regex(/^\d+\.\d+$/),
  unit: z.number().int().min(1),
  title: z.string(),
  objective: z.string(),
  minutes: z.number().min(3).max(8),
  sources: z.array(Source).min(1),
  screens: z.array(Screen),
  /** Extra variants per concept used by spaced review (asked in a new form). */
  reviewBank: z.array(Question).default([]),
});
export type Lesson = z.infer<typeof Lesson>;

export const UnitCheck = z.object({
  id: z.string(),
  unit: z.number().int(),
  title: z.string(),
  passPct: z.number().min(50).max(100),
  questions: z.array(Question).min(10).max(14),
});
export type UnitCheck = z.infer<typeof UnitCheck>;

export const Course = z.object({
  units: z.array(
    z.object({
      id: z.number().int(),
      title: z.string(),
      focus: z.string(),
      icon: z.string(),
      season: z.enum(['personal', 'investing', 'pro']),
      prereqs: z.array(z.number().int()),
      lessons: z.array(z.object({ id: z.string(), title: z.string(), objective: z.string() })),
      mission: z.string().optional(),
    }),
  ),
});
export type Course = z.infer<typeof Course>;

export const Fact = z.object({
  value: z.union([z.number(), z.string()]),
  display: z.string(),
  label: z.string(),
  fy: z.string(),
  source: Source,
  /** How the value was checked, and when. */
  verified: z.string(),
});
export const Facts = z.object({ updated: z.string(), facts: z.record(z.string(), Fact) });
export type Facts = z.infer<typeof Facts>;

export const Glossary = z.record(z.string(), z.string());
