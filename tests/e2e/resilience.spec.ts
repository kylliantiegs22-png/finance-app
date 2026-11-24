import { expect, test, type Page } from '@playwright/test';
import { failOnErrors, onboard, playSession, readNum } from './helpers';

const KEY = 'tally.v1';
const progress = () => ({
  v: 1,
  onboarded: true,
  profile: { goal: 'invest', level: 'new', cue: 'my morning coffee', time: '08:00', dailyGoal: 60 },
  settings: { theme: 'light', sound: false, haptics: false, motion: 'system' },
  xp: 240,
  days: { '2026-11-23': { xp: 120, lessons: 2, reviews: 0, sessions: 2, seconds: 600 } },
  completed: {
    '1.1': { at: '2026-11-23T08:00:00.000Z', score: 90, best: 90, runs: 1 },
    '1.2': { at: '2026-11-23T08:10:00.000Z', score: 100, best: 100, runs: 1 },
  },
  passedUnits: [],
  streak: { current: 1, longest: 1, lastDay: '2026-11-23', freezes: 0, frozenDays: [], repairedDays: [], repair: null, sessions: { '2026-11-23': 2 } },
  cards: { 'net-worth': { concept: 'net-worth', lesson: '1.2', box: 1, due: '2026-11-24', lapses: 0, seen: 0 } },
  missions: {},
  celebrated: [],
});

/** Seed localStorage before the app's scripts run, then load the app. */
async function seed(page: Page, raw: string | null, extra = '') {
  await page.addInitScript(
    ([key, value, more]) => {
      if (sessionStorage.getItem('seeded')) return; // only on first load
      sessionStorage.setItem('seeded', '1');
      localStorage.clear();
      if (value !== null) localStorage.setItem(key as string, value as string);
      if (more) new Function(more as string)();
    },
    [KEY, raw, extra],
  );
  await page.clock.install({ time: new Date('2026-11-24T08:00:00') });
  await page.goto('/');
}

const stored = (page: Page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), KEY);

