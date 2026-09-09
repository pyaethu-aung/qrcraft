import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { QRDesignConfig } from '../../../types/qr'

vi.mock('../../qrSvgComposer', () => ({
  composeQrSvg: vi.fn(() => ({
    body: '<g/>',
    viewBox: 210,
    logoCenter: { x: 105, y: 105 },
    logoBase: 210,
  })),
}))
vi.mock('../../logoCompositor', () => ({
  compositeLogoOnCanvas: vi.fn(() => Promise.resolve()),
}))

import { renderQrPngBlob } from '../pngRenderer'
import { compositeLogoOnCanvas } from '../../logoCompositor'

const DESIGN: QRDesignConfig = {
  eyeFrameShape: 'Square',
  eyeCenterShape: 'Square',
  eyeFrameColor: null,
  eyeCenterColor: null,
  pixelPattern: 'Square',
  fgGradient: null,
}

const fakeBlob = new Blob(['png'], { type: 'image/png' })

beforeEach(() => {
  vi.clearAllMocks()
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({ drawImage: vi.fn() })
  HTMLCanvasElement.prototype.toBlob = vi
    .fn()
    .mockImplementation((cb: BlobCallback) => cb(fakeBlob))
})

class FakeImage {
  onload: (() => void) | null = null
  onerror: ((e: unknown) => void) | null = null
  set src(_: string) {
    setTimeout(() => this.onload?.(), 0)
  }
}
vi.stubGlobal('Image', FakeImage)

const baseConfig = { ecLevel: 'M' as const, fgColor: '#000000', bgColor: '#ffffff', designConfig: DESIGN }

describe('renderQrPngBlob', () => {
  it('throws on an empty value', async () => {
    await expect(renderQrPngBlob('', baseConfig)).rejects.toThrow()
  })

  it('returns a PNG blob for a valid value', async () => {
    const blob = await renderQrPngBlob('hello', baseConfig)
    expect(blob).toBe(fakeBlob)
  })

  it('does not composite a logo when none is supplied', async () => {
    await renderQrPngBlob('hello', baseConfig)
    expect(compositeLogoOnCanvas).not.toHaveBeenCalled()
  })

  it('composites a logo when a data URL is supplied', async () => {
    await renderQrPngBlob('hello', { ...baseConfig, logoDataUrl: 'data:image/png;base64,AAAA' })
    expect(compositeLogoOnCanvas).toHaveBeenCalledTimes(1)
  })

  it('passes transparentBg to the SVG composer', async () => {
    const { composeQrSvg } = await import('../../qrSvgComposer')
    await renderQrPngBlob('hello', { ...baseConfig, transparentBg: true })
    expect(composeQrSvg).toHaveBeenCalledWith(expect.objectContaining({ transparentBg: true }))
  })
})
