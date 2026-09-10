import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    // Vite excludes linked workspace packages from dependency pre-bundling by
    // default, serving them live via /@fs instead — but @qrcraft/core builds
    // to CommonJS, and Vite's live CJS interop for that path doesn't reliably
    // detect every named export of a large `export *` barrel (unlike the
    // esbuild-based dep-optimizer, which handles this correctly). Forcing it
    // through the optimizer fixes named imports breaking in dev. Every
    // subpath actually imported needs its own entry here — the optimizer
    // matches by exact specifier, not by package name.
    include: ['@qrcraft/core', '@qrcraft/core/utils/qrDecode'],
  },
  build: {
    // The only bundle over Vite's 500 kB default is the on-demand HEIC codec
    // (`heic-to` base64-inlines libheif's ~3 MB WASM). It is dynamically imported
    // and fetched only when someone uploads a HEIC image, never on first paint,
    // so the warning is noise. Every other chunk builds well under 500 kB —
    // lower this back if that stops being true.
    chunkSizeWarningLimit: 3200,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    globals: true,
    exclude: [...configDefaults.exclude, 'e2e/**'],
    coverage: {
      reporter: ['text', 'lcov'],
      // @qrcraft/core resolves through a symlinked node_modules entry, which
      // bypasses V8 coverage's default node_modules exclusion (it sees the
      // real packages/core path); exclude it explicitly so its compiled
      // output isn't double-counted against apps/web's own coverage.
      exclude: ['**/packages/core/**'],
    },
  },
})
