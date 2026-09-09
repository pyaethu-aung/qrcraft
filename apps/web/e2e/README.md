# End-to-end / visual tests (Playwright)

These tests drive the **running app** in a real browser and capture a
full-page screenshot and a video for every run. They are how a reviewer sees
what a change looks and behaves like (light and dark, desktop and mobile)
without checking it out. They are separate from the Vitest unit suite
(`npm run test`), which runs in jsdom with no browser.

## Run them

```bash
npm run test:e2e                              # all projects (desktop/mobile x light/dark)
npx playwright test --project=desktop-light   # a single project
npx playwright test --ui                      # interactive UI mode
npx playwright show-report                    # open the last HTML report
```

The runner starts the Vite dev server itself (`webServer` in
`playwright.config.ts`), so you do not need `npm run dev` running first.

One-time machine setup (the npm dependency is already in `package.json`):

```bash
npm install                       # installs @playwright/test
npx playwright install chromium   # browser binary (~150 MB; skips if cached)
```

## What you get

Per test, per project, under `test-results/` (gitignored):

- `01-initial.png`, `02-generated.png`: full-page screenshots
- `video.webm`: a recording of the run
- a trace on first retry (open with `npx playwright show-trace <trace.zip>`)

An HTML report is written to `playwright-report/`. In CI,
`.github/workflows/e2e.yml` runs on every PR to `main` and uploads both
`playwright-report/` and `test-results/` as artifacts, so the screenshots and
the recording are one click away from the PR's checks.

## Add or extend a spec

- Put specs in `e2e/*.spec.ts`. Prefer role-based selectors
  (`getByRole('button', { name: /generate/i })`) over brittle CSS.
- Light vs dark comes from each project's `colorScheme`; the app reads
  `prefers-color-scheme` on first load, so you set no theme flag.
- New viewports or schemes are just new `projects` entries in
  `playwright.config.ts`.
- To assert on the generated QR specifically, add a `data-testid` to the
  preview component and select it; today the spec leans on the screenshot as
  the evidence.

## Why separate from Vitest

`e2e/**` is excluded from Vitest's run (in `vite.config.ts`) so the two
runners do not pick up each other's specs. Unit tests stay fast in jsdom; the
browser tests live here and run on demand or in CI.
