/**
 * Headless PNG renderer: composes the QR (+ frame, + optional logo) to an SVG, rasterizes
 * it onto a canvas, and returns a PNG blob. Shared by the single-QR download path
 * (useQRGenerator) and batch generation so both produce byte-identical output from one
 * code path. No DOM preview required.
 */

import type { QRDesignConfig, QRErrorCorrectionLevel, QRFrameConfig } from '../../types/qr'
import { composeQrSvg } from '../qrSvgComposer'
import { compositeLogoOnCanvas } from '../logoCompositor'
import { QR_SIZE_DOWNLOAD } from '../../data/defaults'

export interface PngRenderConfig {
  ecLevel: QRErrorCorrectionLevel
  fgColor: string
  bgColor: string
  designConfig: QRDesignConfig
  frameConfig?: QRFrameConfig
  logoDataUrl?: string | null
  logoSize?: number
  /** Output edge length in pixels. Defaults to the standard download size. */
  size?: number
  /** When true, the PNG is rendered with a transparent background. */
  transparentBg?: boolean
}

/**
 * Render a single QR value to a PNG blob at `size` px square.
 *
 * @throws if the value is empty or a 2D canvas context is unavailable.
 */
export async function renderQrPngBlob(value: string, config: PngRenderConfig): Promise<Blob> {
  if (!value) {
    throw new Error('Cannot render empty QR code')
  }

  const {
    ecLevel,
    fgColor,
    bgColor,
    designConfig,
    frameConfig,
    logoDataUrl,
    logoSize = 20,
    size = QR_SIZE_DOWNLOAD,
    transparentBg = false,
  } = config

  const { body, viewBox, logoCenter, logoBase } = composeQrSvg({
    value,
    ecLevel,
    fgColor,
    bgColor,
    design: designConfig,
    frame: frameConfig,
    transparentBg,
  })
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBox} ${viewBox}" width="${size}" height="${size}">${body}</svg>`

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  await new Promise<void>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size)
      resolve()
    }
    img.onerror = reject
    img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(svgString)
  })

  if (logoDataUrl) {
    const scale = size / viewBox
    await compositeLogoOnCanvas(ctx, logoDataUrl, logoSize, size, {
      centerX: logoCenter.x * scale,
      centerY: logoCenter.y * scale,
      baseSize: logoBase * scale,
      backingColor: bgColor,
    })
  }

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
  )
}
