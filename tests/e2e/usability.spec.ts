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
