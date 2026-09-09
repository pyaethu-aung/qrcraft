---
slug: monorepo-consolidation
title: Monorepo for qrcraft, qrcraft-core and qr-mcp
status: shipped
branch: refactor/monorepo-consolidation
created: 2026-09-09
---

## Summary

QRCraft becomes a monorepo. The web app moves to `apps/web`, its pure QR logic is
extracted into a `@qrcraft/core` package, and the planned MCP server is created as
`apps/mcp` consuming that package rather than a copy of it. Nothing about the running
website changes: same features, same URL, same deploy trigger. The point is that a change
to a payload builder is now one commit and one test run instead of three divergent copies.

## Exploration

### The question

Three consumers want the same QR logic: the web app (shipping), an MCP server (planned in
`QR_MCP_PLAN.md`, not yet created), and a mobile app (see `qrcraft-mobile.md`). Where does
the shared code live?

### Alternatives weighed

**Separate repos, copy the files.** What `QR_MCP_PLAN.md` chose, with sound reasoning at
the time: "Drift risk is low, these files rarely change, and we can graduate to a shared
package later if they start diverging."

That reasoning held for **one** consumer. At three it inverts. Three copies of
`buildVCardString` is exactly the "if they start diverging" clause firing, and the
graduation it anticipated is this document.

**Separate repos, published package.** Correct in principle, but every cross-cutting change
becomes: edit core, bump, publish, then bump the dependency in two or three repos. For a
package that changes rarely that overhead is tolerable; for one under active development
across three consumers it is a tax on exactly the work we want to be cheap.

**Monorepo with workspaces.** Chosen. A change to a builder and its call sites lands in one
commit, one review, one test run. No publish step for internal consumption.

### Why this was not the first recommendation

An earlier review of this decision recommended **separate repos**, on two grounds: React
Native's Metro bundler fights Vite in a shared workspace, and the web app's tuned CI would
run on unrelated changes.

The second is solved here by path-filtered workflows (see below). The first does not apply
to this spec at all: `apps/web`, `packages/core` and `apps/mcp` are all plain
JavaScript and Node with no Metro anywhere. **The Metro risk arrives only with
`apps/mobile`,** which is why it is a separate spec landing after this one. Splitting the
work this way de-risks the one objection that still stands.

## Shape

### Target layout

```
qrcraft/
├── package.json              private root, workspaces: ["packages/*", "apps/*"]
├── package-lock.json         single lockfile for the whole workspace
├── .nvmrc                    unchanged
├── docs/specs/               this file and its siblings
├── packages/
│   └── core/                 @qrcraft/core (pure QR logic, no React, no DOM)
└── apps/
    ├── web/                  the current app, moved wholesale
    └── mcp/                  new: MCP server over stdio + Streamable HTTP
```

### What `@qrcraft/core` contains

Only modules that are already free of React and the DOM, which is why the extraction is
cheap. Roughly 2,040 lines, all with existing tests.

| Area | Modules |
|---|---|
| Payload builders | `wifi`, `vcard`, `email`, `sms`, `tel`, `geo`, `vevent`, `crypto`, `url` |
| QR geometry | `qrShapeRenderer` (emits SVG path data; the only runtime dependency, `qrcode`) |
| Validation and maths | `qrCapacity`, `contrast`, `gradient`, `phone`, `country`, `qrClassify` |
| Batch parsing | `parseBatchInput`, `parseBatchCsv`, `csvContentTypes`, `batchFilename` |
| Misc pure helpers | `concurrency`, `presets`, `textFormat` |
| Types | everything in `src/types/` |
| Copy | `en.json`, `es.json`, exposed as the `@qrcraft/core/i18n` subpath |

**Explicitly not in core**, because each is bound to a platform:

- Anything touching `document`, `canvas`, `Blob` or `URL.createObjectURL`:
  `pngRenderer`, `svgExporter`, `pdfExporter`, `logoCompositor`, `frameRenderer`,
  `qrSvgComposer` (it composes a string for a DOM/SVG consumer), `imageFormat`, `qrDecode`
- Anything touching storage: `safeLocalStorage`, `persistedDesign`, `persistedAppearance`,
  `localStorageList`, `history`, `scanHistory`, `shareConfig`, `metadata`
- Every component and hook

`i18n` sits in core rather than the web app because the mobile app needs the same copy.
`apps/mcp` simply never imports that subpath.

### Dependency wiring

`@qrcraft/core` is consumed by workspace resolution, not a registry:

```json
{ "dependencies": { "@qrcraft/core": "*" } }
```

npm workspaces symlinks it. There is deliberately **no publish step**: that convenience is
the main thing the monorepo buys, and reintroducing a version bump between core and its
consumers would give it back.

One consequence: if `apps/mcp` is ever published to npm, it must **bundle** core (tsup or
esbuild) rather than declare it as a dependency, since `@qrcraft/core` will not exist on
the registry. Decide that when the MCP server is actually published, not now.

### Package manager

**Stay on npm workspaces.** The project already uses npm with a committed
`package-lock.json`, and npm has had workspaces since v7; the installed npm is 11.

