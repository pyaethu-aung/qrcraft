import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
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
