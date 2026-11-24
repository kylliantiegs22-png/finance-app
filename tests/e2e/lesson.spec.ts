import { expect, test } from '@playwright/test';
import { failOnErrors, onboard, playSession, readNum } from './helpers';

const shot = (name: string) => `screenshots/${name}.png`;

test('onboarding → lesson 1.1 end to end; XP, streak and unlock persist after reload', async ({ page }) => {
  const noErrors = failOnErrors(page);
  await page.goto('/');
  await page.screenshot({ path: shot('00-welcome') });
  await onboard(page);
  await page.screenshot({ path: shot('01-path') });

  const xp0 = await readNum(page, 'xp');
  expect(await readNum(page, 'streak')).toBe(0);
  await expect(page.locator('[data-node="1.1"]')).toHaveAttribute('data-state', 'current');
  await expect(page.locator('[data-node="1.2"]')).toHaveAttribute('data-state', 'locked');

  await page.locator('[data-node="1.1"]').click();
  await page.screenshot({ path: shot('02-node-card') });
  await page.getByTestId('node-start').click();

  let shotQ = false;
  let shotWrong = false;
  let shotRight = false;
  await playSession(page, {
    wrongIds: ['u1l1-g-3'],
    onScreen: async ({ kind, qid, fb }) => {
      if (kind === 'teach' && qid === undefined && !shotQ) await page.screenshot({ path: shot('03-teach') });
      if (kind === 'question' && !fb && qid === 'u1l1-g-1' && !shotQ) {
        shotQ = true;
        await page.screenshot({ path: shot('04-question-match') });
      }
      if (fb && qid === 'u1l1-g-3' && !shotWrong) {
        shotWrong = true;
        await page.waitForTimeout(450);
        await page.screenshot({ path: shot('06-feedback-wrong') });
      } else if (fb && qid === 'u1l1-g-2' && !shotRight) {
        shotRight = true;
        await page.waitForTimeout(450);
        await page.screenshot({ path: shot('05-feedback-right') });
      }
    },
  });

  await expect(page.getByTestId('complete')).toBeVisible();
  await page.waitForTimeout(1600);
  await page.screenshot({ path: shot('07-recap'), fullPage: true });
  await page.getByTestId('complete-continue').click();

  await expect(page.locator('[data-node="1.1"]')).toHaveAttribute('data-state', 'done');
  await expect(page.locator('[data-node="1.2"]')).toHaveAttribute('data-state', 'current');
  const xp1 = await readNum(page, 'xp');
  expect(xp1).toBeGreaterThan(xp0);
  expect(await readNum(page, 'streak')).toBe(1);

  await page.reload();
  await expect(page.getByTestId('path')).toBeVisible();
  expect(await readNum(page, 'xp')).toBe(xp1);
  expect(await readNum(page, 'streak')).toBe(1);
  await expect(page.locator('[data-node="1.2"]')).toHaveAttribute('data-state', 'current');

  // Dark mode
  await page.locator('[data-tab="Profile"]').click();
  await page.locator('[data-theme-opt="dark"]').click();
  await page.locator('[data-tab="Learn"]').click();
  await page.screenshot({ path: shot('08-path-dark') });
  noErrors();
});
