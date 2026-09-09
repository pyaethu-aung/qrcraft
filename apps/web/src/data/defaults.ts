import type { QRConfig } from '../types/qr'

/**
 * Warm ink on warm paper, not pure black on pure white. PRODUCT.md's first
 * design principle is "The result is the product", and the artifact the user
 * walks away with was the one surface the design system never touched: a
 * visitor who customized nothing left with a code indistinguishable from any
 * free generator's.
 *
 * These are the `text-primary` (dark) and `surface-raised` (light) values as
 * concrete hex, not tokens: QR colors are baked into the exported PNG/SVG,
 * which cannot read CSS vars, and must stay identical in both UI themes.
 *
 * 16.72:1, so scan reliability is untouched (the app warns below 3:1).
 */
export const DEFAULT_QR_CONFIG: QRConfig = {
  value: '',
  ecLevel: 'M',
  fgColor: '#1A1612',
  bgColor: '#FAF6F1',
}

export const QR_SIZE_DOWNLOAD = 1024

/**
 * Default frame accent color (terracotta `--color-action`). A concrete hex, not a
 * token: frame color is baked into the exported PNG/SVG, which can't read CSS vars,
 * and stays theme-independent so a download looks the same in light and dark UI.
 */
export const DEFAULT_FRAME_COLOR = '#A04D28'