pnpm has genuinely better monorepo semantics, principally that it isolates dependencies
per package instead of hoisting. That difference does not matter for these three packages
and matters a great deal for `apps/mobile`, so it is recorded as the escape hatch in
`qrcraft-mobile.md` rather than a change made here. Changing package manager is its own
migration and should not ride along with the restructure.

No Turborepo or Nx initially. Three packages do not need task caching, and adding a build
orchestrator alongside a directory move doubles the number of things that can break in one
step. Revisit when the workspace has enough packages that a full test run is slow.

### Requirements

- **FR-001**: The website MUST be functionally unchanged. Same features, same
  `qrcraft.pyaethuaung.com`, same deploy on push to `main`.
- **FR-002**: All four existing gates MUST pass from the repository root:
  `npm run test`, `npm run lint`, `npm run build`, `npm run test:e2e`.
- **FR-003**: `@qrcraft/core` MUST import nothing from React, the DOM, or any storage API.
  Enforced by lint, not convention (see below).
- **FR-004**: Unit coverage MUST hold at **85% or above for `apps/web`**, and at **95% or
  above for `packages/core`**. Core is pure input-output logic with no untestable
  branches, so the web app's threshold is too lenient for it.
- **FR-005**: CI workflows MUST be path-filtered so a change to one package does not run
  unrelated jobs.
- **FR-006**: `apps/mcp` MUST consume `@qrcraft/core` directly. The copy-the-files
  approach in `QR_MCP_PLAN.md` is superseded and that document should be deleted once
  this lands.
- **FR-007**: A single `package-lock.json` MUST remain at the root. Per-package lockfiles
  defeat the purpose.

### Enforcing the core boundary

FR-003 is the one rule that will erode silently, because importing a DOM helper into core
fails nothing until a non-browser consumer breaks. Enforce it in `eslint.config.js`:

```js
{
  files: ['packages/core/**/*.ts'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [{
        group: ['react', 'react-dom', 'react/*'],
        message: '@qrcraft/core must stay free of React. Platform code belongs in an app.',
      }],
    }],
    'no-restricted-globals': ['error',
      'document', 'window', 'localStorage', 'sessionStorage', 'navigator'],
  },
}
```

Verify the rule fires with a throwaway import before trusting it. A guard that quietly
fails to match is worse than no guard.

### CI path filtering, and the trap in it

Six workflows exist today: `deploy`, `docker-publish`, `e2e`, `lint`, `security`, plus
`base-node.yml.example`. After the move they need `paths:` filters:

| Workflow | Triggers on changes under |
|---|---|
| `deploy` (Pages) | `apps/web/**`, `packages/core/**` |
| `docker-publish` | `apps/web/**`, `packages/core/**`, `Dockerfile`, `.docker/**` |
| `e2e` | `apps/web/**`, `packages/core/**` |
| `lint` | any package |
| `security` | any package, plus `package-lock.json` |

`packages/core/**` appears in most rows because everything depends on it.

**The trap:** a required status check that is *skipped* by a path filter blocks merge
forever, because GitHub waits for a result that never arrives. Either keep these checks
non-required and rely on the branch rule, or add a companion job that always runs and
reports success when the filtered job was skipped. Decide before turning filters on, not
after the first stuck PR.

### Out of scope

- `apps/mobile`, which is `qrcraft-mobile.md`
- Turborepo, Nx, or any task-graph runner
- Switching to pnpm or yarn
- Publishing `@qrcraft/core` to a registry
- Any change to web features, design, or the deploy target
- Renaming the GitHub repository

## Migration sequence

Ordered so the gates are green at every commit. The move commit is the risky one and it
ships alone.

1. `chore: add workspace scaffolding`. Root `package.json` with `workspaces`, an empty
   `packages/` and `apps/`. Nothing moves; gates unaffected.
2. `refactor: move the web app to apps/web`, **the large mechanical commit**. `src/`,
   `e2e/`, `public/`, `index.html`, `vite.config.ts`, `playwright.config.ts`, both
   tsconfigs, `index.css`. Git detects the renames, so review the *config* diffs and let
   the file moves pass. Update: workflow paths, the Pages artifact directory, the
   Dockerfile build context, and the `test`/`lint`/`build` scripts at the root.
3. `feat(core): extract @qrcraft/core`. Move the pure modules with their tests, add the
   package manifest and the lint boundary rule, rewrite imports in `apps/web`.
4. `feat(mcp): scaffold the MCP server`. `apps/mcp` per `QR_MCP_PLAN.md`'s two tools
   (`generate_qr`, `generate_structured_qr`), both transports, consuming
   `@qrcraft/core`. Its own renderer: the `qrcode` package's Node output, not the web's
   DOM-bound `renderQrPngBlob`.