test.describe('saved data resilience', () => {
  test('missing data: onboarding, no errors', async ({ page }) => {
    const ok = failOnErrors(page);
    await seed(page, null);
    await expect(page.getByTestId('onboarding')).toBeVisible();
    ok();
  });

  test('unreadable JSON: starts fresh, says so, and keeps a backup copy', async ({ page }) => {
    const ok = failOnErrors(page);
    await seed(page, '{"v":1,"xp":24');
    await expect(page.getByTestId('onboarding')).toBeVisible();
    await expect(page.getByTestId('storage-notice')).toContainText("couldn't read");
    const backups = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('tally.backup.')).map((k) => localStorage.getItem(k)));
    expect(backups).toContain('{"v":1,"xp":24');
    ok();
  });

  test('partly corrupt data: app loads with valid progress kept', async ({ page }) => {
    const ok = failOnErrors(page);
    const bad = { ...progress(), days: null, cards: 'oops', streak: { current: 'x' }, settings: 3 };
    await seed(page, JSON.stringify(bad));
    await expect(page.getByTestId('path')).toBeVisible();
    expect(await readNum(page, 'xp')).toBe(240);
    await expect(page.locator('[data-node="1.2"]')).toHaveAttribute('data-state', 'done');
    await expect(page.locator('[data-node="1.3"]')).toHaveAttribute('data-state', 'current');
    for (const tab of ['Review', 'Progress', 'Profile', 'Learn']) await page.locator(`[data-tab="${tab}"]`).click();
    ok();
  });

  test('older saved data (no version, missing fields) migrates and keeps progress', async ({ page }) => {
    const ok = failOnErrors(page);
    await seed(page, JSON.stringify({ onboarded: true, xp: 80, completed: { '1.1': { at: '2026-11-01T00:00:00Z', score: 80 } } }));
    await expect(page.getByTestId('path')).toBeVisible();
    expect(await readNum(page, 'xp')).toBe(80);
    await expect(page.locator('[data-node="1.2"]')).toHaveAttribute('data-state', 'current');
    await page.locator('[data-tab="Progress"]').click();
    await page.locator('[data-tab="Learn"]').click();
    // the next write upgrades it to the current schema without losing anything
    await page.locator('[data-tab="Profile"]').click();
    await page.locator('[data-theme-opt="dark"]').click();
    const s = await stored(page);
    expect(s.v).toBe(1);
    expect(s.xp).toBe(80);
    expect(s.completed['1.1']).toBeTruthy();
    ok();
  });

  test('full storage quota: lesson still completes, learner is told, earlier progress survives reload', async ({ page }) => {
    const ok = failOnErrors(page);
    // Saved progress exists; then storage becomes full for any further write.
    await seed(
      page,
      JSON.stringify(progress()),
      `const orig = Storage.prototype.setItem;
       Storage.prototype.setItem = function (k, v) {
         if (sessionStorage.getItem('full')) throw new DOMException('full', 'QuotaExceededError');
         return orig.call(this, k, v);
       };`,
    );
    await expect(page.getByTestId('path')).toBeVisible();
    await page.evaluate(() => sessionStorage.setItem('full', '1'));
    await page.locator('[data-node="1.3"]').scrollIntoViewIfNeeded();
    await page.locator('[data-node="1.3"]').click();
    await page.getByTestId('node-start').click();
    await playSession(page);
    await expect(page.getByTestId('complete')).toBeVisible();
    await expect(page.getByTestId('save-warning')).toBeVisible();
    await page.getByTestId('complete-continue').click();
    await expect(page.locator('[data-node="1.3"]')).toHaveAttribute('data-state', 'done'); // kept in memory
    await page.reload();
    await expect(page.getByTestId('path')).toBeVisible();
    expect(await readNum(page, 'xp')).toBe(240); // earlier progress intact
    await expect(page.locator('[data-node="1.2"]')).toHaveAttribute('data-state', 'done');
    ok();
  });

  test('storage blocked entirely (private mode): app still runs a lesson', async ({ page }) => {
    const ok = failOnErrors(page);
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { configurable: true, get: () => { throw new DOMException('denied', 'SecurityError'); } });
    });
    await page.goto('/');
    await expect(page.getByTestId('onboarding')).toBeVisible();
    await expect(page.getByTestId('save-warning')).toBeVisible();
    await page.getByTestId('save-warning').getByRole('button', { name: 'Hide' }).click();
    await onboard(page);
    await page.locator('[data-node="1.1"]').click();
    await page.getByTestId('node-start').click();
    await playSession(page);
    await expect(page.getByTestId('complete')).toBeVisible();
    await page.getByTestId('complete-continue').click();
    await expect(page.locator('[data-node="1.2"]')).toHaveAttribute('data-state', 'current');
    ok();
  });

  test('offline reload mid-lesson: lesson reopens, saved progress kept', async ({ page, context }) => {
    const ok = failOnErrors(page);
    await seed(page, JSON.stringify(progress()));
    await expect(page.getByTestId('path')).toBeVisible();
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    await page.locator('[data-node="1.3"]').scrollIntoViewIfNeeded();
    await page.locator('[data-node="1.3"]').click();
    await page.getByTestId('node-start').click();
    await page.getByTestId('session').waitFor();
    // answer the first question, then lose the network and reload
    await playSession(page, { stopAfter: 2 });
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByTestId('session')).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    await page.getByTestId('leave').click();
    await expect(page.getByTestId('path')).toBeVisible();
    expect(await readNum(page, 'xp')).toBe(240);
    await expect(page.locator('[data-node="1.3"]')).toHaveAttribute('data-state', 'current');
    await context.setOffline(false);
    ok();
  });

  test('two tabs: progress saved in one is not overwritten by the other', async ({ context }) => {
    const a = await context.newPage();
    await a.goto('/');
    await a.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, JSON.stringify(progress())] as const);
    await a.reload();
    const b = await context.newPage();
    await b.goto('/');
    await expect(b.getByTestId('path')).toBeVisible();
    // Tab A finishes a lesson
    await a.locator('[data-node="1.3"]').scrollIntoViewIfNeeded();
    await a.locator('[data-node="1.3"]').click();
    await a.getByTestId('node-start').click();
    await playSession(a);
    await a.getByTestId('complete-continue').click();
    const xpA = await readNum(a, 'xp');
    // Tab B then changes a setting: it must not roll back A's lesson
    await expect(b.locator('[data-node="1.3"]')).toHaveAttribute('data-state', 'done');
    await b.locator('[data-tab="Profile"]').click();
    await b.locator('[data-theme-opt="dark"]').click();
    const s = await b.evaluate((k) => JSON.parse(localStorage.getItem(k)!), KEY);
    expect(s.completed['1.3']).toBeTruthy();
    expect(s.xp).toBe(xpA);
  });

  test('a render error shows a recovery screen, not a blank page, and keeps progress', async ({ page }) => {
    await seed(
      page,
      JSON.stringify(progress()),
      `const orig = Number.prototype.toLocaleString;
       Number.prototype.toLocaleString = function (...a) {
         if (sessionStorage.getItem('boom')) throw new Error('simulated browser failure');
         return orig.apply(this, a);
       };`,
    );
    await expect(page.getByTestId('path')).toBeVisible();
    await page.evaluate(() => sessionStorage.setItem('boom', '1'));
    await page.locator('[data-node="1.3"]').scrollIntoViewIfNeeded();
    await page.locator('[data-node="1.3"]').click();
    await page.getByTestId('node-start').click();
    await playSession(page); // returns when the session can no longer render
    await expect(page.getByTestId('error-screen')).toBeVisible();
    await page.evaluate(() => sessionStorage.removeItem('boom'));
    await page.getByTestId('error-home').click();
    await expect(page.getByTestId('path')).toBeVisible();
    expect(await readNum(page, 'xp')).toBe(240);
    await expect(page.locator('[data-node="1.2"]')).toHaveAttribute('data-state', 'done');
  });
});
