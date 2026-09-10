import { describe, it, expect } from 'vitest'
import QRCode from 'qrcode'
import { decodeImageData, type PixelData } from './qrDecode'

function pixelData(data: Uint8ClampedArray, width: number, height: number): PixelData {
  return { data, width, height }
}

/**
 * Renders `text` to real QR pixel data (scaled modules + quiet zone) so decodeImageData is
 * exercised end-to-end against the actual decoder rather than a mock.
 */
function synthesizeQr(text: string, scale = 6, quiet = 4): PixelData {
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
  return pixelData(rgba, dim, dim)
}

describe('decodeImageData', () => {
  it('decodes a real QR rendered to pixel data', () => {
    expect(decodeImageData(synthesizeQr('https://example.com/hello'))).toBe(
      'https://example.com/hello',
    )
  })

  it('returns null when the pixels hold no code', () => {
    const blank = pixelData(new Uint8ClampedArray(80 * 80 * 4).fill(255), 80, 80)
    expect(decodeImageData(blank)).toBeNull()
  })
})
