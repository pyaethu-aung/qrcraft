import { defineConfig } from 'vitest/config'

// Fans a single root `vitest` invocation out to every workspace package, each
// resolved via its own vite/vitest config (apps/web/vite.config.ts,
// packages/core/vitest.config.ts) so their environments and coverage
// thresholds stay independent (FR-004).
export default defineConfig({
  test: {
    projects: ['apps/web', 'packages/core'],
    coverage: {
      // Coverage is collected by the root Vitest instance across every
      // project, so the exclude that matters lives here rather than in
      // either child config. @qrcraft/core resolves through a symlinked
      // node_modules entry, which bypasses V8 coverage's default
      // node_modules exclusion (it sees the real packages/core/dist path) —
      // exclude the compiled output explicitly so it isn't double-counted
      // against apps/web's coverage on top of packages/core's own report.
      exclude: ['**/packages/core/dist/**'],
    },
  },
})