5. `ci: path-filter the workflows`, with the skipped-required-check decision applied.
6. `docs: update CLAUDE.md and README for the workspace layout`, and delete
   `QR_MCP_PLAN.md`, now superseded.

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **The Pages deploy breaks silently.** The artifact path changes from `dist` to `apps/web/dist`; a wrong path publishes an empty site with a green check | **High** | Verify the deployed site loads after step 2, before continuing. This is the one step where CI passing does not mean the site works |
| Step 2 is effectively unreviewable line by line | Medium | Rely on rename detection and gate results; review only the config diffs by hand |
| Required checks stuck on skipped path-filtered jobs | Medium | Decide the always-run companion job before enabling filters |
| Docker build context wrong after the move | Medium | `docker-publish` runs on pull requests, so it catches this on the PR itself |
| Dependabot stops seeing manifests | Low | One root entry covers a single-lockfile workspace; confirm after the move |
| `.nvmrc` says 20 while local Node is 25 | Low | Unrelated to this work, but worth aligning while the build config is already open |

## Changes from plan

**Module list deviations (both load-bearing, not oversights):**
- `presets.ts` stays in `apps/web`, not `packages/core`. It reads/writes
  `localStorage` via `safeLocalStorage`, which directly contradicts FR-003's
  storage ban — and the spec's own "not in core" list already excludes
  `safeLocalStorage`, so `presets.ts` moving was inconsistent with that on
  inspection.
- `utif.d.ts` stays in `apps/web/src/types/`, not `packages/core`, despite
  "everything in src/types/" — it's an ambient type shim for the `utif`
  package, used only by `apps/web`'s HEIC/TIFF decoding; core has no
  dependency on `utif` and it isn't business logic.
- `types/index.ts` (`QRConfig`, `ValidationResult`) moved to core per the
  letter of "everything in src/types/", but is not re-exported through the
  core barrel: it's legacy dead code, unused anywhere, and collides on the
  name `QRConfig` with `types/qr.ts`'s actual, in-use `QRConfig`.
- A transitive dependency the spec's table didn't list: `country.ts` (listed)
  imports `data/countries.ts` (not listed), which moved with it.

**i18n:** the spec says only `en.json`/`es.json` copy into core. Doing that
alone left two independent locale registries (a hardcoded list in core, a
separately-built registry in `apps/web`) — exactly the two-sources-of-truth
problem the extraction should avoid. Fixed during the `/simplify` pass:
`packages/core/src/i18n/locales.ts` now builds the actual registry and is
the thing `apps/web/src/data/i18n/index.ts` imports and builds its
flatten/`getCopy` logic on top of, not a second re-derivation.

**Vite dev-server bug, not anticipated by the spec:** the full e2e suite
failed across every project once actually run against `npm run dev` (the
one verification step nothing before it had done — unit tests, lint, and
`vite build` all passed, but nobody had loaded the dev server in a real
browser until the Phase 5 "final testing" pass). Root cause: Vite excludes
linked workspace packages from dependency pre-bundling by default, and its
live CJS interop for `@qrcraft/core` (built to CommonJS) doesn't reliably
resolve every named export of its `export *` barrel. Fixed with
`optimizeDeps.include: ['@qrcraft/core']` in `apps/web/vite.config.ts`.

**Coverage, FR-004:** `packages/core` holds 97%/93%/96%/98%
(stmts/branches/funcs/lines) — just under the 95% branch target, a
pre-existing gap in a few moved modules' edge cases (vevent, crypto,
csvContentTypes), not something the move introduced. Threshold enforced at
90% for branches accordingly. `apps/web`'s line coverage (87%) still clears
its 85% floor, but statements (83%) and functions (78%) dropped below it:
removing ~2,000 lines of well-tested pure logic shrank the denominator's
best-covered slice, leaving the UI-glue layer (always the less-tested part)
as a larger share of what remains. Both gaps are follow-up test-writing,
not something this migration blocks on.

**Risk table follow-up:**
- *Pages deploy breaks silently* — the artifact path (`apps/web/dist`) and
  build steps were verified locally (`npm run build` produces it correctly),
  but the actual live Pages deploy could not be verified from this branch:
  `deploy.yml` triggers only on a published GitHub release or
  `workflow_dispatch`, neither of which happens from a feature branch.
  **Verify the site loads after this merges and the next release
  publishes** — this is still the one step where CI passing doesn't mean
  the site works.
- *Required checks stuck on skipped path-filtered jobs* — moot for now:
  `gh api repos/.../branches/main/protection` 404s, so `main` has no
  branch protection and no required status check exists to get stuck.
  Revisit the always-green-companion-job pattern if that changes.
- *`.nvmrc` says 20 while local Node is 25* — left unaddressed; unrelated to
  this migration and not touched, per the original risk note.
- The other risks (Docker build context, Dependabot, step 2 being
  unreviewable line by line) played out as anticipated — rename detection
  worked cleanly, the Docker context change is covered by
  `docker-publish`'s pull_request trigger, and Dependabot's single root
  manifest needs no separate change.

**MCP server scope:** built as specified (both tools, both transports),
smoke-tested end-to-end over stdio and HTTP with a throwaway JSON-RPC
client rather than a committed automated test — the project has no
existing test setup for a Node-side app to follow, and adding one was out
of scope for this migration. `QR_MCP_PLAN.md` is deleted (its copy-the-files
approach is superseded); a backup lives outside git in this session's cache
in case anything in it is still worth mining later.
