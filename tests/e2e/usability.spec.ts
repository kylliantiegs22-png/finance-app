import { expect, test, type Page } from '@playwright/test';
import { answer, failOnErrors, Q } from './helpers';

const onboarded = { v: 1, onboarded: true, xp: 5 };

async function openLesson(page: Page, id: string) {
  await page.addInitScript((s) => {
    if (!sessionStorage.getItem('seeded')) {
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem('tally.v1', s);
    }
  }, JSON.stringify(onboarded));
  await page.goto(`/#/play/lesson/${id}`);
  await expect(page.getByTestId('session')).toBeVisible();
}

/** Click through the session until the given question is on screen. */
async function skipTo(page: Page, qid: string) {
  for (let i = 0; i < 40; i++) {
    const kind = await page.getByTestId('session').getAttribute('data-kind');
    if (kind === 'question') {
      const cur = await page.locator('[data-qid]').getAttribute('data-qid');
      if (cur === qid) return;
      await answer(page, Q[cur!]);
      await page.getByTestId('check-sure').click();
      await page.getByTestId('feedback').getByTestId('continue').click();
    } else {
      await page.getByTestId('continue').click();
    }
  }
  throw new Error(`never reached ${qid}`);
}

test('feedback sheet never hides the end of a long question (marked answers stay readable)', async ({ page }) => {
  const ok = failOnErrors(page);
  await openLesson(page, '1.1');
  await skipTo(page, 'u1l1-i-3'); // 4-row sort
  await answer(page, Q['u1l1-i-3'], { wrong: true });
  await page.getByTestId('check-sure').click();
  const sheet = page.getByTestId('feedback');
  await expect(sheet).toBeVisible();
  await page.waitForTimeout(400);
  const body = page.locator('.session-body');
  await body.evaluate((el) => el.scrollTo({ top: el.scrollHeight }));
  const last = page.locator('.sort-row').last();
  const lastBox = (await last.boundingBox())!;
  const sheetBox = (await sheet.boundingBox())!;
  expect(lastBox.y + lastBox.height).toBeLessThanOrEqual(sheetBox.y + 1);
  ok();
});

test('onboarding level choice makes no promise the app cannot keep', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('ob-start').click();
  await page.locator('[data-opt="1"]').click();
  await page.getByTestId('ob-check').click();
  await page.getByTestId('ob-next').click();
  await page.locator('[data-goal="invest"]').click();
  await page.getByTestId('ob-next').click();
  const basics = page.locator('[data-level="basics"]');
  await expect(basics).toBeVisible();
  await expect(basics).not.toContainText(/skip ahead/i);
  await expect(basics).not.toContainText(/passing its check/i);
});

test('a missed question comes back before the "Your money" screen, so the lesson ends apply then recap', async ({ page }) => {
  const ok = failOnErrors(page);
  await openLesson(page, '1.1');
  const seen: string[] = [];
  for (let i = 0; i < 60; i++) {
    const session = page.getByTestId('session');
    if (!(await session.isVisible().catch(() => false))) break;
    const kind = (await session.getAttribute('data-kind'))!;
    if (kind !== 'question') {
      seen.push(kind);
      if (kind === 'apply') await page.locator('.mission').click();
      await page.getByTestId('continue').click();
      continue;
    }
    const qid = (await page.locator('[data-qid]').getAttribute('data-qid'))!;
    // miss the very last practice question, so its retry would land after "apply" in the old code
    const first = !seen.includes('missed');
    const wrong = qid === 'u1l1-i-3' && first;
    if (wrong) seen.push('missed');
    seen.push(`q:${qid}`);
    await answer(page, Q[qid], { wrong });
    await page.getByTestId('check-sure').click();
    await expect(page.getByTestId('feedback')).toBeVisible();
    await page.getByTestId('feedback').getByTestId('continue').click();
  }
  const lastQuestion = seen.map((s, i) => (s.startsWith('q:') ? i : -1)).reduce((a, b) => Math.max(a, b), -1);
  const applyAt = seen.indexOf('apply');
  expect(applyAt).toBeGreaterThan(lastQuestion); // nothing is asked after the apply screen
  expect(seen.filter((s) => s === 'q:u1l1-i-3')).toHaveLength(2); // and it did come back
  await expect(page.getByTestId('complete')).toBeVisible();
  ok();
});

