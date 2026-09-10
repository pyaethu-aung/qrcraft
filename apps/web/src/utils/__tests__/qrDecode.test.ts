import { describe, it, expect, afterEach } from 'vitest'
import {
  getDecodeEdges,
  isBarcodeDetectorSupported,
  decodeWithBarcodeDetector,
} from '../qrDecode'

// decodeImageData itself is tested in packages/core (it has no DOM dependency
// and is re-exported here unchanged) — see packages/core/src/utils/qrDecode.test.ts.

describe('getDecodeEdges', () => {
  it('fans a large photo out across descending scales', () => {
    expect(getDecodeEdges(4032)).toEqual([2560, 1600, 1280, 1024, 800, 640, 512, 400, 300])
  })

  it('never upscales: a small source decodes once at its native size', () => {
    expect(getDecodeEdges(256)).toEqual([256])
  })

  it('clamps the largest targets to the source and dedupes', () => {
    expect(getDecodeEdges(900)).toEqual([900, 800, 640, 512, 400, 300])
  })

  it('returns nothing for a zero-sized (unloaded) source', () => {
    expect(getDecodeEdges(0)).toEqual([])
  })
})

describe('BarcodeDetector wrapper', () => {
  const original = (globalThis as Record<string, unknown>).BarcodeDetector

  afterEach(() => {
    if (original === undefined) {
      delete (globalThis as Record<string, unknown>).BarcodeDetector
    } else {
      ;(globalThis as Record<string, unknown>).BarcodeDetector = original
    }
  })

  it('reports unsupported when the global is absent', () => {
    delete (globalThis as Record<string, unknown>).BarcodeDetector
    expect(isBarcodeDetectorSupported()).toBe(false)
  })

  /** Installs a stub `BarcodeDetector` whose `detect` resolves/rejects as given. */
  function stubDetector(detect: () => Promise<unknown>) {
    ;(globalThis as Record<string, unknown>).BarcodeDetector = class {
      detect = detect
    }
    return detect
  }

  it('reports supported and decodes the first result', async () => {
    const detect = stubDetector(vi.fn().mockResolvedValue([{ rawValue: 'scanned-value' }]))

    expect(isBarcodeDetectorSupported()).toBe(true)
    const source = {} as ImageBitmapSource
    await expect(decodeWithBarcodeDetector(source)).resolves.toBe('scanned-value')
    expect(detect).toHaveBeenCalledWith(source)
  })

  it('returns null when the detector finds no codes', async () => {
    stubDetector(vi.fn().mockResolvedValue([]))
    await expect(decodeWithBarcodeDetector({} as ImageBitmapSource)).resolves.toBeNull()
  })

  it('returns null (not throw) when detection rejects', async () => {
    stubDetector(vi.fn().mockRejectedValue(new Error('boom')))
    await expect(decodeWithBarcodeDetector({} as ImageBitmapSource)).resolves.toBeNull()
  })

  it('returns null from decode when the global is absent', async () => {
    delete (globalThis as Record<string, unknown>).BarcodeDetector
    await expect(decodeWithBarcodeDetector({} as ImageBitmapSource)).resolves.toBeNull()
  })
})
