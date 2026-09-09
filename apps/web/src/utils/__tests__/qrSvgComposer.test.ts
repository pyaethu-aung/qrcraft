import { describe, it, expect } from 'vitest'
import { composeQrSvg } from '../qrSvgComposer'
import type { QRDesignConfig, QRFrameConfig } from '../../types/qr'

const design: QRDesignConfig = {
  eyeFrameShape: 'Square',
  eyeCenterShape: 'Square',
  eyeFrameColor: null,
  eyeCenterColor: null,
  pixelPattern: 'Square',
}

const base = {
  value: 'https://example.com',
  ecLevel: 'M' as const,
  fgColor: '#000000',
  bgColor: '#FFFFFF',
  design,
}

const frame: QRFrameConfig = { style: 'Banner', text: 'SCAN ME', color: '#A04D28', position: 'bottom' }

describe('composeQrSvg', () => {
  it('renders the bare QR for no frame, centered with a square viewBox', () => {
    const result = composeQrSvg(base)
    // viewBox is the QR matrix size times the cell size.
    expect(result.viewBox % 10).toBe(0)
    expect(result.logoCenter).toEqual({ x: result.viewBox / 2, y: result.viewBox / 2 })
    expect(result.logoBase).toBe(result.viewBox)
    expect(result.body).toContain('<rect')
    // bg rect + data + eyeBg + eyeFrame + eyeCenter
    expect(result.body.split('<path').length - 1).toBe(4)
    // No frame accent.
    expect(result.body).not.toContain('#A04D28')
  })

  it('treats explicit "None" the same as no frame', () => {
    const none = composeQrSvg({ ...base, frame: { ...frame, style: 'None' } })
    const bare = composeQrSvg(base)
    expect(none.viewBox).toBe(bare.viewBox)
    expect(none.body).toBe(bare.body)
  })

  it('grows the canvas and paints the frame when a style is set', () => {
    const bare = composeQrSvg(base)
    const framed = composeQrSvg({ ...base, frame })
    expect(framed.viewBox).toBeGreaterThan(bare.viewBox)
    expect(framed.body).toContain('#A04D28')
    // QR group is translated into place.
    expect(framed.body).toContain('transform="translate(')
  })

  it('centers the logo on the QR region, not the whole canvas', () => {
    const framed = composeQrSvg({ ...base, frame })
    // The logo base is the QR size, smaller than the framed canvas.
    expect(framed.logoBase).toBeLessThan(framed.viewBox)
    // And its center sits above the canvas center for a bottom caption.
    expect(framed.logoCenter.y).toBeLessThan(framed.viewBox / 2)
  })

  it('produces different geometry for different frame styles', () => {
    const banner = composeQrSvg({ ...base, frame: { ...frame, style: 'Banner' } })
    const card = composeQrSvg({ ...base, frame: { ...frame, style: 'Card' } })
    expect(banner.viewBox).not.toBe(card.viewBox)
  })

  describe('foreground gradient', () => {
    const gradientDesign: QRDesignConfig = {
      ...design,
      fgGradient: { type: 'linear', from: '#FF0000', to: '#0000FF', direction: 'to-br' },
    }

    it('emits no gradient defs and a solid fill when fgGradient is null', () => {
      const result = composeQrSvg(base)
      expect(result.body).not.toContain('<defs>')
      expect(result.body).toContain('fill="#000000"')
    })

    it('emits a gradient def and fills the data path with the gradient url', () => {
      const result = composeQrSvg({ ...base, design: gradientDesign })
      expect(result.body).toContain('<linearGradient id="qr-fg-gradient"')
      expect(result.body).toContain('fill="url(#qr-fg-gradient)"')
      // With every inherited foreground part using the gradient, the solid color is gone.
      expect(result.body).not.toContain('fill="#000000"')
    })

    it('lets inherited eyes use the gradient but keeps explicit eye colors solid', () => {
      const result = composeQrSvg({
        ...base,
        design: { ...gradientDesign, eyeCenterColor: '#00AA00' },
      })
      expect(result.body).toContain('fill="url(#qr-fg-gradient)"')
      expect(result.body).toContain('fill="#00AA00"')
    })

    it('includes the gradient def alongside a translated QR group when framed', () => {
      const result = composeQrSvg({ ...base, design: gradientDesign, frame })
      expect(result.body).toContain('<linearGradient id="qr-fg-gradient"')
      expect(result.body).toContain('fill="url(#qr-fg-gradient)"')
      expect(result.body).toContain('transform="translate(')
    })

    it('supports a radial gradient', () => {
      const result = composeQrSvg({
        ...base,
        design: { ...gradientDesign, fgGradient: { type: 'radial', from: '#FFFFFF', to: '#000000', direction: 'to-br' } },
      })
      expect(result.body).toContain('<radialGradient id="qr-fg-gradient"')
      expect(result.body).toContain('fill="url(#qr-fg-gradient)"')
    })
  })
})
