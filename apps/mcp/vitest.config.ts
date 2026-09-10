import { defineConfig } from 'vitest/config'

// apps/mcp is a plain Node process, same as packages/core — no DOM.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      reporter: ['text', 'lcov'],
      // Explicit `include` makes coverage count every matching source file,
      // not just ones a test happens to import — otherwise index.ts and
      // transports/** (never imported by the InMemoryTransport suite; it
      // talks to createServer() directly) would silently count for nothing
      // rather than visibly failing the threshold.
      include: ['src/**/*.ts'],
      // index.ts (CLI arg parsing) and transports/** (stdio is a 6-line SDK
      // wrapper; http.ts's session management would need real HTTP
      // integration tests, not unit tests) are verified by hand today — see
      // the Testing section of apps/mcp/README.md — not by this suite.
      exclude: ['src/index.ts', 'src/transports/**'],
      // Matches apps/web's bar: this is application code (tool wiring,
      // rendering, decoding), not pure input-output logic like packages/core.
      thresholds: {
        lines: 85,
        statements: 85,
        branches: 85,
        functions: 85,
      },
    },
  },
})
