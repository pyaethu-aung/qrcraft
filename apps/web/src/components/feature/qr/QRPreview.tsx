import { useRef, useCallback, forwardRef, useEffect, useLayoutEffect } from 'react'

import { useLocaleContext } from '../../../hooks/LocaleProvider'
import { composeQrSvg } from '../../../utils/qrSvgComposer'
import { compositeLoadedLogoOnCanvas } from '../../../utils/logoCompositor'
import { DEFAULT_QR_CONFIG } from '../../../data/defaults'
import type { QRConfig, QRDesignConfig, QRFrameConfig } from '../../../types/qr'

export interface QRPreviewProps extends QRConfig {
  designConfig?: QRDesignConfig
  frameConfig?: QRFrameConfig
  className?: string
  style?: React.CSSProperties
  logoDataUrl?: string | null
  logoSize?: number
  isPending?: boolean
  /** Why the QR is absent, when the active form knows (e.g. a missing required
   *  field). Replaces the generic placeholder copy so the empty state explains
   *  itself instead of leaving a wordless dashed box. */
  placeholderHint?: string
}

export const QRPreview = forwardRef<HTMLCanvasElement, QRPreviewProps>(
  ({ value, ecLevel, fgColor, bgColor, size = 220, designConfig = { eyeFrameShape: 'Square', eyeCenterShape: 'Square', eyeFrameColor: null, eyeCenterColor: null, pixelPattern: 'Square', fgGradient: null }, frameConfig, className, style, logoDataUrl, logoSize, isPending, placeholderHint }, forwardedRef) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const canFlashRef = useRef(false)
    // Cached layers — updated by their respective effects
    const baseImageRef = useRef<HTMLImageElement | null>(null)
    const logoImageRef = useRef<HTMLImageElement | null>(null)
    // Separate stale-render guards so QR base and logo loads don't cancel each other
    const baseGenRef = useRef(0)
    const logoGenRef = useRef(0)
    // Ref-shadowed props so drawFrame stays stable (no deps)
    const sizeRef = useRef(size)
    sizeRef.current = size
    const logoSizeRef = useRef(logoSize)
    logoSizeRef.current = logoSize
    const bgColorRef = useRef(bgColor)
    bgColorRef.current = bgColor
    // Logo placement as viewBox ratios (0..1), updated whenever the QR base regenerates.
    // A frame offsets and shrinks the QR, so the logo follows the QR region, not the canvas.
    const logoPlacementRef = useRef({ cx: 0.5, cy: 0.5, base: 1 })

    const { translate } = useLocaleContext()

    const ariaPlaceholder = translate('preview.ariaPlaceholder')
    const ariaValueTemplate = translate('preview.ariaValue')
    const placeholderCopy = translate('preview.placeholder')

    const assignForwardedRef = useCallback(
      (node: HTMLCanvasElement | null) => {
        if (typeof forwardedRef === 'function') {
          forwardedRef(node)
        } else if (forwardedRef && typeof forwardedRef === 'object') {
          ;(forwardedRef as { current: HTMLCanvasElement | null }).current = node
        }
      },
      [forwardedRef],
    )

    // Synchronous composite from cached images. Stable — reads all state from refs.
    const drawFrame = useCallback(() => {
      const canvas = canvasRef.current
      const base = baseImageRef.current
      if (!canvas || !base) return
      const dpr = window.devicePixelRatio || 1
      const physicalSize = Math.round(sizeRef.current * dpr)
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, physicalSize, physicalSize)
      ctx.drawImage(base, 0, 0, physicalSize, physicalSize)
      const logoImg = logoImageRef.current
      const ls = logoSizeRef.current
      if (logoImg && ls) {
        const p = logoPlacementRef.current
        compositeLoadedLogoOnCanvas(ctx, logoImg, ls, physicalSize, {
          centerX: p.cx * physicalSize,
          centerY: p.cy * physicalSize,
          baseSize: p.base * physicalSize,
          backingColor: bgColorRef.current,
        })
      }
    }, [])

    // Reset flash gate when QR disappears so re-entry replays the enter animation
    useEffect(() => {
      if (!value) canFlashRef.current = false
    }, [value])

    // Set canvas pixel dimensions before paint to avoid a blank first frame.
    // CSS display sizing is handled by Tailwind (w-full + aspect-square on the element)
    // so only the buffer dimensions are set here.
    useLayoutEffect(() => {
      const canvas = canvasRef.current
      if (!canvas || !value) return
      const dpr = window.devicePixelRatio || 1
      const physicalSize = Math.round(size * dpr)
      canvas.width = physicalSize
      canvas.height = physicalSize
    }, [size, value])

    // Effect 1 (heavy): Regenerate QR base when QR content or appearance changes
    useEffect(() => {
      if (!value) {
        baseImageRef.current = null
        return
      }
      // Trigger update animation before generating — canvas draw happens mid-animation
      if (canFlashRef.current) {
        const canvas = canvasRef.current
        if (canvas) {
          canvas.classList.remove('qr-update')
          void canvas.offsetWidth
          canvas.classList.add('qr-update')
        }
      }
      const gen = ++baseGenRef.current
      const dpr = window.devicePixelRatio || 1
      const physicalSize = Math.round(size * dpr)
      const { body, viewBox, logoCenter, logoBase } = composeQrSvg({
        value,
        ecLevel,
        fgColor,
        bgColor,
        design: designConfig,
        frame: frameConfig,
      })
      logoPlacementRef.current = {
        cx: logoCenter.x / viewBox,
        cy: logoCenter.y / viewBox,
        base: logoBase / viewBox,
      }
      const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBox} ${viewBox}" width="${physicalSize}" height="${physicalSize}">${body}</svg>`
      const img = new Image()
      img.onload = () => {
        if (gen !== baseGenRef.current) return
        baseImageRef.current = img
        drawFrame()
      }
      img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(svgString)
    }, [value, ecLevel, fgColor, bgColor, designConfig, frameConfig, size, drawFrame])

    // Effect 2 (medium): Load/cache logo image when the data URL changes
    useEffect(() => {
      if (!logoDataUrl) {
        logoImageRef.current = null
        drawFrame()
        return
      }
      const gen = ++logoGenRef.current
      const img = new Image()
      img.onload = () => {
        if (gen !== logoGenRef.current) return
        logoImageRef.current = img
        drawFrame()
      }
      img.onerror = () => {
        if (gen !== logoGenRef.current) return
        logoImageRef.current = null
        drawFrame()
      }
      img.src = logoDataUrl
    }, [logoDataUrl, drawFrame])

    // Effect 3 (fast): Synchronous redraw when only logoSize changes — hot path during slider drag
    useEffect(() => {
      drawFrame()
    }, [logoSize, drawFrame])

    const formatValueLabel = (label: string, data: Record<string, string>) =>
      label.replace(/\{(\w+)\}/g, (_, key) => {
        const token = key as keyof Record<string, string>
        return data[token] ?? ''
      })

    return (
      <div className={`flex flex-col gap-4 ${className ?? ''}`} style={style}>
        {/* Tall inset preview box */}
        <div className="flex items-center justify-center min-h-[220px] md:h-[536px] rounded-lg border border-border-subtle bg-surface-inset">
          {!value ? (
            <div
              className="flex items-center justify-center w-full bg-surface-inset text-text-secondary rounded-lg border-2 border-dashed border-border-subtle aspect-square"
              style={{ maxWidth: size }}
              role="img"
              aria-label={placeholderHint ?? ariaPlaceholder}
            >
              {isPending ? (
                <span className="h-5 w-5 motion-safe:animate-spin rounded-full border-2 border-border-strong border-t-text-secondary" aria-hidden />
              ) : placeholderHint ? (
                <span className="px-6 text-center text-sm text-text-secondary">{placeholderHint}</span>
              ) : (
                <span className="text-sm">{placeholderCopy}</span>
              )}
            </div>
          ) : (
            <div
              ref={wrapperRef}
              className="qr-enter w-full rounded-lg p-4 overflow-hidden"
              style={{ backgroundColor: bgColor ?? DEFAULT_QR_CONFIG.bgColor, maxWidth: size + 32 }}
              onAnimationEnd={(e) => {
                if (e.animationName === 'qr-enter') canFlashRef.current = true
              }}
            >
              <canvas
                ref={(node) => {
                  canvasRef.current = node
                  assignForwardedRef(node)
                }}
                className="w-full aspect-square block"
                data-testid="qr-code-canvas"
                data-value={value}
                data-fg={fgColor}
                data-bg={bgColor}
                role="img"
                aria-label={formatValueLabel(ariaValueTemplate, { value })}
              />
            </div>
          )}
        </div>

      </div>
    )
  },
)

QRPreview.displayName = 'QRPreview'
