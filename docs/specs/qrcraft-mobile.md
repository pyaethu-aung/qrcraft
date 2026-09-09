---
slug: qrcraft-mobile
title: QRCraft mobile app in React Native
status: proposed
branch: docs/monorepo-and-mobile-specs
created: 2026-09-09
---

## Summary

QRCraft ships as a native app for iOS and Android, built in React Native inside the
workspace as `apps/mobile`. It reuses the shared QR logic from `@qrcraft/core` unchanged
and rebuilds the interface natively: Apple's Human Interface Guidelines with Liquid Glass
on iOS, Material 3 on Android, both drawing colour and type from the existing QRCraft
brand. Generate, scan and save all work offline. Batch generation stays on the web.

**Depends on `monorepo-consolidation.md`.** That spec must land first: this app consumes
`@qrcraft/core`, which does not exist until then.

## Exploration

### Capacitor was built first, and rejected

A Capacitor shell was specified, built and run on a physical iPhone before this spec
existed. That work is on the `feat/capacitor-shell` branch with its own 1,569-line spec
(`specs/025-capacitor-mobile-app/spec.md`), and it got far: the app launched from bundled
assets, native adapters for saving, sharing and geolocation worked behind a
`src/platform/` boundary, and the web bundle was verified to contain zero Capacitor code.

It was abandoned for one reason: **it did not feel native.** Five specific complaints were
fixable and were fixed (tap-highlight flash, long-press callout, double-tap zoom,
overscroll rubber-banding, text selection). Two were not, and they are the reason for this
spec:

- **Scroll physics.** A WKWebView approximates iOS deceleration; it never matches it.
- **Navigation transitions.** There is no push/pop animation to have. Capacitor cannot
  provide one without a JavaScript navigation library imitating it.

Those two are structural, not tunable, and the same impression that surfaced them is what
drives an App Store guideline 4.2 rejection ("a repackaged website"). A developer noticing
it within minutes is a strong signal a reviewer would too.

### What that work leaves behind

Not wasted, and worth knowing before starting:

- The **decision record** in the Capacitor spec: store compliance, the privacy policy
  draft, bundle budgets, purpose strings, the Play 12-tester rule. All still true.
- The **platform-adapter shape** (`FileSaver`, `Sharer`, `Locator` interfaces). The
  implementations change; the seam is the right one.
- The **pure-logic separation**, which is `monorepo-consolidation.md`.
- Roughly a day and a half of Capacitor-specific scaffolding that does not carry over.

### Alternative not taken: fully native

Swift plus Kotlin would give the best possible feel and could not share a line of the
TypeScript logic. Two codebases, two languages, every payload builder written twice.
React Native keeps ~2,040 tested lines shared while still giving real native navigation
and scrolling. That trade is the whole reason for choosing it.

## Shape

### Design reference

The screens are already designed, per platform, and should be treated as the visual
contract: **https://claude.ai/code/artifact/38487c74-f77c-4edc-9774-75e8701e1520**

Nine screens each for iOS and Android, plus a platform-mapping sheet. Every colour, radius,
type size and control height is lifted from `DESIGN.md`, not re-invented.

### Screens

| Screen | Notes |
|---|---|
| Generate | Content-type chips, input, live preview, reliability, save and share |
| Structured form | One layout serving the 8 non-text content types |
| Design · basics | Colours, eye border, pixel pattern, frame |
| Design · advanced | Gradients, eye centre, eye colours, transparent background, logo |
| Scan | Camera viewfinder, torch, photo picker |
| Scan result | Decoded value, type badges, open / copy / recreate, recent scans |
| Saved | Saved designs and recent codes |
| Settings | Theme, language, defaults, privacy |
| Generate · dark | Proves the dark palette |

### Platform divergence

Structure and materials follow the platform; colour and type stay QRCraft. The app should
read as the same product on both, not as two different apps and not as one app ignoring
both platforms.

