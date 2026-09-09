import { defineConfig } from 'vitest/config'

// Fans a single root `vitest`/`vitest watch` invocation out to every
// workspace package, each resolved via its own vite/vitest config
// (apps/web/vite.config.ts, packages/core/vitest.config.ts). Coverage is
// deliberately NOT run through this: `npm run test:coverage` (package.json)
// instead runs each workspace's own `test:coverage` as a separate, sequential
// `vitest run --coverage` invocation, because per-project coverage
// thresholds (FR-004) are not enforced when collected through this merged
// `projects` runner — verified empirically: no threshold error surfaced even
// with a failing package.json/vitest.config.ts coverage.thresholds setting.
export default defineConfig({
  test: {
    projects: ['apps/web', 'packages/core'],
  },
})
