import { describe, it, expect } from 'vitest'
import { sniffImageFormat } from '../imageFormat'

/** Builds a header from ASCII placed at `offset`, zero-padded to `length` bytes. */
function header(parts: Array<[number, string]>, length = 16): Uint8Array {
  const bytes = new Uint8Array(length)
  for (const [offset, text] of parts) {
    for (let i = 0; i < text.length; i++) bytes[offset + i] = text.charCodeAt(i)
  }
  return bytes
}

describe('sniffImageFormat', () => {
  it('detects little-endian TIFF (II*\\0)', () => {
    expect(sniffImageFormat(new Uint8Array([0x49, 0x49, 0x2a, 0x00, 0, 0, 0, 0]))).toBe('tiff')
  })

  it('detects big-endian TIFF (MM\\0*)', () => {
    expect(sniffImageFormat(new Uint8Array([0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 0]))).toBe('tiff')
  })

  it('detects HEIC by its ftyp brand', () => {
    expect(sniffImageFormat(header([[4, 'ftyp'], [8, 'heic']]))).toBe('heic')
  })

  it('detects other HEIF still brands (mif1)', () => {
    expect(sniffImageFormat(header([[4, 'ftyp'], [8, 'mif1']]))).toBe('heic')
  })

  it('treats AVIF as native (browsers decode it)', () => {
    expect(sniffImageFormat(header([[4, 'ftyp'], [8, 'avif']]))).toBe('native')
  })

  it('treats a PNG signature as native', () => {
    expect(sniffImageFormat(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(
      'native',
    )
  })

  it('treats a JPEG signature as native', () => {
    expect(sniffImageFormat(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]))).toBe('native')
  })

  it('does not misread a truncated header as HEIC', () => {
    expect(sniffImageFormat(new Uint8Array([0x66, 0x74, 0x79, 0x70]))).toBe('native')
  })
})
