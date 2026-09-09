import { describe, it, expect, vi, beforeEach } from 'vitest'
import { compositeLogoOnCanvas, rasterizeLogoForSvg } from '../logoCompositor'

class FakeImage {
  onload: (() => void) | null = null
  onerror: ((e: unknown) => void) | null = null
  naturalWidth = 100
  naturalHeight = 100
  set src(_: string) {
    setTimeout(() => this.onload?.(), 0)
  }
}

vi.stubGlobal('Image', FakeImage)

const makeMockCtx = () => ({
  save: vi.fn(),
  restore: vi.fn(),
  fillStyle: '',
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  clip: vi.fn(),
  drawImage: vi.fn(),
})

let mockGetContext: ReturnType<typeof vi.fn>

describe('logoCompositor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetContext = vi.fn().mockReturnValue(makeMockCtx())
    HTMLCanvasElement.prototype.getContext = mockGetContext as unknown as typeof HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,rasterized')
  })

  describe('compositeLogoOnCanvas', () => {
    it('draws white backing disc and clipped logo', async () => {
      const mockCtx = makeMockCtx()
      await compositeLogoOnCanvas(
        mockCtx as unknown as CanvasRenderingContext2D,
        'data:image/png;base64,logo',
        20,
        1024,
      )

      expect(mockCtx.save).toHaveBeenCalled()
      expect(mockCtx.arc).toHaveBeenCalledTimes(2)
      expect(mockCtx.fill).toHaveBeenCalled()
      expect(mockCtx.clip).toHaveBeenCalled()
      expect(mockCtx.drawImage).toHaveBeenCalled()
      expect(mockCtx.restore).toHaveBeenCalled()
    })

    it('centers logo at canvas midpoint', async () => {
      const mockCtx = makeMockCtx()
      const canvasSize = 1000
      await compositeLogoOnCanvas(
        mockCtx as unknown as CanvasRenderingContext2D,
        'data:image/png;base64,logo',
        20,
        canvasSize,
      )

      const cx = canvasSize / 2
      const cy = canvasSize / 2
      expect(mockCtx.arc).toHaveBeenCalledWith(cx, cy, expect.any(Number), 0, Math.PI * 2)
    })

    it('backing radius is larger than logo radius', async () => {
      const mockCtx = makeMockCtx()
      await compositeLogoOnCanvas(
        mockCtx as unknown as CanvasRenderingContext2D,
        'data:image/png;base64,logo',
        20,
        500,
      )

      const arcCalls = mockCtx.arc.mock.calls
      const radii = arcCalls.map((call) => call[2] as number)
      expect(Math.max(...radii)).toBeGreaterThan(Math.min(...radii))
    })
  })

  describe('rasterizeLogoForSvg', () => {
    it('returns a PNG data URL', async () => {
      const result = await rasterizeLogoForSvg('data:image/png;base64,logo', 100)
      expect(result).toBe('data:image/png;base64,rasterized')
    })

    it('creates canvas at 2x render size', async () => {
      const renderPx = 80
      await rasterizeLogoForSvg('data:image/png;base64,logo', renderPx)

      expect(mockGetContext).toHaveBeenCalledWith('2d')
    })

    it('rejects if canvas context is unavailable', async () => {
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
      await expect(rasterizeLogoForSvg('data:image/png;base64,logo', 100)).rejects.toThrow(
        'Canvas 2D context unavailable',
      )
    })
  })
})
