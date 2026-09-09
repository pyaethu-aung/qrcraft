import { defineConfig, devices } from '@playwright/test'

// Visual + smoke E2E for the live app. Captures a screenshot and a video for
// every test across desktop/mobile and light/dark; CI uploads them as PR
// artifacts (.github/workflows/e2e.yml). See e2e/README.md.

const PORT = 5173
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // HTML report always (so `npx playwright show-report` works locally too);
  // open: 'never' keeps it from auto-launching a browser at the end of a run.
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL,
    screenshot: 'on',
    video: 'on',
    trace: 'on-first-retry',
  },
  // Start (or reuse) the Vite dev server for the run.
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  // The app reads prefers-color-scheme on first load, so colorScheme drives
  // light vs dark without touching app internals.
  projects: [
    {
      name: 'desktop-light',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 }, colorScheme: 'light' },
    },
    {
      name: 'desktop-dark',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 }, colorScheme: 'dark' },
    },
    {
      name: 'mobile-light',
      use: { ...devices['Pixel 7'], colorScheme: 'light' },
    },
    {
      name: 'mobile-dark',
      use: { ...devices['Pixel 7'], colorScheme: 'dark' },
    },
  ],
})
