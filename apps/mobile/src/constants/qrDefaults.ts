import type { QRDesignConfig, QRErrorCorrectionLevel } from '@qrcraft/core'

/**
 * Warm ink on warm paper, mirroring apps/web/src/data/defaults.ts exactly
 * (CLAUDE.md: QR output colors are concrete hex, not theme tokens — they're
 * baked into the exported PNG and must stay identical in both UI themes).
 * Not shared via @qrcraft/core: each app owns its own app-level default,
 * same as apps/web does.
 */
export const DEFAULT_QR_FG_COLOR = '#1A1612'
export const DEFAULT_QR_BG_COLOR = '#FAF6F1'
export const DEFAULT_QR_EC_LEVEL: QRErrorCorrectionLevel = 'M'

export const QR_INPUT_LENGTH_LIMIT = 2000

// A fixed preset palette for the Design sheet's color pickers. RN has no
// native color-input equivalent to web's <input type="color">; a full
// custom HSV picker is out of scope for this pass, so color choice is a
// tap-to-select swatch grid drawn from the brand palette (DESIGN.md) plus
// a few neutrals. Revisit if free-form hex entry is ever requested.
export const PRESET_COLORS = [
  '#1A1612',
  '#1C1A17',
  '#605A52',
  '#FAF6F1',
  '#F3EBE2',
  '#FFFFFF',
  '#A04D28',
  '#7C4A18',
  '#D4A850',
  '#2F5233',
  '#274472',
  '#7A3B69',
] as const;

// Matches apps/web's default everywhere (shareConfig.ts, svgExporter.ts,
// QRPreview.tsx) — plain squares, no per-eye color override, no gradient.
// Custom shapes/colors are Design basics/advanced (build sequence step 6).
export const DEFAULT_QR_DESIGN_CONFIG: QRDesignConfig = {
  eyeFrameShape: 'Square',
  eyeCenterShape: 'Square',
  eyeFrameColor: null,
  eyeCenterColor: null,
  pixelPattern: 'Square',
  fgGradient: null,
}
