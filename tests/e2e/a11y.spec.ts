import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { answer, failOnErrors, Q } from './helpers';

async function seedAndGo(page: Page, hash: string, state: object = { v: 1, onboarded: true, xp: 5 }) {
  await page.addInitScript((s) => {
    if (!sessionStorage.getItem('seeded')) {
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem('tally.v1', s);
    }
  }, JSON.stringify(state));
  await page.goto('/' + hash);
}

async function axe(page: Page, label: string) {
  await page.waitForTimeout(450);
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`), label).toEqual([]);
}

const activeInfo = (page: Page) =>
  page.evaluate(() => {
    const a = document.activeElement as HTMLElement | null;
    return { tag: a?.tagName, text: a?.textContent?.trim().slice(0, 60), inBody: !!a?.closest('.session-body'), testid: a?.dataset.testid };
  });

test('keyboard only: a lesson screen can be answered and focus follows each new screen', async ({ page }) => {
  const ok = failOnErrors(page);
  await seedAndGo(page, '#/play/lesson/1.2');
  await expect(page.getByTestId('session')).toBeVisible();
  // hook is a multiple choice: Tab to the first option, Space to pick, Tab to "I'm sure", Enter
  const first = page.locator('[data-opt]').first();
  await first.focus();
  await page.keyboard.press('Space');
  await expect(first).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('check-sure').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('feedback')).toBeVisible();
  expect((await activeInfo(page)).testid).toBe('continue'); // focus lands on Continue
  await page.keyboard.press('Enter');
  // the next screen's heading receives focus so screen readers announce it
  await expect.poll(async () => (await activeInfo(page)).inBody).toBe(true);
  const a = await activeInfo(page);
  expect(a.tag).toBe('H2');
  ok();
});

test('options are toggle buttons, not radios without arrow keys', async ({ page }) => {
  await seedAndGo(page, '#/play/lesson/1.2');
  await expect(page.locator('[data-opt]').first()).toBeVisible();
  expect(await page.locator('[role="radio"]').count()).toBe(0);
  await expect(page.locator('[data-opt]').first()).toHaveAttribute('aria-pressed', 'false');
});

test('leave dialog takes focus, closes with Escape and returns focus', async ({ page }) => {
  await seedAndGo(page, '#/play/lesson/1.2');
  const close = page.getByRole('button', { name: 'Close' });
  await close.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Leave session' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expect(dialog.getByRole('button', { name: 'Keep going' })).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  // focus stays inside the dialog
  expect(await page.evaluate(() => !!document.activeElement?.closest('[aria-label="Leave session"]'))).toBe(true);
  await axe(page, 'leave dialog');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(close).toBeFocused();
});

test('match pairs are not shown by colour alone', async ({ page }) => {
  await seedAndGo(page, '#/play/lesson/1.1');
  // skip to the match question (first guided screen)
  for (let i = 0; i < 12; i++) {
    const isQ = (await page.getByTestId('session').getAttribute('data-kind')) === 'question';
    const qid = isQ ? await page.locator('[data-qid]').getAttribute('data-qid') : null;
    if (qid === 'u1l1-g-1') break;
    if (isQ) {
      await answer(page, Q[qid!]);
      await page.getByTestId('check-sure').click();
      await page.getByTestId('feedback').getByTestId('continue').click();
    } else await page.getByTestId('continue').click();
  }
  await page.locator('[data-left="0"]').click();
  await page.locator('[data-right="0"]').click();
  const left = page.locator('[data-left="0"]');
  await expect(left).toHaveAccessibleName(/matched with Personal finance/);
  await expect(left.locator('.pair-badge')).toHaveText('1'); // visible pair number, not just colour
  await expect(page.locator('[data-right="0"] .pair-badge')).toHaveText('1');
  await axe(page, 'match question');
});

test('every screen has one h1 and a descriptive title', async ({ page }) => {
  await seedAndGo(page, '#/');
  const screens: [string, string][] = [
    ['#/', 'Learn'],
    ['#/review', 'Review'],
    ['#/progress', 'Progress'],
    ['#/profile', 'Profile'],
    ['#/play/lesson/1.1', 'What finance is'],
  ];
  for (const [hash, title] of screens) {
    await page.evaluate((h) => (location.hash = h), hash);
    await page.waitForTimeout(150);
    expect(await page.locator('h1').count(), hash).toBe(1);
    await expect(page).toHaveTitle(new RegExp(title));
  }
});

test('touch targets are at least 44×44 (except inline glossary words)', async ({ page }) => {
  await seedAndGo(page, '#/');
  const check = async (label: string) => {
    await page.waitForTimeout(350);
    const small = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('button, a[href], input, [role="button"]')]
        .filter((el) => el.offsetParent !== null && !el.classList.contains('term') && el.getAttribute('type') !== 'checkbox' && el.getAttribute('type') !== 'file')
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
        .filter(({ r }) => r.width > 0 && (r.width < 44 || r.height < 44))
        .map(({ el, r }) => `${el.tagName}.${el.className} "${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`),
    );
    expect(small, label).toEqual([]);
  };
  await check('home');
  await page.locator('[data-node="1.1"]').click();
  await check('home + node card');
  for (const tab of ['Review', 'Progress', 'Profile']) {
    await page.locator(`[data-tab="${tab}"]`).click();
    await check(tab);
  }
  await page.evaluate(() => (location.hash = '#/play/lesson/1.4'));
  await check('lesson');
});