| Element | iOS 26 · Liquid Glass | Android · Material 3 |
|---|---|---|
| Frame | 393 × 852 pt | 412 × 915 dp |
| Bottom navigation | Floating glass capsule, inset 16, lifted 26 off the home indicator | Navigation bar flush to the edge, 80 dp, 64×32 pill indicator |
| Header | Large title collapsing into a glass toolbar | Large top app bar collapsing to small, tonal on scroll |
| Primary action | Prominent tinted capsule | Extended FAB, 56 dp, radius 16 |
| Selection | Segmented control in a recessed track | Segmented button with a check on the selected segment |
| Text entry | Glass field, inline label | Outlined field, 56 dp, notched floating label |
| Modal | Sheet with detents, grabber | Bottom sheet, radius 28 top, drag handle |
| Elevation | Layered translucency, no drop shadows | Tonal surface levels plus shadow |
| Shape | Concentric radii | Shape scale 4 · 8 · 12 · 16 · 28 |

This deliberately reverses **FR-031** of the Capacitor spec, which forbade platform-native
visuals. That rule existed because a WebView imitating native is the worst of both; it does
not apply to a genuinely native UI.

### Requirements

- **FR-001**: The app MUST consume `@qrcraft/core` for all payload building, QR geometry,
  capacity, contrast, gradient maths and copy. No logic is reimplemented.
- **FR-002**: Generate, design, scan and save MUST work with no network, on first launch.
  Assets ship in the binary, so this is true by construction rather than arranged.
- **FR-003**: Three tabs: Generate, Scan, Saved. Settings is reached from Saved.
- **FR-004**: **PNG is the only export.** The share sheet covers everything else, and
  omitting PDF keeps `jspdf` out of the app. Web keeps PNG, SVG and PDF.
- **FR-005**: Batch generation MUST NOT ship. A 200-code ZIP and a printable label sheet
  are a desktop workflow. The app SHOULD point at the web tool contextually rather than
  hiding the feature silently.
- **FR-006**: Scanning MUST use the platform barcode engine, not a JavaScript decoder.
- **FR-007**: Saving MUST go through the system share sheet, letting the user pick the
  destination. This needs no photo-library permission, so there is one fewer prompt to
  justify and one fewer App Privacy declaration.
- **FR-008**: Camera, photo-library and location permissions MUST be requested at first
  use, never at launch, with a recoverable explanation and a link to OS settings on denial.
- **FR-009**: Persisted state (designs, presets, history, theme, locale) MUST survive
  reinstall-free app restarts and MUST NOT be lost to storage eviction.
- **FR-010**: Credential-bearing drafts MUST NOT reach device backups. A Wi-Fi password
  and a vCard are held in plaintext by the web app's draft persistence; the mobile port
  must not copy that into an iCloud or Google backup.
- **FR-011**: The app MUST NOT be visually redesigned away from the QRCraft brand. HIG and
  Material 3 govern structure and materials; `DESIGN.md` governs colour and type.
- **FR-012**: Both platforms MUST honour safe-area insets. No status bar or keyboard may
  be drawn in the layout; the real ones render above it.
- **FR-013**: Minimum touch target 44 pt on iOS, 48 dp on Android. Where a control is
  visually smaller (the 32 dp chips), it MUST carry padded hit slop rather than growing.

### Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | Expo (managed, with config plugins) | Monorepo support, prebuild, EAS. Bare RN buys nothing here |
| Navigation | react-navigation: bottom tabs + native stack | Real native transitions, the reason for this spec |
| QR rendering | react-native-svg, from `qrShapeRenderer` path data | Core already emits paths; no second geometry implementation |
| PNG export | `react-native-view-shot`, or Skia if the SVG path proves slow | Measure before adding Skia |
| Scanning | `react-native-vision-camera` with its native code scanner | ML Kit on Android, AVFoundation on iOS |
| Storage | `react-native-mmkv` | **Synchronous**, so the web app's read-at-mount hook pattern ports unchanged. AsyncStorage would force a loading state into every persisted hook |
| Secure storage | Keychain / Keystore wrapper | FR-010. Not MMKV, which is unencrypted and backed up |
| Liquid Glass | Native module over `UIVisualEffectView` / `.glassEffect()`, or expo-glass-effect | Not in RN core. See risks |
| Testing | Jest + `@testing-library/react-native`; Maestro for flows | Core keeps Vitest |

### Out of scope

