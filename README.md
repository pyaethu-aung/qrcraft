# QRCraft

[![Deploy to GitHub Pages](https://github.com/pyaethu-aung/qrcraft/actions/workflows/deploy.yml/badge.svg)](https://github.com/pyaethu-aung/qrcraft/actions/workflows/deploy.yml)
[![Lint and Type Check](https://github.com/pyaethu-aung/qrcraft/actions/workflows/lint.yml/badge.svg)](https://github.com/pyaethu-aung/qrcraft/actions/workflows/lint.yml)
[![Security Scan](https://github.com/pyaethu-aung/qrcraft/actions/workflows/security.yml/badge.svg)](https://github.com/pyaethu-aung/qrcraft/actions/workflows/security.yml)

Single-page app for generating QR codes with real-time preview and
download, plus batch generation (a list of codes as one ZIP) and a built-in
scanner for decoding codes from an image or the camera.

## Content types

The generator encodes eight kinds of content, selectable from the pill bar
above the form:

- **Text / URL** — free-form text or a link (the default).
- **Wi-Fi** — network credentials; scanning joins the network.
- **Contact (vCard)** — name, phone, email, and address as a vCard.
- **Email** — a `mailto:` link with optional subject and body.
- **SMS** — a phone number with an optional pre-filled message.
- **Phone** — a `tel:` link that starts a call on scan.
- **Location** — geographic coordinates as a `geo:` URI, with a
  "use my location" helper.
- **Event** — a calendar event (RFC 5545 `VCALENDAR`/`VEVENT`): title,
  start/end, an all-day toggle, location, and an optional description.
  Times are encoded as floating local time so the event lands at the
  wall-clock time the scanner's device is set to; all-day events use
  `VALUE=DATE` with the exclusive end date handled automatically.

The **Text / URL** field shows a live capacity counter beneath it: the
characters used against the QR code's capacity for the current error
correction level (for example `42 / 1273`, where the limit shrinks as
reliability rises). It turns amber as the content nears the limit and red
once it goes over. Content past the limit is held back from generating
rather than failing, so the preview always stays a code that scans.

## Customization

QR codes can be styled before download:

- **Eye border & eye center** — the three finder squares are styled as two
  independent parts: the outer border (Square, Rounded, Circle, Leaf, Hexagon,
  SquareRound, RoundSquare, Diamond) and the inner center (Square, Rounded, Dot,
  Diamond, Star, Cross), in any combination.
- **Eye colors** — the border and center each take their own color, independent
  of the data modules. Both default to the foreground color ("Match foreground").
- **Pixel pattern** — data modules render in eight styles: Square, Dots, Rounded,
  Diamond, Vertical, Horizontal, Classy, and Fluid. Classy and Fluid are
  neighbor-aware: adjacent dark modules merge into a continuous connected form
  rather than rendering as isolated shapes.
- **Frames** — wrap the code in a decorative, code-drawn frame with a
  call-to-action caption. Eight styles (Banner, Card, Ticket, Label, Bubble,
  Corners, Photo, Circle) plus None (the default). Circle inscribes the QR in an
  accent-color ring with a SCAN ME pill straddling the ring edge. The caption
  text, frame color, and caption position (top/bottom) are configurable; the
  caption auto-contrasts against the frame fill. Frames are built from SVG
  primitives (no raster/licensed image assets) and render identically in the live
  preview and every export (PNG/SVG).
- **Colors, error correction & logo** — foreground/background colors, EC level,
  and an optional centered logo overlay.
- **Foreground fill** — the foreground is a solid color or a two-stop gradient
  (linear with eight preset directions, or radial). The gradient spans the whole
  foreground as one continuous field, so data modules and any eye that inherits
  the foreground flow together; an eye with its own color stays solid.
- **Contrast warnings** — a dismissible alert appears when the foreground/background
  contrast ratio falls below 3:1 or the colors are inverted (light on dark), both
  of which can prevent scanners from reading the code. With a gradient, both stops
  are checked and the worst case is reported.

The white separator gap and dark center are always preserved, so any eye
combination stays scannable. Path rendering lives in
`packages/core/src/utils/qrShapeRenderer.ts` (shared with the MCP server),
frame artwork in `apps/web/src/utils/frameRenderer.ts`, and
`apps/web/src/utils/qrSvgComposer.ts` is the single source that composes the
QR + frame SVG for the preview and all exports. Styling and frame state are
owned by `useQRDesign` and persisted to `localStorage`.

## Saved presets

The **Saved designs** panel below the Generate form stores up to 10 named design
configurations (foreground/background color, error correction, eye shapes, pixel
pattern, and frame) for one-click reuse across any content type. Click
**Save design**, name the preset, and press Enter or the confirm button; the new
card appears immediately with a color-swatch preview showing the saved colors.
Clicking a preset card applies all its settings to the current form without
changing the QR content.

Deleting a preset requires two clicks: the first click puts the card in a
pending state (trash icon, red ring); the second click confirms. Press Escape or
wait 2.5 seconds to cancel. Presets are stored in `localStorage` and survive
page reloads.

## Batch generation

The **Batch** view (toggle at the top of the page) turns a list into many
codes at once. Paste one URL or line of text per row, use the **Import
from file** button, or **drag a `.txt` or `.csv` file straight onto the list**
to load one directly (up to 200 entries; blank lines and exact duplicates are
dropped). Choose a format
(PNG, SVG, PDF, or **Labels**), and **Generate ZIP** renders each code and
downloads them as a single archive. Files are named by position and a slug of their content
(`001-example-com.png`), so they sort in the order you pasted them.

When you import a `.csv` with more than one column, the list shows the file's
rows (comma-separated) as a read-only source view and a **column-mapping**
panel appears beneath it (the first row is treated as the header). Pick a
**content type** and map its fields to columns:

- **Text** (default) encodes one chosen column verbatim, exactly as before.
- **Wi-Fi, Contact, Email, SMS, Phone, Location, Event, Crypto** build a
  proper payload per row from the columns you map (e.g. `ssid` and
  `password` columns for Wi-Fi, or first name / phone / email columns for a
  contact). Fields whose header name matches are wired up automatically, and
  settings that rarely vary per row (Wi-Fi security, crypto network) are
  single dropdowns applied to every row. Each code is built with the same
  logic as the single-QR view, so contact and event codes (whose payloads
  span several lines) come out intact rather than split into junk codes.

Optionally pick a column to name each file (e.g. a `vehicle_id` column,
producing `truck-12.png` instead of `001-…`). The filename mapping applies
to the ZIP formats only; the single-PDF **Labels** output ignores it.
Rows missing a required field are skipped. While a mapping is active the list
is read-only; the **Clear** button (or importing a `.txt` / single-column
`.csv`) resets the mapping and re-enables manual entry.

**Labels** produces a single printable PDF arranged in an Avery-style grid
instead of a ZIP. Three presets are available via a layout picker:

| Preset | Page | Grid |
|---|---|---|
| A4 · 3×7 (default) | A4 | 3 columns × 7 rows (21 per page) |
| A4 · 2×4 | A4 | 2 columns × 4 rows (8 per page) |
| Letter · 3×6 | Letter | 3 columns × 6 rows (18 per page) |

A **Captions** toggle controls whether each cell includes a label beneath
the code. When you map structured columns, the caption is the readable
field rather than the raw payload: a Wi-Fi code is captioned by its network
name, a contact by its full name, a location by its `lat,long`, an event by
its title, and so on. Plain text and URLs are captioned by their value. The
page geometry lives in `apps/web/src/utils/batch/labelSheetLayout.ts` and the
PDF renderer in `apps/web/src/utils/batch/buildLabelSheetPdf.ts`.

> **Known limitation (TODO):** label-sheet captions render in Helvetica,
> which has no Burmese glyphs, so a Burmese caption (e.g. a contact name or
> event title) prints as missing glyphs. The QR payload and the on-screen
> UI are unaffected. Fix: embed a Unicode font (e.g. Noto Sans Myanmar) in
> the PDF (see the `TODO(i18n)` in `buildLabelSheetPdf.ts`).

Every code inherits the design you last configured in the Generate tab:
foreground/background colors, error correction, eye shapes, pixel pattern,
gradient, and frame. Generation is fully client-side and reuses the same
headless exporters as the single-QR download (`apps/web/src/utils/export/`);
the list is rendered and zipped in `apps/web/src/utils/batch/` (with
`fflate`), driven by `useBatchGenerator`. Parsing the pasted list/CSV and
building structured payloads (Wi-Fi, vCard, etc.) lives in
`packages/core/src/utils/batch/`, shared with the MCP server. The pasted
list persists to `localStorage` so switching tabs doesn't lose it.

## Scanning

The **Scan** view (toggle at the top of the page) reads a QR code back into
text. It accepts two inputs:

- **Image** — drag-and-drop or pick a file.
- **Camera** — a live `getUserMedia` stream, decoded frame by frame.

Decoding prefers the browser's native `BarcodeDetector` (Chrome/Android) and
falls back to the `@zxing/library` decoder where it is unavailable
(Safari/Firefox). Because a code that is small or distant in a large photo
fails to locate at full resolution, the fallback retries each image across a
descending ladder of sizes until one reads.

HEIC/HEIF and TIFF uploads (an iPhone shoots HEIC by default) decode natively
only in Safari. On other browsers the scanner sniffs the format from the
file's leading bytes and decodes it with a codec loaded on demand — `heic-to`
(libheif) for HEIC, the pure-JS `utif` for TIFF — so the heavy WASM never
loads until a file actually needs it. AVIF is left to the browser, which
decodes it natively.

On a successful decode the result shows the text and its detected content
type, with actions to **Copy**, **Open** (for URLs), and **Edit in
generator**, which round-trips the value back into the Generate flow. The
pure decode/sniffing logic lives in `apps/web/src/utils/qrDecode.ts` and
`apps/web/src/utils/imageFormat.ts`; the camera/canvas glue is in
`apps/web/src/hooks/useQrScanner.ts`.

Every decoded scan is remembered under **Recently scanned**, mirroring the
generate-side history: the last eight scans are kept in `localStorage`
(deduped by value), each shown as a row with its content-type icon and a
readable label. Tapping a row restores it into the result panel — with the
same Copy / Open / Edit-in-generator actions — each row has a remove button
that forgets just that scan, and a clear button wipes the whole list. The
list survives a reload. Storage lives in `apps/web/src/utils/scanHistory.ts`;
the row list is `ScanHistory.tsx`.

## Stack

- React 19, TypeScript, Vite 8
- Tailwind CSS v4 (via `@tailwindcss/vite` + `@tailwindcss/postcss`)
- `react-helmet-async`: For managing document head and SEO metadata
- `qrcode.react` for preview, `qrcode` for asset generation
- `fflate` for client-side ZIP packing in batch generation
- `@zxing/library` for QR decoding; `heic-to` + `utif` for HEIC/TIFF uploads
- Testing: Vitest + React Testing Library + jest-dom
- Linting/formatting: ESLint (type-aware) + Prettier

## Monorepo layout

QRCraft is an npm-workspaces monorepo: `apps/web` (this app), `packages/core`
(`@qrcraft/core`, pure QR logic with no React/DOM/storage dependency, shared
with `apps/mcp`), and `apps/mcp` (an MCP server exposing `generate_qr` and
`generate_structured_qr` tools over stdio and Streamable HTTP). Root `npm run
dev`/`build`/`test`/`lint` still work exactly as before from the repository
root; they delegate into the workspaces internally. See
[`docs/specs/monorepo-consolidation.md`](docs/specs/monorepo-consolidation.md)
for the full rationale and migration.

## Project Structure

- `apps/web/src/components` – UI components (common primitives, feature views)
- `apps/web/src/hooks` – stateful logic/hooks
- `apps/web/src/utils` – pure helpers that stay app-specific (DOM/canvas
  rendering, `localStorage`-backed persistence)
- `apps/web/src/data` – data shapers/models, plus the app-side `i18n` registry
  and `getCopy()` resolver
- `packages/core/src/utils` – pure QR logic shared with `apps/mcp`: payload
  builders (Wi-Fi, vCard, email, SMS, tel, geo, vevent, crypto), QR geometry,
  capacity/contrast/gradient/phone/country validation, and batch/CSV parsing
- `packages/core/src/i18n` – the locale JSON files and the locale registry
  (`SUPPORTED_LOCALES`) apps/web's i18n builds on
- `packages/core/src/types` – shared types
- `apps/mcp/src` – the MCP server: `server.ts` registers the tools,
  `transports/` holds stdio and Streamable HTTP, `render.ts` wraps the
  `qrcode` package's native Node output

## Localization (i18n)

The app supports multiple languages (English and Spanish) via custom locale
config files. The JSON copy and the locale registry
(`SUPPORTED_LOCALES`) live in `packages/core/src/i18n/` (shared with the MCP
server and a future mobile app); the app-side flatten/cache/`getCopy()`
resolver lives in `apps/web/src/data/i18n/`.
- Localized strings are stored in `en.json` and `es.json`.
- Components consume translations via `useLocaleContext` and `translate(key)`.
- User language preference is persisted in `localStorage`.
- The globe dropdown in the navbar lists every registered locale by its own name; adding a new locale extends the list automatically.
- Any missing translation key falls back to English, so a new locale renders even before every string is translated.

## SEO & Accessibility

- Metadata (title, description, Open Graph, Twitter) is automatically updated on language change.
- HTML `lang` attribute is kept in sync with the active locale.
- **WCAG 2.2 AA** is treated as a property of the token layer rather than something patched per component: 4.5:1 for all text including placeholders and empty states (SC 1.4.3), 3:1 for the boundary of every interactive control (SC 1.4.11), no clipped content at 200% text size (SC 1.4.4), and hover/focus panels that dismiss with Escape and survive the pointer entering them (SC 1.4.13).
- Every focusable element has a visible focus ring, with the ring offset bound to the page surface so it reads as a gap in both themes.
- `prefers-reduced-motion` is honoured as an opt-in: transitions collapse and animations are gated behind `motion-safe`, with no global animation kill that would remove useful feedback such as the scan spinner.
- Screen-reader semantics are checked in `e2e/accessibility.spec.ts`, which runs across desktop and mobile in both themes.

## Development

- Install: `npm install` (also activates git hooks in `.githooks/` via the `prepare` script — the `pre-push` hook blocks direct pushes to `main`)
- Dev server: `npm run dev`
- Browser testing (Playwright CLI): one-time `npm i -D @playwright/test && npx playwright install chromium`; see [Browser testing](#browser-testing-playwright-cli) below
- Design source: `DESIGN.md` — tokens, component specs, and layout measurements; `PRODUCT.md` — brand personality and design principles
- Lint: `npm run lint` (fix: `npm run lint:fix`)
- Format check: `npm run format` (write: `npm run format:fix`)
- Tests: `npm run test` (watch: `npm run test:watch`, coverage: `npm run test:coverage`)
- Build: `npm run build`

## Browser testing (Playwright CLI)

End-to-end / visual tests live in `e2e/` and drive the running app in a real
browser, capturing a full-page screenshot and a video per run across desktop
and mobile, light and dark. Contributor guide:
[`e2e/README.md`](e2e/README.md).

```bash
npm run test:e2e                              # all projects (desktop/mobile x light/dark)
npx playwright test --project=desktop-light   # a single project
npx playwright show-report                    # open the last HTML report
```

One-time setup (the npm dependency is already in `package.json`):

```bash
npm install                       # installs @playwright/test
npx playwright install chromium   # browser binary (~150 MB; skips if cached)
```

The runner starts the dev server itself (`webServer` in `playwright.config.ts`,
default `http://localhost:5173`), so `npm run dev` need not be running. Output
lands in `test-results/` and `playwright-report/` (both gitignored). On every
PR to `main`, `.github/workflows/e2e.yml` runs the suite and uploads those as
artifacts, so the screenshots and recording are reachable from the PR's checks.
These tests are separate from the Vitest unit suite (`npm run test`); `e2e/` is
excluded from Vitest in `apps/web/vite.config.ts` so the two runners do not
collide.

## AI skills

Installed as Claude Code plugins (`/plugin`), not as a vendored `.agents/` tree:
[impeccable](https://github.com/pbakaus/impeccable) for design work, plus
`git-workflow` (commit and PR skills, with hooks that enforce them), `web-dev` and
`react-native-dev`. The last three are listed in the committed
`.claude/settings.json`, so a clone enables them automatically. The `speckit-*` set
was removed.

`impeccable` keeps a copy at `.claude/skills/impeccable/`, which is committed; its
platform engine binary is gitignored and downloaded on first run.

### Hands-off permissions

> **Workspace trust required.** If you see `Ignoring N permissions.allow entries … this workspace has not been trusted`, the allow list is inactive and every command will prompt. Fix it one of two ways:
> - Run `claude` interactively in this repo once and accept the trust dialog.
> - Or set `projects["/absolute/path/to/qr-generator"].hasTrustDialogAccepted: true` in your personal Claude config (`~/.claude.json`).

Grants live in the gitignored `.claude/settings.local.json`. The committed
`.claude/settings.json` carries only repo-wide tooling config (the enabled plugin
set) and must never hold per-developer grants.

## Docker Support

[![Docker Build](https://github.com/pyaethu-aung/qrcraft/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/pyaethu-aung/qrcraft/actions/workflows/docker-publish.yml)

Included Dockerfile supports multi-stage builds (Node.js builder → Nginx runtime) for a secure, optimized (<25MB) production image.

### Local Development

```bash
# Build image locally
npm run docker:build

# Run container at http://localhost:8080
npm run docker:run
```

### CI/CD Pipeline

- **Triggers**: GitHub release (published), PRs, and daily schedule (Build + Scan only).
- **Publish**: Images are pushed to GHCR on GitHub release publish (fires together with GitHub Pages).
- **Security**: Integrated Trivy scanning (blocking high/critical CVEs), Hadolint linting, and Cosign image signing.

## Quality & Constitution Highlights

- Every change must add/update relevant unit tests, maintain ≥85% coverage for `apps/web` and ≥95% (branches ≥90%) for `packages/core`, and all tests must pass before merge.
- Every user-facing feature or fix must have a Playwright e2e spec in `e2e/` that proves the scenario works in a real browser.
- Run `npm run test && npm run lint && npm run build && npm run test:e2e` before opening a PR. All four must pass.
- UI must be fully functional and consistent across desktop/mobile and major browsers via responsive design.
- Remove unused code/assets; keep files in the agreed structure above.
- CI gates: lint, test, build must pass; PR review required. A `pre-push` git hook prevents direct pushes to `main` — all changes must go through a pull request.

## Share experience

- The QR share button under the preview consumes `useQRShare`, so every tap goes through one handler that captures the canvas, conversts it to a PNG `SharePayload`, and shares using native APIs when possible.
- Capability detection prioritizes `navigator.share` with `files`, then clipboard image write via `ClipboardItem`, and finally a download link that names the file `qr-code.png`. The hook surfaces a polite status message (pending/shared/failed) that `aria-describedby` is wired to the button.
- On mobile devices we still attempt `navigator.share` even when `navigator.canShare({ files })` is absent, ensuring the share sheet receives the WYSIWYG PNG at the preview dimensions and colors.
- Validate share/fallback behavior with Vitest mocks, including the mobile path, clipboard path, and download fallback so every environment succeeds.

## Tailwind v4 Notes

- Entry point: `apps/web/src/index.css` imports `tailwindcss` and defines base/component layers.
- Vite integration: `@tailwindcss/vite` plugin plus `@tailwindcss/postcss` in `postcss.config.cjs`.

## CI/CD & Deployment

This project uses GitHub Actions for automated testing, security scanning, and deployment.

### GitHub Pages Setup
To enable automated deployments:
1. Go to your repository **Settings > Pages**.
2. Under **Build and deployment > Source**, select **GitHub Actions**.
3. Publish a GitHub release to trigger the `deploy.yml` workflow.

### Auto Vulnerability Updates (009)
This project uses **GitHub Dependabot** for automated vulnerability patching.

**Configuration**:
- Configured in `.github/dependabot.yml`
- Targets `npm` ecosystem
- Runs daily
- **No auto-merge** (Manual review required)

**Setup Requirement**:
Repo admins must enable **Dependabot alerts** and **Dependabot security updates** in repository settings for this to function.

## SEO Maintenance

The application injects `SoftwareApplication` JSON-LD structured data into the document head for rich search results.

**Key Configuration:**
- The application URL is hardcoded in `apps/web/src/components/common/SEOHead.tsx`.
- The site serves from the custom domain in `CNAME` (`qrcraft.pyaethuaung.com`). If that domain changes, you **MUST** update `CNAME` and the `url` property in `SEOHead.tsx` together — they must agree to maintain valid schema markup.
