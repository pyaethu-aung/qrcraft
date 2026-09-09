/**
 * Image-format detection and conversion for formats that some browsers cannot decode natively.
 *
 * Chrome, Firefox, and Android cannot load HEIC/HEIF or TIFF into `<img>`/`createImageBitmap`,
 * so a phone photo (iPhones shoot HEIC by default) fails to decode there even though Safari
 * reads it fine. When the native pipeline cannot load a file, the scanner sniffs its format
 * here and, for the two formats we can handle, decodes it to an `ImageBitmap` with a bundled
 * library. The libraries are imported dynamically so their weight — libheif's WASM especially
 * — only loads for the rare upload that needs it, never on first paint.
 */

/** A format the native browser pipeline can load, or one we must decode ourselves. */
export type ImageFormat = 'heic' | 'tiff' | 'native'

/**
 * HEIF brands that denote a still HEIC image. AVIF (`avif`) is deliberately excluded: modern
 * browsers decode it natively, so it stays `native` rather than routing through libheif.
 */
const HEIC_BRANDS = new Set([
  'heic',
  'heix',
  'heim',
  'heis',
  'hevc',
  'hevx',
  'hevm',
  'hevs',
  'mif1',
  'msf1',
])

function ascii(header: Uint8Array, start: number, end: number): string {
  let out = ''
  for (let i = start; i < end; i++) out += String.fromCharCode(header[i])
  return out
}

/**
 * Identifies an image format from the leading bytes of the file (at least 12 are needed).
 * Pure and synchronous: feed it `file.slice(0, 32)` read as a Uint8Array. Returns `native`
 * for anything the browser is expected to decode on its own (PNG, JPEG, WebP, AVIF, GIF, ...).
 */
export function sniffImageFormat(header: Uint8Array): ImageFormat {
  // TIFF: 'II' 0x2A 0x00 (little-endian) or 'MM' 0x00 0x2A (big-endian).
  if (header.length >= 4) {
    const [a, b, c, d] = header
    if (a === 0x49 && b === 0x49 && c === 0x2a && d === 0x00) return 'tiff'
    if (a === 0x4d && b === 0x4d && c === 0x00 && d === 0x2a) return 'tiff'
  }
  // HEIF family: an 'ftyp' box at offset 4 with a HEIC brand at offset 8.
  if (header.length >= 12 && ascii(header, 4, 8) === 'ftyp' && HEIC_BRANDS.has(ascii(header, 8, 12))) {
    return 'heic'
  }
  return 'native'
}

/**
 * Decodes a HEIC/HEIF or TIFF file to an `ImageBitmap` the canvas pipeline can draw and the
 * decoder can read. The heavy codecs load on demand: libheif (via `heic-to`) for HEIC, the
 * lightweight pure-JS `utif` for TIFF. The caller owns the returned bitmap and must `close()`
 * it. Browser-only — it relies on `createImageBitmap` and, for HEIC, WebAssembly.
 */
export async function loadUnsupportedImage(
  file: File,
  format: Exclude<ImageFormat, 'native'>,
): Promise<ImageBitmap> {
  if (format === 'heic') {
    const { heicTo } = await import('heic-to')
    return heicTo({ blob: file, type: 'bitmap' })
  }
  const UTIF = (await import('utif')).default
  const buffer = await file.arrayBuffer()
  const [ifd] = UTIF.decode(buffer)
  UTIF.decodeImage(buffer, ifd)
  const rgba = new Uint8ClampedArray(UTIF.toRGBA8(ifd))
  return createImageBitmap(new ImageData(rgba, ifd.width, ifd.height))
}