- Batch generation, in any form beyond a pointer to the web
- SVG and PDF export
- Any backend, account or cross-device sync
- Home-screen widgets, Siri Shortcuts, App Intents, quick-settings tiles
- Wi-Fi QR codes that join a network automatically on scan
- Push notifications, paid tiers, advertising
- iPad and tablet-optimised layouts beyond correct responsive behaviour
- Dynamic colour (Material You). The brand is the source colour, deliberately

## Risks

The first two are the ones that could actually derail this.

| Risk | Severity | Mitigation |
|---|---|---|
| **React version conflict in the workspace.** The web app is on React 19; Expo pins its own React. npm workspaces hoists, and unlike Yarn 1 it has **no `nohoist`**, so both apps can end up resolving one React that suits neither | **High** | Try `overrides` and `expo install --fix` first. If that fights back, **switch the workspace to pnpm**, which isolates dependencies per package by default. This is the escape hatch `monorepo-consolidation.md` records, and it is the single most likely reason to use it |
| **Metro does not understand workspaces by default.** It will not resolve `@qrcraft/core` without configuration | **High** | `metro.config.js` with `watchFolders` covering the workspace root and `resolver.nodeModulesPaths` listing both the app and root `node_modules`. Expo documents this; budget real time for it rather than assuming it works |
| **Liquid Glass is not in React Native.** It needs a native module, and must degrade below iOS 26 | Medium | Solid `surface-raised` fill as the fallback. **Do not fake glass with plain opacity**: without a real blur behind it, translucency over busy content reads as muddy, which is worse than an honest solid |
| Camera quality and battery on a real device | Medium | The platform engine replaces the JavaScript decode ladder the web app had to throttle. Verify on hardware; the simulator has no camera at all |
| Storage eviction losing saved designs | Medium | FR-009. Test by clearing app data and asserting recovery |
| Two test suites under one coverage bar | Medium | Per-package thresholds, as `monorepo-consolidation.md` FR-004 already establishes |
| Store review in a spam-heavy category | Medium | A genuinely native app is a far weaker 4.2 target than a WebView. The compliance checklist in the Capacitor spec still applies |
| Design drift between platforms | Low | The published canvas is the contract; changes go there first |

## Human prerequisites

None of these are code, and two of them are calendar time that cannot be compressed:

- **Apple Developer Program** membership. The signing team for this machine is
  `3PA965FRN2`; a certificate for `N4PCS2UNL8` exists without a matching Xcode account,
  which is what made the first device build fail.
- **Google Play developer account**, and its type confirmed. An **individual** account
  requires a closed test with **12 testers for 14 continuous days** before production
  release. Start recruiting on day one.
- **A privacy policy URL.** Mandatory on both stores even at zero data collection. A
  complete draft exists at `specs/025-capacitor-mobile-app/privacy-policy.md` on the
  `feat/capacitor-shell` branch and needs only the publisher and contact fields.
- **Physical devices.** One iPhone and one mid-range Android. Camera behaviour, permission
  prompts and safe-area rendering cannot be verified in a simulator.
- **A trademark check** on "QRCraft" in both store jurisdictions.

## Build sequence

Each step ends green. Steps 1 and 2 are the risk; do them before writing any screen.

1. `apps/mobile` scaffolded with Expo, Metro configured for the workspace, importing one
   function from `@qrcraft/core` to prove resolution end to end.
2. React version alignment settled, including the pnpm decision if npm cannot be made to
   work. **Do not proceed past this until both apps build.**
3. Navigation shell: three tabs, native stack, safe areas, per-platform theming from
   `DESIGN.md`.
4. Generate, with `qrShapeRenderer` drawing through react-native-svg. The first real proof
   the shared core is worth it.
5. The structured form, serving all eight non-text types from core's builders.
6. Design basics, then advanced.
7. Scan and scan result, with the platform barcode engine. **Physical device required.**
8. Saved, Settings, and persistence including the FR-010 carve-out.
9. Liquid Glass on iOS, with its fallback. Late on purpose: it is polish, and it is the
   least portable work in the plan.
10. Store assets, compliance declarations, privacy policy, first submission.

## Changes from plan

<!-- Filled when this ships: what diverged from the above. -->
