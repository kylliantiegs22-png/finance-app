import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { failOnErrors, onboard, playSession, Q, readNum } from './helpers';

const shot = (page: Page, name: string, fullPage = false) => page.screenshot({ path: `screenshots/${name}.png`, fullPage });
const LESSONS = ['1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8'];

async function axeAA(page: Page, label: string) {
  await page.waitForTimeout(500);
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const msg = r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ') + ' — ' + (n.failureSummary ?? '').split('\n')[1]).join(' | ')}`).join('\n');
  expect(r.violations, `${label}\n${msg}`).toEqual([]);
}

async function openNode(page: Page, id: string) {
  const node = page.locator(`[data-node="${id}"]`);
  await node.scrollIntoViewIfNeeded();
  await expect(node).toHaveAttribute('data-state', 'current');
  await node.click();
  await page.getByTestId('node-start').click();
  await expect(page.getByTestId('session')).toBeVisible();
}

test('complete all of Unit 1 + unit check, unlock Unit 2, survive reload, offline, review next day', async ({ page, context }) => {
  const noErrors = failOnErrors(page);
  await page.clock.install({ time: new Date('2026-11-24T08:00:00') });
  await page.goto('/');
  await onboard(page);
  await shot(page, 'path-start');
  await axeAA(page, 'home (light)');

  const shotTypes = new Set<string>();
  let fbRight = false;
  let fbWrong = false;

  for (const id of LESSONS) {
    console.log('lesson', id);
    const xpBefore = await readNum(page, 'xp');
    await openNode(page, id);
    // answer the first guided question wrong (confident) to exercise re-queueing
    const wrong = Object.values(Q).find((q) => q.id === `u1l${id.split('.')[1]}-g-2`)?.id;
    await playSession(page, {
      wrongIds: wrong ? [wrong] : [],
      onScreen: async ({ kind, qid, fb }) => {
        if (kind === 'question' && qid && !fb) {
          const t = Q[qid].qtype;
          if (!shotTypes.has(t)) {
            shotTypes.add(t);
            await shot(page, `question-${t}`);
            if (shotTypes.size === 1) await axeAA(page, `question ${qid}`);
          }
        }
        if (fb && qid === wrong && !fbWrong) {
          fbWrong = true;
          await page.waitForTimeout(400);
          await shot(page, 'feedback-wrong');
          await axeAA(page, 'feedback wrong');
        } else if (fb && qid !== wrong && !fbRight && id === '1.2') {
          fbRight = true;
          await page.waitForTimeout(400);
          await shot(page, 'feedback-right');
          await axeAA(page, 'feedback right');
        }
        if (kind === 'teach' && id === '1.4' && !shotTypes.has('teach-payslip')) {
          if (await page.locator('.vis-payslip').isVisible()) {
            shotTypes.add('teach-payslip');
            await shot(page, 'teach-payslip');
          }
        }
      },
    });
    await expect(page.getByTestId('complete')).toBeVisible();
    if (id === '1.1') {
      await page.waitForTimeout(1500);
      await shot(page, 'recap', true);
      await axeAA(page, 'recap');
    }
    await page.getByTestId('complete-continue').click();
    await expect(page.locator(`[data-node="${id}"]`)).toHaveAttribute('data-state', 'done');
    expect(await readNum(page, 'xp')).toBeGreaterThan(xpBefore);
  }
  expect(await readNum(page, 'streak')).toBe(1);

  // Review node
  await openNode(page, '1.review');
  await playSession(page);
  await expect(page.getByTestId('complete')).toBeVisible();
  await page.getByTestId('complete-continue').click();
  await expect(page.locator('[data-node="1.review"]')).toHaveAttribute('data-state', 'done');

  // Unit check: 3 wrong of 12 = 75% -> not passed
  await openNode(page, '1.check');
  await playSession(page, { wrongCount: 3 });
  await expect(page.getByTestId('check-retry')).toBeVisible();
  await page.waitForTimeout(600);
  await shot(page, 'check-retry');
  await expect(page.locator('[data-testid="unit-2"]')).toHaveCount(0); // still on result screen
  // Retry and pass: 2 wrong of 12 = 83%
  await page.getByTestId('check-again').click();
  await playSession(page, { wrongCount: 2 });
  await expect(page.getByTestId('unit-win')).toBeVisible();
  await expect(page.getByTestId('win-unlock')).toContainText('Unit 2');
  await page.waitForTimeout(1300);
  await shot(page, 'unit-win');
  await page.getByTestId('win-continue').click();

  await expect(page.getByTestId('unit-2')).toHaveAttribute('data-unlocked', 'true');
  await expect(page.getByTestId('unit-2-status')).toContainText('Unlocked');
  await expect(page.getByTestId('unit-3')).toHaveAttribute('data-unlocked', 'false');
  const xpEnd = await readNum(page, 'xp');

  // Reload: everything persists
  await page.reload();
  await expect(page.getByTestId('path')).toBeVisible();
  expect(await readNum(page, 'xp')).toBe(xpEnd);
  for (const id of [...LESSONS, '1.review', '1.check']) await expect(page.locator(`[data-node="${id}"]`)).toHaveAttribute('data-state', 'done');
  await expect(page.getByTestId('unit-2')).toHaveAttribute('data-unlocked', 'true');
  // a real, fully used save is read back cleanly: no repair notice, no backup copies
  await expect(page.getByTestId('storage-notice')).toHaveCount(0);
  expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('tally.backup.')).length)).toBe(0);
  await page.waitForTimeout(400);
  await shot(page, 'path-unit1-done', true);

  // Dark mode
  await page.locator('[data-tab="Profile"]').click();
  await page.locator('[data-theme-opt="dark"]').click();
  await page.locator('[data-tab="Learn"]').click();
  await page.waitForTimeout(400);
  await shot(page, 'path-dark');
  await axeAA(page, 'home (dark)');

  // Next day: reviews are due; a review session keeps the streak going
  await page.clock.setSystemTime(new Date('2026-11-25T08:30:00'));
  await page.reload();
  await page.locator('[data-tab="Review"]').click();
  const due = await readNum(page, 'due-count');
  expect(due).toBeGreaterThan(0);
  expect(due).toBeLessThanOrEqual(8);
  await page.waitForTimeout(400);
  await shot(page, 'review-tab-dark');
  await axeAA(page, 'review tab (dark)');
  await page.getByTestId('start-review').click();
  await playSession(page, {
    onScreen: async ({ kind, fb, i }) => {
      if (kind === 'question' && fb && i === 0) {
        await page.waitForTimeout(400);
        await shot(page, 'review-feedback-dark');
        await axeAA(page, 'review feedback (dark)');
      }
    },
  });
  await expect(page.getByTestId('complete')).toBeVisible();
  await page.getByTestId('complete-continue').click();
  expect(await readNum(page, 'streak')).toBe(2);

  await page.locator('[data-tab="Progress"]').click();
  await page.waitForTimeout(400);
  await shot(page, 'progress-dark', true);
  await axeAA(page, 'progress (dark)');
  await page.locator('[data-tab="Profile"]').click();
  await page.locator('[data-theme-opt="light"]').click();
  await page.locator('[data-tab="Progress"]').click();
  await page.waitForTimeout(400);
  await shot(page, 'progress-light', true);
  await axeAA(page, 'progress (light)');
  await page.locator('[data-tab="Profile"]').click();
  await page.waitForTimeout(400);
  await axeAA(page, 'profile (light)');

  // Installable + offline: manifest and a controlling service worker
  const manifest = await page.evaluate(async () => {
    const href = document.querySelector('link[rel="manifest"]')?.getAttribute('href');
    return href ? (await fetch(href)).json() : null;
  });
  expect(manifest?.display).toBe('standalone');
  expect(manifest?.icons?.some((i: { sizes: string }) => i.sizes === '512x512')).toBe(true);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await page.locator('[data-tab="Learn"]').click();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId('path')).toBeVisible();
  await expect(page.getByTestId('unit-2')).toHaveAttribute('data-unlocked', 'true');
  await page.locator('[data-tab="Learn"]').click();
  await page.locator('[data-node="1.3"]').scrollIntoViewIfNeeded();
  await page.locator('[data-node="1.3"]').click();
  await page.getByTestId('node-start').click();
  await expect(page.getByTestId('session')).toBeVisible(); // lessons work offline
  await context.setOffline(false);
  noErrors();
});
