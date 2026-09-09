# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev             # start dev server
npm run build           # builds packages/core, then apps/web, then apps/mcp
npm run lint            # ESLint (type-aware), whole workspace
npm run lint:fix        # auto-fix lint errors
npm run format          # Prettier check
npm run format:fix      # Prettier write
npm run test            # Vitest (watch mode), apps/web + packages/core
npm run test:coverage   # per-package coverage (apps/web ≥85%, packages/core ≥95%/branches ≥90%)
npm run docker:build    # build production image
npm run docker:run      # run container at http://localhost:8080
```

These all run from the repo root and fan out into the npm workspaces
(`apps/web`, `packages/core`, `apps/mcp`) internally — see
[Monorepo layout](#monorepo-layout) below. Run a single test file:
`npx vitest run apps/web/src/utils/share.test.ts` or
`npx vitest run packages/core/src/utils/wifi.test.ts`.

Before opening any PR, all four must pass locally: `npm run test && npm run lint && npm run build && npm run test:e2e`

Never push directly to `main`. All changes must go through a pull request. A `pre-push` git hook in `.githooks/` enforces this — activated automatically via the `prepare` npm script on `npm install`.

## Monorepo layout

npm workspaces (root `package.json`: `"workspaces": ["packages/*", "apps/*"]`),
single root lockfile, no publish step for `@qrcraft/core` (workspace
resolution symlinks it). See `docs/specs/monorepo-consolidation.md` for the
full rationale.

```
qrcraft/
├── packages/core/    @qrcraft/core: pure QR logic, no React/DOM/storage
│                     (enforced by an eslint no-restricted-imports/globals
│                     rule scoped to packages/core/src/**/*.ts). Builds to
│                     CommonJS (`tsc -p tsconfig.build.json`) so apps/mcp
│                     (plain Node) can run it directly; apps/web consumes
│                     the same dist/ build via workspace resolution.
├── apps/web/         the app (this file's main subject) — everything
│                     under "Architecture" below lives here unless noted
└── apps/mcp/         MCP server: generate_qr / generate_structured_qr
                      tools over stdio + Streamable HTTP, consuming
                      @qrcraft/core directly (never copies its logic)
```

**Vite dev-server gotcha:** Vite excludes linked workspace packages from
dependency pre-bundling by default and serves them live via `/@fs` instead;
because `@qrcraft/core` builds to CommonJS, that live path doesn't reliably
resolve every named export of its `export *` barrel (breaks with "does not
provide an export named ..." even though the built dist is correct). Fixed
by `optimizeDeps.include: ['@qrcraft/core']` in `apps/web/vite.config.ts` —
don't remove it. If you edit `packages/core` and the dev server (or an
already-running one) throws a stale/missing-export error, rebuild core
(`npm run build --workspace=packages/core`) and, if that alone doesn't fix
it, clear `apps/web/node_modules/.vite`.

**Adding a locale:** add the JSON to `packages/core/src/i18n/` and to
`SUPPORTED_LOCALES` in `packages/core/src/i18n/locales.ts`, then wire it
into the registry `apps/web/src/data/i18n/index.ts` imports from
`@qrcraft/core` — that registry is the single source of truth `SupportedLocale`
derives from everywhere, not a re-derivation.

## Architecture

### State flow

`useQRGenerator` owns all QR config state. Input fields update "pending" state (e.g. `inputFgColor`), and a **300 ms debounce** promotes them into `config`, which drives the `qrcode.react` preview. There is no Generate button: the preview is live, and `QRControls.test.tsx` asserts the button is absent. Downloads use the headless `qrcode` library against the pending input state — not the DOM.

**Capacity guard.** `packages/core/src/utils/qrCapacity.ts` holds the version-40 byte-mode capacity per EC level and `getCapacityStatus` (measured in UTF-8 bytes) — shared with the MCP server. `useQRGenerator` treats content past that capacity like its length validation: `isBlocked` clears the live preview and disables downloads, so `qrcode.create` never sees an unencodable value. This matters because `getMatrixSize` (`packages/core/src/utils/qrShapeRenderer.ts`) runs at render and `qrcode.create` throws on over-capacity input — reachable at Q/H levels under the 2000-char input cap — so it catches and falls back to the version-1 size rather than crashing the generator. The `CapacityCounter` is the visible signal: `used / max`, amber near the limit, red over it. It renders under the Text/URL field in text mode, and above the reliability row in every structured mode (measuring the raw field bytes, not the built payload).

### Context providers (wired in `apps/web/src/main.tsx`)

- `ThemeProvider` — reads/writes `localStorage`, toggles `.dark` on `<html>`, exposes `useThemeContext()`
- `LocaleProvider` — reads/writes `localStorage`, syncs `document.documentElement.lang`, exposes `useLocaleContext()` with `translate(key)` and a locale-aware `seo` object. Locales are additive: add the JSON to `packages/core/src/i18n/` and to `SUPPORTED_LOCALES` in `packages/core/src/i18n/locales.ts` (the single source of truth `apps/web/src/data/i18n/index.ts`'s registry builds on, not re-derives), and `SupportedLocale`, the `TranslationKey` union, and the registry all widen from it (no other type edits). `LocaleMetadata.switchTo` is a `Partial` record, so a new locale needs no edits to existing locale files; `getCopy()` falls back to the default locale for any missing key. The navbar `LanguageToggle` is a native `<select>` dropdown that lists every locale in `localeCodes` by its `locale.name`, so it picks up new locales automatically.

### Directory conventions

| Path | Purpose |
|---|---|
| `apps/web/src/components/common/` | Reusable primitives (Button, Input, Textarea, Card, etc.) |
| `apps/web/src/components/feature/qr/` | QR-specific views |
| `apps/web/src/hooks/` | Stateful hooks and context providers |
| `apps/web/src/utils/` | App-specific pure helpers (DOM/canvas rendering, `localStorage`-backed persistence) — every file here requires a corresponding test |
| `apps/web/src/data/` | Static config and the app-side i18n registry/resolver |
| `packages/core/src/utils/` | Pure QR logic shared with `apps/mcp` (payload builders, geometry, validation, batch/CSV parsing) — every file here requires a corresponding test, and none of it may import React/DOM/storage (enforced by lint) |
| `packages/core/src/i18n/` | Locale JSON (`en.json`, `es.json`) and the locale registry |
| `packages/core/src/types/` | Shared TypeScript types |
| `apps/mcp/src/` | The MCP server (tools, transports, the `qrcode`-based renderer) |

### Styling

Tailwind CSS v4 via `@tailwindcss/vite`. Entry point is `apps/web/src/index.css`. Use semantic design tokens (CSS custom properties) for all colors — never hard-code hex values in component classes. The `dark` class on `<html>` drives dark-mode variants.

Content detection is scoped explicitly: `@import 'tailwindcss' source(none)` plus `@source '../src'` and `@source '../index.html'`. Without this Tailwind also scans `specs/*.md` and `README.md` and emits palette colors quoted in prose. If a class stops applying, check it lives under a declared source.

Token rules worth knowing:
- `text-disabled` is for genuinely disabled controls only (WCAG 1.4.3 exempts them). Placeholders, empty states and hints are real text: use `text-secondary`.
- `border-strong` is the boundary of interactive controls and meets 3:1 (SC 1.4.11). `border-subtle` is decorative only — dividers, panels, popovers — and must never be a control's sole boundary.
- `--tw-ring-offset-color` is bound to `--color-surface` in `@layer base`; do not re-specify a ring offset color per component.
- QR output colors (`DEFAULT_QR_CONFIG` in `apps/web/src/data/defaults.ts`) are concrete hex, not tokens: they are baked into the exported file and must not follow the UI theme. Derive fallbacks from that constant rather than repeating literals.

### Views

Three top-level views toggle via a `PillGroup` in `apps/web/src/App.tsx`: **Generate** (`QRGenerator`), **Batch** (`BatchGenerator`), **Scan** (`QRScanner`). Generate stays mounted (`hidden`); Batch and Scan are `React.lazy` behind a `<Suspense>` boundary, so `@zxing/library` (~598 kB) and `jspdf` stay out of the entry chunk. A static import of either defeats this — keep them lazy.

### Share / export

`useQRShare` handles the share button: tries `navigator.share` with files → `ClipboardItem` image write → download fallback. `apps/web/src/utils/export/` holds the headless renderers.

**Download PNG is the primary action** (terracotta pill, states its `QR_SIZE_DOWNLOAD` output size); SVG, Share and Copy link are secondary and share one disabled treatment, explained by `controls.downloadsDisabledHint`. There is no hi-res export modal: `ExportModal`, `FormatSelector`, `DimensionSelector` and `useExportState` were unreachable dead code and were removed. PNG exports at `QR_SIZE_DOWNLOAD` (1024).

Headless rendering (no DOM preview) is shared: `renderQrPngBlob` (`apps/web/src/utils/export/pngRenderer.ts`) for PNG, `exportSvg` / `exportPdf` for the rest. The single-QR download path and batch generation both go through these. (The MCP server has its own, unrelated headless renderer — `apps/mcp/src/render.ts`, over the `qrcode` package's native Node output — since these DOM-bound renderers can't run there.)

### Batch generation

`BatchGenerator` + `useBatchGenerator` render a pasted list (one value per line, deduped, capped at `BATCH_MAX_LINES`) to PNG/SVG/PDF, or a **Labels** sheet, and pack them into one ZIP via `fflate` (ZIP formats) or a single PDF (Labels). The list can also be populated via **file upload** (`.txt` or `.csv`), either through the **Import** button or by **dragging a file onto the list area** (both routed through the same `processFile` handler and `.txt`/`.csv` validation; drop handlers live on the textarea's wrapper so a drop still lands while the textarea is `readOnly` — `readOnly`, never `disabled`, so the imported rows stay in the accessibility tree and the tab order). A `.txt` file is passed through as-is and a single-column `.csv` extracts that column — both via `parseBatchFile.ts` (`apps/web/src/utils/batch/`, DOM/File-API-bound so it stays out of `@qrcraft/core`), with no header detection. A **multi-column `.csv`** instead opens a **column-mapping** UI: `parseBatchCsv.ts` (`packages/core/src/utils/batch/`) parses the grid (first row = header, RFC-style quoted fields), and the user picks a **content type** plus which column supplies each of its fields, and optionally which column names each output file. Content types are declared in `csvContentTypes.ts` (`packages/core/src/utils/batch/`, `CSV_CONTENT_TYPES`): each entry lists its fields (column-mapped text fields, or fixed enum/toggle fields applied to every row) and a `build` that calls the same `buildXString` helper as the single-QR view (Wi-Fi, vCard, email, SMS, tel, geo, vEvent, crypto; `text` encodes one column verbatim) — these builders and `csvContentTypes.ts` itself are shared with the MCP server's `generate_structured_qr` tool. `buildCsvValues` runs every row through `build` (skipping rows that build to '', e.g. a missing required field), and `autoMapColumns` wires fields to columns whose header matches the field key. The built payloads go into `preparedValues` on the hook, the source of truth for the count and `generate` whenever a mapping is active, so a payload that legitimately contains newlines (vCard, iCalendar) is **never** round-tripped through the textarea, where `parseBatchInput` (`packages/core/src/utils/batch/`) would split it on its own lines into junk codes. `parseBatchInput` splits on newlines for the plain textarea path; `dedupeAndCap` is the shared no-split half that `preparedValues` uses. The filename column builds a `value → filename` map (`filenameOverrides` on the hook) threaded into `buildBatchZip` (`apps/web/src/utils/batch/`) and applied by `batchFilename` (`packages/core/src/utils/batch/`; override slug, no ordinal prefix; falls back to the default name when a value is unmapped or its cell is blank). Overrides apply only to the ZIP formats — the Labels output is a single PDF, so its picker is hidden. Each content type also defines a `caption(get)` (Wi-Fi → SSID, contact → full name, email/sms/tel → recipient/number, geo → `lat,long`, event → summary, crypto → network); `buildCsvValues` returns a `value → caption` map (`captionOverrides`) passed to `buildLabelSheetPdf` as `captionByValue`, so a **Labels** sheet shows a readable caption instead of the raw payload (a value absent from the map, e.g. `text`, falls back to the payload itself). Field labels reuse the existing single-QR `controls.*` i18n keys; only mapping-chrome and the drop hint are new (`batch.csvMap*`, `batch.dropHint`). While a multi-column-CSV mapping is active the textarea is a **read-only source view** of the uploaded file's data rows, comma-separated (header excluded, RFC-quoted via `csvRowsToCommaText` in `parseBatchCsv.ts`); column/type/filename changes update `preparedValues` only and never rewrite it, and a small preview lists the built payloads. The **Clear** button (or importing a `.txt`/single-column `.csv`) drops the mapping and re-enables the textarea for manual entry. Mapping state is component-local, so a tab switch drops it (the raw rows persist as plain textarea text, and then generate as literal comma-joined codes until re-mapped). Batch parsing (`parseBatchInput`, `parseBatchCsv`, `csvContentTypes`, `batchFilename`) lives in `packages/core/src/utils/batch/`; the DOM-bound half (`parseBatchFile`, `buildBatchZip`) lives in `apps/web/src/utils/batch/`. Labels output uses `labelSheetLayout.ts` for pure-geometry grid maths (page presets, cell placement in PostScript points) and `buildLabelSheetPdf.ts` for the jsPDF render (both `apps/web/src/utils/batch/`); three Avery-style presets are available (A4·3×7, A4·2×4, Letter·3×6). Each code inherits the user's current design read from `localStorage`: design/frame via `persistedDesign.ts`, foreground/background/EC via `persistedAppearance.ts` (both `apps/web/src/utils/`, storage-bound so they stay out of `@qrcraft/core`). These loaders are the single source of truth, also consumed by `useQRDesign` / `useQRGenerator`, so a batch code matches the live preview. Because the tab mounts on demand it re-reads that design on each open; the pasted list itself is persisted so a tab switch doesn't lose it.

## Testing

Vitest with jsdom (apps/web) / Node (packages/core). Setup file:
`apps/web/src/setupTests.ts` (imports `@testing-library/jest-dom`). Mock
browser APIs (`navigator.share`, `ClipboardItem`) per test file. Coverage
thresholds are per-package: `apps/web` **85%**, `packages/core` **95%**
(branches **90%**, a known small gap — see the spec's "Changes from plan").
`apps/web/vite.config.ts` excludes `packages/core` from its own coverage
collection (a symlinked workspace package would otherwise be double-counted
against apps/web).

Mocking `@qrcraft/core` in an apps/web test: it's a built package, so its
export namespace is frozen and `vi.spyOn` can't redefine an export on it
directly (unlike a same-app relative import). Use `vi.mock('@qrcraft/core',
async importOriginal => ({ ...(await importOriginal()), theExport: vi.fn() }))`
instead — see `apps/web/src/hooks/__tests__/useQRGenerator.test.tsx`.

Playwright e2e tests live in `apps/web/e2e/`. Run with `npm run test:e2e`
(root) or `npm run test:e2e --workspace=apps/web`. Every user-facing feature
or fix must have a corresponding e2e spec that proves the scenario works in
a real browser. The suite runs across four projects (desktop/mobile ×
light/dark) and must pass before opening a PR.

## Commit discipline

One logical change per commit. Each of the following is its own commit boundary — do not bundle them:

| Category | Path |
|---|---|
| New/rewritten component | `apps/web/src/components/` |
| New/rewritten hook | `apps/web/src/hooks/` |
| New app-specific utility module + its test | `apps/web/src/utils/` |
| New/updated shared QR-logic module + its test | `packages/core/src/utils/` |
| New/updated type definition | `packages/core/src/types/` |
| e2e spec (one scenario group) | `apps/web/e2e/` |
| i18n key addition (all locales) | `packages/core/src/i18n/` (JSON), `apps/web/src/data/i18n/` (registry wiring) |
| MCP server change | `apps/mcp/src/` |
| Doc update | `CLAUDE.md`, `README.md`, `DESIGN.md`, `PRODUCT.md` |

If a task touches more than two categories, stage and commit one at a time.

## Agent tooling

Everything is installed as **Claude Code plugins** (`/plugin`) rather than the
old vendored `.agents/` tree with `skills-lock.json`, both of which are gone.

| Source | Provides |
|---|---|
| `impeccable` plugin | `/impeccable`, plus a vendored copy at `.claude/skills/impeccable/` and four subagents in `.claude/agents/` |
| `git-workflow` plugin | `/git-workflow:commit-message`, `/git-workflow:create-pr`, and the `PreToolUse` guards that enforce them |
| `web-dev` plugin | `/web-dev:develop-web-feature`, `/web-dev:update-readme` |
| `react-native-dev` plugin | `/react-native-dev:develop-react-native-feature`, `/react-native-dev:update-readme` |

The `speckit-*` set was removed outright and is not coming back.

The last three are enabled for everyone: `.claude/settings.json` commits an
`enabledPlugins` block naming them, so a fresh clone gets the same set without
anyone running `/plugin` by hand. `impeccable` is not in that block — `/impeccable`
resolves from the committed `.claude/skills/impeccable/` copy described below.

**Committing goes through the skill.** The git-workflow plugin restores a
`PreToolUse` guard on `git commit` and `gh pr create`; a commit is allowed only
when it carries `CLAUDE_COMMIT_VIA_SKILL=1`, which the skill sets. Do not bypass
it with `--no-verify`.

`impeccable` writes a repo-local copy into `.claude/skills/impeccable/` on init,
and that copy **is committed** so a fresh clone has the reference files. Its
~12 MB platform engine binary is not: `.gitignore` excludes
`.claude/skills/impeccable/scripts/bin/`, and the launcher downloads the right
one into `~/.impeccable/` on first run.

### Permissions

Auto-approve grants are **personal, not shared**: they live in the gitignored
`.claude/settings.local.json`, where Claude Code also writes "always allow"
approvals. The committed `.claude/settings.json` holds only repo-wide tooling
config — currently the `enabledPlugins` block above — and must never hold
per-developer grants. Note that `settings.local.json` may still contain stale
entries pointing at the removed skill scripts; they are inert.

> **Workspace trust required.** If you see `Ignoring N permissions.allow entries from .claude/settings.local.json: this workspace has not been trusted`, the allow list is silently inactive. Fix it one of two ways:
> - Run `claude` interactively in this directory once and accept the trust dialog that appears.
> - Or add the entry directly to your personal Claude config (`~/.claude.json`):
>   ```json
>   {
>     "projects": {
>       "/path/to/qr-generator": { "hasTrustDialogAccepted": true }
>     }
>   }
>   ```

## Deployment

- **GitHub Pages**: `.github/workflows/deploy.yml` triggers on a published GitHub release (`release: published`) or manual `workflow_dispatch`, not on push to `main` — building `apps/web`, uploading `apps/web/dist` as the Pages artifact. A path filter would be meaningless here since the trigger isn't path-scoped.
- **Docker image**: published to GHCR on version tags (e.g. `git tag v1.0.0`); Trivy blocks high/critical CVEs. The build context is still the repo root (`.`) — npm workspaces needs the root manifest — but the `Dockerfile` `COPY`s only `apps/web/`'s files plus the root `package.json`/`package-lock.json` into the builder stage, and the runtime stage copies `apps/web/dist`.
- **CI path filtering**: `lint`, `e2e`, `docker-publish`, and `security` trigger on `packages/core/src/**` changes too (and `apps/mcp/src/**` for `lint`/`security`), since `apps/web` depends on core and every package shares the root lockfile. `main` currently has no branch protection configured, so there's no required-check-stuck-on-a-skipped-job risk to worry about yet — revisit the "always-green companion job" pattern in the spec if that changes.
- **Dependabot**: runs daily for npm; no auto-merge

The site serves from the custom domain in `CNAME` (`qrcraft.pyaethuaung.com`). If that domain changes, update `CNAME` **and** the `url` property in `apps/web/src/components/common/SEOHead.tsx` together — they must agree or the JSON-LD structured data is invalid.