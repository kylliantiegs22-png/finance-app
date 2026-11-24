/** Loads all content JSON at build time. Adding a lesson = adding content/unitN/N.M.json. */
import courseJson from '../../content/course.json';
import factsJson from '../../content/facts.json';
import glossaryJson from '../../content/glossary.json';
import conceptsJson from '../../content/concepts.json';
import type { Course, Facts, Lesson, Question, UnitCheck } from '../content/schema';

export const course = courseJson as Course;
export const facts = (factsJson as Facts).facts;
export const glossary = glossaryJson as Record<string, string>;

const lessonFiles = import.meta.glob<Lesson>('../../content/unit*/*.*.json', { eager: true, import: 'default' });
const checkFiles = import.meta.glob<UnitCheck>('../../content/unit*/check.json', { eager: true, import: 'default' });

export const lessons: Record<string, Lesson> = {};
for (const l of Object.values(lessonFiles)) lessons[l.id] = withDefaults(l);
export const checks: Record<number, UnitCheck> = {};
for (const c of Object.values(checkFiles)) checks[c.unit] = { ...c, questions: c.questions.map(qDefaults) };

function qDefaults(q: Question): Question {
  if (q.qtype === 'numeric' && q.tolerance === undefined) return { ...q, tolerance: 0 };
  return q;
}
function withDefaults(l: Lesson): Lesson {
  return {
    ...l,
    reviewBank: (l.reviewBank ?? []).map(qDefaults),
    screens: l.screens.map((s) => (s.kind === 'question' ? { ...s, q: qDefaults(s.q) } : s)),
  };
}

export function unitById(id: number) {
  return course.units.find((u) => u.id === id)!;
}

export function lessonQuestions(l: Lesson): Question[] {
  return l.screens.flatMap((s) => (s.kind === 'question' ? [s.q] : []));
}

/** All questions per concept (review variants first), with the lesson they belong to. */
export const conceptBank: Record<string, { lesson: string; questions: Question[] }> = {};
for (const l of Object.values(lessons)) {
  const add = (q: Question, front: boolean) => {
    const e = (conceptBank[q.concept] ??= { lesson: l.id, questions: [] });
    if (front) e.questions.unshift(q);
    else e.questions.push(q);
  };
  // Lesson questions from practice steps only (hook/try are pre-teaching guesses).
  for (const s of l.screens) if (s.kind === 'question' && s.step !== 'hook' && s.step !== 'try') add(s.q, false);
  for (const q of l.reviewBank) add(q, true);
}

export function conceptsOfLesson(l: Lesson): string[] {
  return [...new Set(lessonQuestions(l).map((q) => q.concept))];
}

/** Human labels for concepts (skill map, review). */
export const conceptLabels = conceptsJson as Record<string, string>;
