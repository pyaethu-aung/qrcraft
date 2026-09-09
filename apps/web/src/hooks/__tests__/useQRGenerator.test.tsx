import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { INPUT_LENGTH_LIMIT, useQRGenerator } from '../useQRGenerator'
import * as downloadUtils from '../../utils/download'
import * as qrShapeRenderer from '../../utils/qrShapeRenderer'
import * as svgExporter from '../../utils/export/svgExporter'
import type { QRDesignConfig } from '../../types/qr'

const DEFAULT_DESIGN_CONFIG: QRDesignConfig = {
  eyeFrameShape: 'Square',
  eyeCenterShape: 'Square',
  eyeFrameColor: null,
  eyeCenterColor: null,
  pixelPattern: 'Square',
}

const MOCK_PATHS = {
  dataPath: 'M0,0',
  eyeFramePath: 'M0,0',
  eyeCenterPath: 'M0,0',
  eyeBgPath: 'M0,0',
  size: 21,
}

vi.spyOn(downloadUtils, 'downloadBlob').mockImplementation(() => {})

vi.spyOn(qrShapeRenderer, 'generateQRPaths').mockReturnValue(MOCK_PATHS)

vi.spyOn(svgExporter, 'exportSvg').mockResolvedValue(
  new Blob(['<svg/>'], { type: 'image/svg+xml' }),
)

// Stub canvas and Image so the PNG render path completes in jsdom
const fakeBlob = new Blob(['fake-png'], { type: 'image/png' })
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  clearRect: vi.fn(),
  drawImage: vi.fn(),
})
HTMLCanvasElement.prototype.toBlob = vi.fn().mockImplementation((cb: BlobCallback) => cb(fakeBlob))

class FakeImage {
  onload: (() => void) | null = null
  onerror: ((e: unknown) => void) | null = null
  set src(_: string) {
    setTimeout(() => this.onload?.(), 0)
  }
}
vi.stubGlobal('Image', FakeImage)

