# QRCraft mobile: design sources

The visual contract for [`../qrcraft-mobile.md`](../qrcraft-mobile.md). Nine screens
each for iOS and Android, plus a platform-mapping sheet.

Published canvas: **https://claude.ai/code/artifact/38487c74-f77c-4edc-9774-75e8701e1520**

## What is here

| File | Page |
|---|---|
| `Main.dc.html` | iOS Generate (the canvas entry artboard) |
| `IosForm`, `IosDesignSheet`, `IosDesignAdvanced`, `IosGenerateDark` | iOS |
| `IosScan`, `IosScanResult`, `IosSaved`, `IosSettings` | iOS |
| `AndroidGenerate`, `AndroidForm`, `AndroidDesignSheet`, `AndroidDesignAdvanced` | Android |
| `AndroidGenerateDark`, `AndroidScan`, `AndroidScanResult`, `AndroidSaved`, `AndroidSettings` | Android |
| `Platforms.dc.html` | Platform contract: element mapping, tonal palette, traps |
| `canvas.json` | Layout, pages, annotations, launch view |

Each `.dc.html` is one artboard. `canvas.json` positions them and defines the three
pages (iOS, Android, contract).

## Regenerating the canvas

The published page is **build output and is not committed**: it is ~2.8 MB because the
canvas editor is baked into it. These sources plus `canvas.json` reproduce it exactly.
From the repository root, with the `/design` skill available:

```bash
node "<design skill dir>/seed-canvas.mjs" \
  --template "<design skill dir>/payload.template.html" \
  --out qrcraft-react-native.html \
  --title "QRCraft for React Native" \
  --artboard docs/specs/qrcraft-mobile-design/Main.dc.html \
  ... one --artboard per file above ... \
  --canvas docs/specs/qrcraft-mobile-design/canvas.json
```

Then publish it to the existing artifact URL rather than creating a new one.

## Conventions worth preserving

- **Colour and type come from `DESIGN.md`.** Structure and materials follow the
  platform (HIG and Liquid Glass on iOS, Material 3 on Android); the brand does not
  bend to either.
- **No status bars or keyboards are drawn.** The real ones render above the layout;
  reserve insets with `useSafeAreaInsets()` rather than painting a fake.
- **Icons are inline SVG**, stroke-based on a 24px grid. No emoji.
- **The QR in `Main.dc.html` is real**, generated from the project's own `qrcode`
  dependency at 29 modules, not a drawn approximation.
- Liquid Glass is approximated with `backdrop-filter`. That reads correctly here but
  is not how it ships: see the risk table in the spec.
