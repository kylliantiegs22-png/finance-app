import { expect, type Page } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

type Q = Record<string, any>;
const root = join(import.meta.dirname, '..', '..', 'content');

/** Every question in the content, by id, so the test can answer whatever is on screen. */
export function questionIndex(): Record<string, Q> {
  const out: Record<string, Q> = {};
  for (const dir of readdirSync(root).filter((d) => d.startsWith('unit'))) {
    for (const f of readdirSync(join(root, dir))) {
      const j = JSON.parse(readFileSync(join(root, dir, f), 'utf8'));
      const qs: Q[] = [...(j.questions ?? []), ...(j.reviewBank ?? []), ...(j.screens ?? []).filter((s: Q) => s.kind === 'question').map((s: Q) => s.q)];
      for (const q of qs) out[q.id] = q;
    }
  }
  return out;
}

export const Q = questionIndex();

/** Answer the question on screen correctly (or deliberately wrong). */
export async function answer(page: Page, q: Q, opts: { wrong?: boolean } = {}) {
  const wrong = !!opts.wrong;
  switch (q.qtype) {
    case 'mcq':
    case 'blank':
      await page.locator(`[data-opt="${wrong ? (q.answer + 1) % q.options.length : q.answer}"]`).click();
      break;
    case 'truefalse':
      await page.locator(`[data-opt="${wrong ? !q.answer : q.answer}"]`).click();
      break;
    case 'numeric':
      await page.getByTestId('numeric-input').fill(String(wrong ? q.answer + 1000 : q.answer));
      break;
    case 'slider': {
      const v = wrong ? (q.answer - q.min > q.max - q.answer ? q.min : q.max) : q.answer;
      await page.getByTestId('slider-input').fill(String(v));
      break;
    }
    case 'match':
      for (let i = 0; i < q.pairs.length; i++) {
        await page.locator(`[data-left="${i}"]`).click();
        const r = wrong ? (i + 1) % q.pairs.length : i;
        await page.locator(`[data-right="${r}"]`).click();
      }
      break;
    case 'order': {
      const idx = q.items.map((_: unknown, i: number) => i);
      if (wrong) idx.reverse();
      for (const i of idx) await page.locator(`[data-item="${i}"]`).click();
      break;
    }
    case 'sort':
      for (let i = 0; i < q.items.length; i++) {
        const b = wrong && i === 0 ? 1 - q.items[i].bucket : q.items[i].bucket;
        await page.locator(`[data-sort="${i}-${b}"]`).click();
      }
      break;
    case 'tap':
      await page.locator(`[data-row="${wrong ? (q.answer + 1) % q.visual.rows.length : q.answer}"]`).click();
      break;
    default:
      throw new Error(`unknown qtype ${q.qtype}`);
  }
}

/**
 * Drive a session to the end. `wrongIds` are answered wrong the first time
 * (they get re-queued and are then answered correctly). Calls `onScreen` with
 * each screen so callers can take screenshots.
 */
export async function playSession(page: Page, opts: { stopAfter?: number; wrongIds?: string[]; wrongCount?: number; onScreen?: (info: { kind: string; qid?: string; fb?: boolean; i: number }) => Promise<void> } = {}) {
  const wrongOnce = new Set(opts.wrongIds ?? []);
  let wrongLeft = opts.wrongCount ?? 0;
  for (let i = 0; i < 80; i++) {
    if (opts.stopAfter !== undefined && i >= opts.stopAfter) return;
    const session = page.getByTestId('session');
    if (!(await session.isVisible().catch(() => false))) return;
    const kind = await session.getAttribute('data-kind');
    await page.waitForTimeout(opts.onScreen ? 420 : 0); // let entry motion settle before screenshots
    if (kind !== 'question') {
      await opts.onScreen?.({ kind: kind!, i });
      if (kind === 'apply') await page.locator('.mission').click();
      await page.getByTestId('continue').click();
      continue;
    }
    const qid = (await page.locator('[data-qid]').getAttribute('data-qid'))!;
    const q = Q[qid];
    expect(q, `question ${qid} in content`).toBeTruthy();
    const wrong = wrongOnce.has(qid) || wrongLeft > 0;
    if (wrongOnce.has(qid)) wrongOnce.delete(qid);
    else if (wrongLeft > 0) wrongLeft--;
    await opts.onScreen?.({ kind: 'question', qid, i });
    await answer(page, q, { wrong });
    await page.getByTestId('check-sure').click();
    await expect(page.getByTestId('feedback')).toBeVisible();
    await opts.onScreen?.({ kind: 'question', qid, fb: true, i });
    await page.getByTestId('feedback').getByTestId('continue').click();
  }
  throw new Error('session did not finish');
}

export async function onboard(page: Page) {
  await page.getByTestId('ob-start').click();
  await page.locator('[data-opt="1"]').click();
  await page.getByTestId('ob-check').click();
  await page.getByTestId('ob-next').click();
  await page.locator('[data-goal="invest"]').click();
  await page.getByTestId('ob-next').click();
  await page.getByTestId('ob-next').click();
  await page.getByTestId('habit-cue').fill('my morning coffee');
  const dl = page.waitForEvent('download');
  await page.getByTestId('ob-ics').click();
  const file = await dl;
  expect(file.suggestedFilename()).toBe('tally-daily-lesson.ics');
  await page.getByTestId('ob-next').click();
  await page.getByTestId('ob-finish').click();
  await expect(page.getByTestId('path')).toBeVisible();
}

export async function readNum(page: Page, id: string) {
  return Number((await page.getByTestId(id).first().textContent())?.replace(/[^0-9]/g, ''));
}

/** Any uncaught page error or console error fails the test. */
export function failOnErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));
  return () => expect(errors, 'uncaught page errors').toEqual([]);
}
