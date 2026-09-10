import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'node_modules',
    '**/dist/**',
    'dist-ssr',
    '**/coverage/**',
    'build',
    '.cache',
    '.git',
    '.vscode',
    '.idea',
    'public/build',
    '.DS_Store',
    '*.log',
    '*.tmp',
    '.env*',
    '.eslintcache',
    // Any agent tooling installed into the repo is vendored third-party script, not
    // project source, so hand-fixing lint there would be overwritten on reinstall.
    // Kept as entries rather than removed because the paths reappear if a skill is
    // ever installed locally again; a Claude Code *plugin* lives outside the repo
    // and needs none of this.
    '.agents',
    '.claude/skills',
    '.github/skills',
    '.impeccable',
  ]),
  {
    // Excludes apps/mcp: it is a Node process, not a browser context, and
    // gets its own block below with Node globals instead of browser globals.
    // ESLint's flat config merges languageOptions.globals across every
    // matching block rather than replacing it, so layering a Node-globals
    // block on top of this one (rather than excluding apps/mcp here) would
    // leave window/document/navigator recognized as valid globals in the MCP
    // server too, defeating the point of scoping them out.
    files: ['**/*.{ts,tsx}'],
    ignores: ['apps/mcp/**/*.ts'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      prettier,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: [
          './apps/web/tsconfig.app.json',
          './apps/web/tsconfig.node.json',
          './packages/core/tsconfig.json',
        ],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // apps/mcp is a Node process (stdio/HTTP transports), not a browser
    // context: Node globals instead of browser globals, so an accidental
    // window/document/navigator reference here is a real lint error rather
    // than a silently-recognized global.
    files: ['apps/mcp/**/*.ts'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      prettier,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
      parserOptions: {
        project: ['./apps/mcp/tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // FR-003: @qrcraft/core must stay free of React, the DOM, and storage
    // APIs so a non-browser consumer (apps/mcp, a future mobile app) can
    // import it unmodified.
    files: ['packages/core/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'react/*', 'react-dom/*'],
              message: '@qrcraft/core must stay free of React. Platform code belongs in an app.',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        'document',
        'window',
        'localStorage',
        'sessionStorage',
        'navigator',
      ],
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      prettier,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
