import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { answer, failOnErrors, Q } from './helpers';

async function seedAndGo(page: Page, hash: string, extra: object = {}) {
  await page.addInitScript((s) => {
    if (!sessionStorage.getItem('seeded')) {
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem('tally.v1', s);
    }
  }, JSON.stringify({ v: 1, onboarded: true, xp: 5, ...extra }));
  await page.goto('/' + hash);
}

/** Step through lesson 1.1 until the first typed-number question, checking the button only shows on maths questions. */
async function toFirstNumeric(page: Page) {
  for (let i = 0; i < 30; i++) {
    const session = page.getByTestId('session');
    await expect(session).toBeVisible();
    const kind = await session.getAttribute('data-kind');
    if (kind !== 'question') {
      await expect(page.getByTestId('calc-open')).toHaveCount(0);
      if (kind === 'apply') await page.locator('.mission').click();
      await page.getByTestId('continue').click();
      continue;
    }
    const q = Q[(await page.locator('[data-qid]').getAttribute('data-qid'))!];
    const maths = q.qtype === 'numeric' || q.qtype === 'slider' || /\$\s?\d|\d\s?%/.test(q.prompt);
    await expect(page.getByTestId('calc-open')).toHaveCount(maths ? 1 : 0);
    if (q.qtype === 'numeric') return q;
    await answer(page, q);
    await page.getByTestId('check-sure').click();
    await page.getByTestId('feedback').getByTestId('continue').click();
  }
  throw new Error('no numeric question found');
}

test('calculator: open from a maths question, work out a sum, use it as the answer', async ({ page }) => {
  const ok = failOnErrors(page);
  await seedAndGo(page, '#/play/lesson/1.1');
  const q = await toFirstNumeric(page);
  expect(q.prompt).toContain('$15 a week');

  const opener = page.getByTestId('calc-open');
  await opener.click();
  const calc = page.getByTestId('calculator');
  await expect(calc).toBeVisible();
  for (const k of ['1', '5', '×', '5', '2']) await calc.locator(`[data-key="${k}"]`).click();
  await expect(page.getByTestId('calc-result')).toHaveText('= 780');
  await page.waitForTimeout(450);
  await page.screenshot({ path: 'screenshots/calc-open.png' });

  const r = await new AxeBuilder({ page }).include('[data-testid="calculator"]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(r.violations.map((v) => v.id)).toEqual([]);

  await page.getByTestId('calc-use').click();
  await expect(calc).toHaveCount(0);
  await expect(page.getByTestId('numeric-input')).toHaveValue('780');
  await expect(page.getByTestId('check-sure')).toBeEnabled();
  await expect(opener).toBeFocused(); // focus goes back to the button that opened it

  // The sum is kept when it's reopened; keyboard works too.
  await opener.click();
  await expect(calc.getByTestId('calc-display')).toContainText('15×52');
  await page.keyboard.press('Backspace');
  await expect(calc.getByTestId('calc-display')).toContainText('15×5');
  await page.keyboard.press('c');
  await page.keyboard.type('4200*20%');
  await expect(page.getByTestId('calc-result')).toHaveText('= 840');
  await page.keyboard.press('Enter');
  await expect(calc.getByTestId('calc-display')).toContainText('840');
  await page.keyboard.press('Escape');
  await expect(calc).toHaveCount(0);
  await expect(page.getByTestId('numeric-input')).toHaveValue('780');

  // Still reachable after checking, to see how the answer was worked out (but no "use" button then).
  await page.getByTestId('check-sure').click();
  await expect(page.getByTestId('feedback')).toBeVisible();
  await opener.click();
  await expect(calc).toBeVisible();
  await expect(page.getByTestId('calc-use')).toHaveCount(0);
  await page.getByRole('button', { name: 'Close calculator' }).click();
  ok();
});

test('calculator looks right in dark mode', async ({ page }) => {
  await seedAndGo(page, '#/play/lesson/1.1', { settings: { theme: 'dark' } });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await toFirstNumeric(page);
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.getByTestId('calc-open').click();
  for (const k of ['1', '0', '0', '0', '+', '5', '%']) await page.locator(`[data-key="${k}"]`).click();
  await expect(page.getByTestId('calc-result')).toHaveText('= 1,050');
  await page.waitForTimeout(450);
  await page.screenshot({ path: 'screenshots/calc-open-dark.png' });
  const r = await new AxeBuilder({ page }).include('[data-testid="calculator"]').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(r.violations.map((v) => v.id)).toEqual([]);
});
