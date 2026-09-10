import {
  BinaryBitmap,
  DecodeHintType,
  HybridBinarizer,
  QRCodeReader,
  RGBLuminanceSource,
} from '@zxing/library'

/**
 * The subset of the DOM `ImageData` shape decodeImageData actually needs — RGBA pixel bytes
 * plus dimensions. Kept as a plain interface (not the DOM type) so this stays usable from
 * Node, where a browser `ImageData` global doesn't exist; a real `ImageData` satisfies this
 * structurally, so apps/web's canvas-derived values pass through unchanged.
 */
export interface PixelData {
  data: Uint8ClampedArray | Uint8Array
  width: number
  height: number
}

/**
 * ZXing decode hints. TRY_HARDER trades a little speed for markedly better detection of
 * rotated, skewed, or low-contrast codes — the conditions in a photographed QR.
 */
const DECODE_HINTS = new Map<DecodeHintType, unknown>([[DecodeHintType.TRY_HARDER, true]])

/** Packs RGBA pixel data into the 0xAARRGGBB int array ZXing's source expects. */
function toArgb(image: PixelData): Int32Array {
  const { data } = image
  const argb = new Int32Array(image.width * image.height)
  for (let i = 0; i < argb.length; i++) {
    const o = i * 4
    argb[i] = (0xff << 24) | (data[o] << 16) | (data[o + 1] << 8) | data[o + 2]
  }
  return argb
}

/**
 * Decodes a QR code from raw pixel data using ZXing's QR reader over a hybrid binarizer,
 * which is robust to the uneven lighting and screen moiré of a photographed code where a
 * simpler decoder fails. Pure and synchronous — the caller turns a frame, file, or canvas
 * into RGBA pixel data first. Returns the decoded string, or null when no QR is found.
 */
export function decodeImageData(image: PixelData): string | null {
  const source = new RGBLuminanceSource(toArgb(image), image.width, image.height)
  const bitmap = new BinaryBitmap(new HybridBinarizer(source))
  try {
    return new QRCodeReader().decode(bitmap, DECODE_HINTS).getText()
  } catch {
    // ZXing throws NotFoundException (and friends) when no readable code is present.
    return null
  }
}
