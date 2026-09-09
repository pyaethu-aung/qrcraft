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
    'dist',
    'dist-ssr',
    'coverage',
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
    files: ['**/*.{ts,tsx}'],
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
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'react-refresh/only-export-components': 'off',
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
