import type { QRGradient, QRGradientDirection } from '../types/qr'

/**
 * Unit vectors in SVG coordinates (y grows downward), each pointing toward the named
 * edge or corner. The gradient line runs through the center along this vector, so the
 * `to` color lands on the named side.
 */
const DIRECTION_VECTORS: Record<QRGradientDirection, readonly [number, number]> = {
  'to-t': [0, -1],
  'to-tr': [0.7071, -0.7071],
  'to-r': [1, 0],
  'to-br': [0.7071, 0.7071],
  'to-b': [0, 1],
  'to-bl': [-0.7071, 0.7071],
  'to-l': [-1, 0],
  'to-tl': [-0.7071, -0.7071],
}

const round = (v: number): number => Math.round(v * 1000) / 1000

/**
 * Builds the `<defs>` block for a foreground gradient spanning the QR box (0..size in
 * user units). `gradientUnits="userSpaceOnUse"` is deliberate: it keeps one continuous
 * gradient across the separate data and eye paths instead of restarting inside each
 * path's own bounding box, so the foreground reads as a single field. Because the
 * referencing paths sit in the QR group's local coordinate system, the 0..size span
 * maps to the QR itself even when a frame translates the group.
 */
export function buildFgGradientDefs(gradient: QRGradient, id: string, size: number): string {
  const stops =
    `<stop offset="0" stop-color="${gradient.from}"/>` +
    `<stop offset="1" stop-color="${gradient.to}"/>`

  if (gradient.type === 'radial') {
    const c = round(size / 2)
    // Reach the corners (half-diagonal ≈ size * 0.7071) so the end color isn't clipped.
    const r = round(size * 0.7071)
    return `<defs><radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${c}" cy="${c}" r="${r}">${stops}</radialGradient></defs>`
  }

  const [dx, dy] = DIRECTION_VECTORS[gradient.direction]
  const half = size / 2
  const x1 = round(half - dx * half)
  const y1 = round(half - dy * half)
  const x2 = round(half + dx * half)
  const y2 = round(half + dy * half)
  return `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops}</linearGradient></defs>`
}
