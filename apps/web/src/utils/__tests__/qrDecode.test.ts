import { describe, it, expect, afterEach } from 'vitest'
import QRCode from 'qrcode'
import {
  decodeImageData,
  getDecodeEdges,
  isBarcodeDetectorSupported,
  decodeWithBarcodeDetector,
} from '../qrDecode'

/** Builds an ImageData-shaped object (jsdom exposes no `ImageData` constructor). */
function imageData(data: Uint8ClampedArray, width: number, height: number): ImageData {
  return { data, width, height, colorSpace: 'srgb' } as ImageData
}

/**
 * Renders `text` to a real QR ImageData (scaled modules + quiet zone) so decodeImageData is
 * exercised end-to-end against the actual decoder rather than a mock.
 */
function synthesizeQr(text: string, scale = 6, quiet = 4): ImageData {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' })
  const size = qr.modules.size
  const modules = qr.modules.data
  const dim = (size + quiet * 2) * scale
  const rgba = new Uint8ClampedArray(dim * dim * 4).fill(255)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!(modules[r * size + c] & 1)) continue
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const o = (((r + quiet) * scale + dy) * dim + ((c + quiet) * scale + dx)) * 4
          rgba[o] = rgba[o + 1] = rgba[o + 2] = 0
        }
      }
    }
  }
  return imageData(rgba, dim, dim)
}

describe('decodeImageData', () => {
  it('decodes a real QR rendered to ImageData', () => {
    expect(decodeImageData(synthesizeQr('https://example.com/hello'))).toBe(
      'https://example.com/hello',
    )
  })

  it('returns null when the pixels hold no code', () => {
    const blank = imageData(new Uint8ClampedArray(80 * 80 * 4).fill(255), 80, 80)
    expect(decodeImageData(blank)).toBeNull()
  })
})

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
