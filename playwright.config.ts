import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 600_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${process.env.E2E_PORT ?? 4173}`,
    actionTimeout: 10_000,
    screenshot: 'only-on-failure',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' },
  },
  webServer: {
    command: process.env.E2E_PORT ? `npx vite preview --port ${process.env.E2E_PORT} --strictPort --outDir ${process.env.E2E_OUT ?? 'dist'}` : 'npm run preview',
    url: `http://localhost:${process.env.E2E_PORT ?? 4173}`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