test('reduced motion: no looping or sliding animation, no confetti', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seedAndGo(page, '#/');
  const long = await page.evaluate(() =>
    document.getAnimations().filter((a) => {
      const t = a.effect?.getTiming();
      return t && (t.iterations === Infinity || Number(t.duration) > 200);
    }).length,
  );
  expect(long).toBe(0);
});

test('axe AA on onboarding steps, node card, error and storage banners (light and dark)', async ({ page }) => {
  await page.goto('/');
  await axe(page, 'welcome');
  await page.getByTestId('ob-start').click();
  await axe(page, 'first question');
  await page.locator('[data-opt="1"]').click();
  await page.getByTestId('ob-check').click();
  await axe(page, 'first question feedback');
  await page.getByTestId('ob-next').click();
  await axe(page, 'goal');
  await page.locator('[data-goal="pay"]').click();
  await page.getByTestId('ob-next').click();
  await axe(page, 'level');
  await page.getByTestId('ob-next').click();
  await axe(page, 'habit');
  await page.getByTestId('ob-next').click();
  await axe(page, 'promise');
  await page.getByTestId('ob-finish').click();
  await page.locator('[data-node="1.1"]').click();
  await axe(page, 'node card');
  await page.locator('[data-testid="chips"] button').first().click();
  await axe(page, 'chip help');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('chip-help')).toHaveCount(0);
  await page.locator('[data-testid="chips"] button').nth(2).click();
  await page.locator('.unit-banner').first().click();
  await expect(page.getByTestId('chip-help')).toHaveCount(0); // tap outside closes
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.evaluate(() => (location.hash = '#/play/lesson/1.4'));
  await axe(page, 'lesson dark');
});

test('storage banners pass axe', async ({ page }) => {
  await seedAndGo(page, '#/', {});
  await page.evaluate(() => localStorage.setItem('tally.v1', '{broken'));
  await page.reload();
  await expect(page.getByTestId('storage-notice')).toBeVisible();
  await axe(page, 'storage notice');
});

test('the "Your goal" tag is a separate word for assistive tech ("Unit 3 Your goal")', async ({ page }) => {
  await seedAndGo(page, '#/', { v: 1, onboarded: true, xp: 5, profile: { goal: 'debt' } });
  const text = await page.getByTestId('unit-3').locator('.unit-kicker').evaluate((e) => e.textContent);
  expect(text).toMatch(/Unit 3\s+Your goal/);
});