test('apply screen promises only what the app does', async ({ page }) => {
  await openLesson(page, '1.1');
  for (let i = 0; i < 40; i++) {
    const kind = await page.getByTestId('session').getAttribute('data-kind');
    if (kind === 'apply') break;
    if (kind === 'question') {
      const qid = (await page.locator('[data-qid]').getAttribute('data-qid'))!;
      await answer(page, Q[qid]);
      await page.getByTestId('check-sure').click();
      await page.getByTestId('feedback').getByTestId('continue').click();
    } else await page.getByTestId('continue').click();
  }
  await page.locator('.mission').click();
  const cta = page.locator('.mission-cta');
  await expect(cta).toContainText('Profile');
  await expect(cta).not.toContainText(/we'll ask/i);
});

test('when every ready lesson is done, Home says so and what to do next', async ({ page }) => {
  const nodes: Record<string, unknown> = {};
  for (const id of ['1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8', '1.review', '1.check']) nodes[id] = { at: '2026-11-20T08:00:00.000Z', score: 90, best: 90, runs: 1 };
  await page.addInitScript((s) => localStorage.setItem('tally.v1', s), JSON.stringify({ v: 1, onboarded: true, xp: 600, completed: nodes, passedUnits: [1] }));
  await page.goto('/');
  const note = page.getByTestId('all-done');
  await expect(note).toBeVisible();
  await expect(note).toContainText(/more units are being written/i);
});

test('the pay-cycle question teaches weekly pay x 52 / 12, not x 4', async () => {
  const q = Q['u1l4-g-4'];
  expect(q.answer).toBeCloseTo((420 * 52) / 12, 5);
  expect(q.explanation).toMatch(/52/);
});

test('the goal chosen in onboarding is reflected on the path, as promised', async ({ page }) => {
  for (const [goal, unit, others] of [
    ['debt', 3, [4, 6]],
    ['pay', 4, [3, 6]],
    ['invest', 6, [3, 4]],
  ] as const) {
    await page.goto('/');
    await page.evaluate((s) => localStorage.setItem('tally.v1', s), JSON.stringify({ v: 1, onboarded: true, xp: 5, profile: { goal } }));
    await page.reload();
    await expect(page.getByTestId(`unit-${unit}`).locator('.goal-tag')).toContainText('Your goal');
    for (const o of others) await expect(page.getByTestId(`unit-${o}`).locator('.goal-tag')).toHaveCount(0);
  }
});

test('Home names the daily target the learner chose (5, 10 or 15 minutes)', async ({ page }) => {
  for (const [xp, mins] of [[30, 5], [60, 10], [100, 15]] as const) {
    await page.goto('/');
    await page.evaluate((s) => localStorage.setItem('tally.v1', s), JSON.stringify({ v: 1, onboarded: true, xp: 5, profile: { dailyGoal: xp } }));
    await page.reload();
    await expect(page.locator('.today-title')).toHaveText(`Your ${mins} minutes`);
  }
});

test('the goal can be changed later in Profile and the path follows', async ({ page }) => {
  await page.goto('/');
  await page.evaluate((s) => localStorage.setItem('tally.v1', s), JSON.stringify({ v: 1, onboarded: true, xp: 5, profile: { goal: 'debt' } }));
  await page.reload();
  await expect(page.getByTestId('unit-3').locator('.goal-tag')).toHaveCount(1);
  await page.locator('[data-tab="Profile"]').click();
  await page.locator('[data-goal-opt="invest"]').click();
  await expect(page.locator('[data-goal-opt="invest"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-tab="Learn"]').click();
  await expect(page.getByTestId('unit-6').locator('.goal-tag')).toHaveCount(1);
  await expect(page.getByTestId('unit-3').locator('.goal-tag')).toHaveCount(0);
});
