import { DEFAULT_QR_CONFIG } from '../data/defaults'
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}

/**
 * Where to place the logo on the canvas. When a frame shrinks and offsets the QR,
 * the logo follows the QR region rather than the canvas center.
 */
export interface LogoPlacement {
  /** Center x in canvas pixels. Defaults to the canvas center. */
  centerX?: number
  /** Center y in canvas pixels. Defaults to the canvas center. */
  centerY?: number
  /** Edge length the size % is taken from, in canvas pixels. Defaults to `canvasSize`. */
  baseSize?: number
  /**
   * Fill for the disc drawn behind the logo. It exists to clear QR modules, so it
   * must match the code's background or it shows as a bright plate on a tinted
   * one. Defaults to the app's default QR background.
   */
  backingColor?: string
}

/**
 * Composites a pre-loaded logo image centered on an existing canvas context.
 * Synchronous — caller must supply an already-loaded HTMLImageElement.
 */
export function compositeLoadedLogoOnCanvas(
  ctx: CanvasRenderingContext2D,
  logoImg: HTMLImageElement,
  logoSizePct: number,
  canvasSize: number,
  placement: LogoPlacement = {},
): void {
  const base = placement.baseSize ?? canvasSize
  const logoPx = Math.round(base * (logoSizePct / 100))
  const cx = placement.centerX ?? canvasSize / 2
  const cy = placement.centerY ?? canvasSize / 2
  const logoRadius = logoPx / 2
  const backingRadius = logoRadius + Math.max(4, Math.round(logoRadius * 0.1))

  ctx.save()

  ctx.fillStyle = placement.backingColor ?? DEFAULT_QR_CONFIG.bgColor
  ctx.beginPath()
  ctx.arc(cx, cy, backingRadius, 0, Math.PI * 2)
  ctx.fill()

  ctx.beginPath()
  ctx.arc(cx, cy, logoRadius, 0, Math.PI * 2)
  ctx.clip()
  ctx.drawImage(logoImg, cx - logoRadius, cy - logoRadius, logoPx, logoPx)

  ctx.restore()
}

/**
 * Composites a logo centered on an existing canvas context with a white
 * backing disc for legibility over dark QR modules.
 */
export async function compositeLogoOnCanvas(
  ctx: CanvasRenderingContext2D,
  logoDataUrl: string,
  logoSizePct: number,
  canvasSize: number,
  placement: LogoPlacement = {},
): Promise<void> {
  const logoImg = await loadImage(logoDataUrl)
  compositeLoadedLogoOnCanvas(ctx, logoImg, logoSizePct, canvasSize, placement)
}

/**
 * Rasterizes a logo to a PNG data URL at 2x the target render size.
 * Used to embed a correctly-sized logo in SVG exports without carrying
 * the full source image resolution.
 */
export async function rasterizeLogoForSvg(
  logoDataUrl: string,
  renderPx: number,
): Promise<string> {
  const scale = 2
  const size = Math.round(renderPx * scale)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  const img = await loadImage(logoDataUrl)
  ctx.drawImage(img, 0, 0, size, size)
  return canvas.toDataURL('image/png')
}