describe('useQRGenerator', () => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.spyOn(downloadUtils, 'downloadBlob').mockImplementation(() => {})
    vi.spyOn(qrShapeRenderer, 'generateQRPaths').mockReturnValue(MOCK_PATHS)
    vi.spyOn(svgExporter, 'exportSvg').mockResolvedValue(
      new Blob(['<svg/>'], { type: 'image/svg+xml' }),
    )
    HTMLCanvasElement.prototype.toBlob = vi.fn().mockImplementation((cb: BlobCallback) => cb(fakeBlob))
  })

  afterEach(() => {
    vi.useRealTimers()
    consoleErrorSpy.mockClear()
  })

  it('should initialize with empty input and empty live value', () => {
    const { result } = renderHook(() => useQRGenerator())

    expect(result.current.inputValue).toBe('')
    expect(result.current.liveValue).toBe('')
  })

  it('should update liveValue after the 300ms debounce delay', () => {
    const { result } = renderHook(() => useQRGenerator())

    act(() => {
      result.current.setInputValue('test-value')
    })

    expect(result.current.inputValue).toBe('test-value')
    expect(result.current.liveValue).toBe('')

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current.liveValue).toBe('test-value')
  })

  it('should not update liveValue before the debounce delay', () => {
    const { result } = renderHook(() => useQRGenerator())

    act(() => {
      result.current.setInputValue('test-value')
    })

    act(() => {
      vi.advanceTimersByTime(299)
    })

    expect(result.current.liveValue).toBe('')
  })

  it('should surface validation errors for inputs that exceed the limit', () => {
    const { result } = renderHook(() => useQRGenerator())
    const longValue = 'a'.repeat(INPUT_LENGTH_LIMIT + 1)

    act(() => {
      result.current.setInputValue(longValue)
    })

    expect(result.current.inputError).toBe(`Input too long (max ${INPUT_LENGTH_LIMIT} characters)`)
    expect(result.current.canDownload).toBe(false)
  })

  it('should not update liveValue when validation fails', () => {
    const { result } = renderHook(() => useQRGenerator())
    const longValue = 'a'.repeat(INPUT_LENGTH_LIMIT + 1)

    act(() => {
      result.current.setInputValue(longValue)
    })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current.liveValue).toBe('')
  })

  it('blocks generation when content exceeds the capacity for the level', () => {
    const { result } = renderHook(() => useQRGenerator())
    // Highest reliability has the smallest capacity (1273 bytes); 1300 characters
    // is over it but under the 2000-character input limit, so there is no length
    // error — only the capacity guard should stop generation.
    act(() => {
      result.current.setInputEcLevel('H')
      result.current.setInputValue('a'.repeat(1300))
    })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current.inputError).toBeUndefined()
    expect(result.current.canDownload).toBe(false)
    expect(result.current.liveValue).toBe('')
  })

  it('allows generation again once the level has room for the content', () => {
    const { result } = renderHook(() => useQRGenerator())
    act(() => {
      result.current.setInputEcLevel('H')
      result.current.setInputValue('a'.repeat(1300))
    })

    // Lowering reliability to Low (2953 bytes) lifts the limit above the content.
    act(() => {
      result.current.setInputEcLevel('L')
    })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current.canDownload).toBe(true)
    expect(result.current.liveValue).toBe('a'.repeat(1300))
  })

  it('should generate PNG download with custom design config', async () => {
    const { result } = renderHook(() => useQRGenerator())

    act(() => {
      result.current.setInputValue('test-qr')
    })

    // FakeImage fires img.onload via setTimeout(0) — advance timers while awaiting
    await act(async () => {
      const p = result.current.downloadPng(DEFAULT_DESIGN_CONFIG)
      vi.runAllTimers()
      await p
    })

    expect(qrShapeRenderer.generateQRPaths).toHaveBeenCalledWith(
      'test-qr',
      expect.any(String),
      DEFAULT_DESIGN_CONFIG.eyeFrameShape,
      DEFAULT_DESIGN_CONFIG.eyeCenterShape,
      DEFAULT_DESIGN_CONFIG.pixelPattern,
      expect.any(Number),
    )
    expect(downloadUtils.downloadBlob).toHaveBeenCalled()
  })

  it('should generate SVG download with custom design config', async () => {
    const { result } = renderHook(() => useQRGenerator())

    act(() => {
      result.current.setInputValue('test-qr')
    })

    await act(async () => {
      await result.current.downloadSvg(DEFAULT_DESIGN_CONFIG)
    })

    expect(svgExporter.exportSvg).toHaveBeenCalledWith(
      'test-qr',
      expect.objectContaining({ designConfig: DEFAULT_DESIGN_CONFIG }),
    )
    expect(downloadUtils.downloadBlob).toHaveBeenCalled()
  })

  it('should not download if no value is set', async () => {
    const { result } = renderHook(() => useQRGenerator())

    await act(async () => {
      const p1 = result.current.downloadPng(DEFAULT_DESIGN_CONFIG)
      const p2 = result.current.downloadSvg(DEFAULT_DESIGN_CONFIG)
      vi.runAllTimers()
      await Promise.all([p1, p2])
    })

    expect(qrShapeRenderer.generateQRPaths).not.toHaveBeenCalled()
    expect(svgExporter.exportSvg).not.toHaveBeenCalled()
  })

  it('should handle PNG download errors gracefully', async () => {
    const { result } = renderHook(() => useQRGenerator())

    vi.spyOn(qrShapeRenderer, 'generateQRPaths').mockImplementation(() => {
      throw new Error('Generation failed')
    })

    act(() => {
      result.current.setInputValue('fail')
    })

    await act(async () => {
      await result.current.downloadPng(DEFAULT_DESIGN_CONFIG)
    })

    expect(consoleErrorSpy).toHaveBeenCalled()
  })
})
