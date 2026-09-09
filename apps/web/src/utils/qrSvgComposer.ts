/**
 * Single source of truth for the QR + frame SVG. The canvas preview, PNG download,
 * and SVG export all build their output from this, so a frame looks identical
 * everywhere it ships. Returns the SVG body (no `<svg>` wrapper, no logo) plus the
 * geometry a caller needs to place a centered logo over the QR.
 */

import type { QRDesignConfig, QRErrorCorrectionLevel, QRFrameConfig } from '../types/qr'
import { generateQRPaths, getDataShapeRendering } from './qrShapeRenderer'
import { renderFrame } from './frameRenderer'
import { buildFgGradientDefs } from './gradient'

/** Element id for the foreground gradient. Each composed SVG is standalone, so a fixed id is safe. */
const FG_GRADIENT_ID = 'qr-fg-gradient'

export interface ComposeQrOptions {
  value: string
  ecLevel: QRErrorCorrectionLevel
  fgColor: string
  bgColor: string
  design: QRDesignConfig
  frame?: QRFrameConfig
  cellSize?: number
  /** When true, the background rect is omitted and eye backgrounds use fill="none". */
  transparentBg?: boolean
}

export interface ComposedQr {
  /** SVG body: background rect, frame decoration, then the QR group. */
  body: string
  /** Square viewBox edge length in user units. */
  viewBox: number
  /** Center of the QR region in viewBox units — where a logo should sit. */
  logoCenter: { x: number; y: number }
  /** QR region edge length in viewBox units — a logo's size % is relative to this. */
  logoBase: number
}

const n = (v: number): number => Math.round(v * 1000) / 1000

export function composeQrSvg(opts: ComposeQrOptions): ComposedQr {
  const { value, ecLevel, fgColor, bgColor, design, frame, cellSize = 10, transparentBg = false } = opts

  const { dataPath, eyeFramePath, eyeCenterPath, eyeBgPath, size } = generateQRPaths(
    value,
    ecLevel,
    design.eyeFrameShape,
    design.eyeCenterShape,
    design.pixelPattern,
    cellSize,
  )
  const Q = size * cellSize
  const dataShapeRendering = getDataShapeRendering(design.pixelPattern)
  // A gradient fills the whole foreground; eye parts inherit it the same way they
  // inherit the solid color (i.e. when their own color is null).
  const gradientDefs = design.fgGradient ? buildFgGradientDefs(design.fgGradient, FG_GRADIENT_ID, Q) : ''
  const fgFill = design.fgGradient ? `url(#${FG_GRADIENT_ID})` : fgColor
  const eyeFrameFill = design.eyeFrameColor ?? fgFill
  const eyeCenterFill = design.eyeCenterColor ?? fgFill

  const eyeBgFill = transparentBg ? 'none' : bgColor
  const bgRect = (w: number) => transparentBg ? '' : `<rect width="${n(w)}" height="${n(w)}" fill="${bgColor}"/>`

  const qrGroup = (tx: number, ty: number): string => {
    const open = tx || ty ? `<g transform="translate(${n(tx)},${n(ty)})">` : '<g>'
    return (
      open +
      `<path d="${dataPath}" fill="${fgFill}" shape-rendering="${dataShapeRendering}"/>` +
      `<path d="${eyeBgPath}" fill="${eyeBgFill}"/>` +
      `<path d="${eyeFramePath}" fill="${eyeFrameFill}" fill-rule="evenodd"/>` +
      `<path d="${eyeCenterPath}" fill="${eyeCenterFill}"/>` +
      `</g>`
    )
  }

  // No frame: bare QR, byte-for-byte the same structure as before frames existed.
  if (!frame || frame.style === 'None') {
    return {
      body: gradientDefs + bgRect(Q) + qrGroup(0, 0),
      viewBox: Q,
      logoCenter: { x: Q / 2, y: Q / 2 },
      logoBase: Q,
    }
  }

  const { viewBox, qrBox, decoration } = renderFrame(frame.style, Q, frame.color, bgColor, frame.text, frame.position)
  return {
    body:
      gradientDefs +
      bgRect(viewBox) +
      decoration +
      qrGroup(qrBox.x, qrBox.y),
    viewBox,
    logoCenter: { x: qrBox.x + qrBox.size / 2, y: qrBox.y + qrBox.size / 2 },
    logoBase: qrBox.size,
  }
}
