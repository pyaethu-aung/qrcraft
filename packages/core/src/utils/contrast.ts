/**
 * Color contrast helpers shared by the controls (warnings) and the frame renderer
 * (auto-contrasting caption text). Operates on `#rrggbb` hex strings.
 */

const INK = '#1C1A17' // Inkwell — primary text token
const PAPER = '#FFFFFF' // action-fg token

function channelToLinear(c: number): number {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

/** WCAG relative luminance, or `null` when the hex can't be parsed. */
export function relativeLuminance(hex: string): number | null {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)
  if (!m) return null
  return (
    0.2126 * channelToLinear(parseInt(m[1], 16)) +
    0.7152 * channelToLinear(parseInt(m[2], 16)) +
    0.0722 * channelToLinear(parseInt(m[3], 16))
  )
}

/** WCAG contrast ratio between two hex colors, or `null` if either is unparseable. */
export function wcagContrastRatio(hex1: string, hex2: string): number | null {
  const l1 = relativeLuminance(hex1)
  const l2 = relativeLuminance(hex2)
  if (l1 === null || l2 === null) return null
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Returns the ink or paper color that reads most legibly on top of `bgHex`.
 * Falls back to ink for unparseable input.
 */
export function readableTextColor(bgHex: string): string {
  const lum = relativeLuminance(bgHex)
  if (lum === null) return INK
  // Contrast against white vs. ink; pick the higher.
  const onPaper = wcagContrastRatio(bgHex, PAPER) ?? 0
  const onInk = wcagContrastRatio(bgHex, INK) ?? 0
  return onPaper >= onInk ? PAPER : INK
}
