/**
 * Lesson validator: schema, 8-step template, screen and word limits,
 * question count and mix, answer + explanation on every question, maths
 * of numeric answers, fact and glossary references.
 *
 *   npm run validate              # everything under content/
 *   npm run validate -- 1.3       # just one lesson (write one, validate, repeat)
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { Course, Facts, Glossary } from '../src/content/schema';
import { validateCheck, validateLesson, lessonQuestions, type Ctx } from '../src/content/rules';

const root = join(import.meta.dirname, '..', 'content');
const read = (p: string) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const only = process.argv[2];
const errors: string[] = [];
const course = Course.parse(read('course.json'));
const facts = Facts.parse(read('facts.json'));
const glossary = Glossary.parse(read('glossary.json'));
const concepts = Glossary.parse(read('concepts.json'));
const ctx: Ctx = { facts: facts.facts, glossary, seenIds: new Set() };

let lessonsOk = 0;
const summary: string[] = [];
for (const unit of course.units) {
  const dir = `unit${unit.id}`;
  if (!existsSync(join(root, dir))) continue;
  const files = new Set(readdirSync(join(root, dir)));
  for (const l of unit.lessons) {
    const f = `${l.id}.json`;
    if (!files.has(f)) {
      if (unit.id === 1 && !only) errors.push(`${dir}/${f}: missing (Unit 1 must be complete)`);
      continue;
    }
    if (only && only !== l.id) continue;
    const { errors: e, lesson } = validateLesson(read(join(dir, f)), ctx, `${dir}/${f}`);
    if (lesson && lesson.id !== l.id) e.push(`${dir}/${f}: id ${lesson.id} does not match course.json ${l.id}`);
    if (lesson && lesson.title !== l.title) e.push(`${dir}/${f}: title differs from course.json`);
    if (lesson) for (const q of [...lessonQuestions(lesson), ...lesson.reviewBank]) if (!concepts[q.concept]) e.push(`${dir}/${f} [${q.id}]: concept "${q.concept}" has no label in concepts.json`);
    errors.push(...e);
    if (lesson) {
      const qs = lessonQuestions(lesson);
      const words = lesson.screens.length;
      summary.push(
        `  ${l.id.padEnd(5)} ${lesson.title.padEnd(38)} ${String(words).padStart(2)} screens  ${String(qs.length).padStart(2)} q  ${new Set(qs.map((q) => q.qtype)).size} types  +${lesson.reviewBank.length} review  ${e.length ? 'FAIL' : 'ok'}`,
      );
      if (!e.length) lessonsOk++;
    }
  }
  if (!only && files.has('check.json')) {
    const { errors: e, check } = validateCheck(read(join(dir, 'check.json')), ctx, `${dir}/check.json`);
    errors.push(...e);
    if (check) summary.push(`  check ${check.title.padEnd(38)} ${check.questions.length} q  pass ${check.passPct}%  ${e.length ? 'FAIL' : 'ok'}`);
  } else if (!only && unit.id === 1) errors.push(`${dir}/check.json: missing unit check`);
}

console.log(summary.join('\n'));
if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n` + errors.map((e) => ' - ' + e).join('\n'));
  process.exit(1);
}
console.log(`\nContent valid: ${lessonsOk} lesson(s) passed.`);
