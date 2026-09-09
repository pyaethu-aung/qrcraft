import {
  BinaryBitmap,
  DecodeHintType,
  HybridBinarizer,
  QRCodeReader,
  RGBLuminanceSource,
} from '@zxing/library'

/**
 * ZXing decode hints. TRY_HARDER trades a little speed for markedly better detection of
 * rotated, skewed, or low-contrast codes — the conditions in a photographed QR.
 */
const DECODE_HINTS = new Map<DecodeHintType, unknown>([[DecodeHintType.TRY_HARDER, true]])

/** Packs an ImageData's RGBA pixels into the 0xAARRGGBB int array ZXing's source expects. */
function toArgb(image: ImageData): Int32Array {
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
 * simpler decoder fails. Pure and synchronous — the camera/upload glue turns a frame or
 * file into ImageData via a canvas. Returns the decoded string, or null when no QR is found.
 */
export function decodeImageData(image: ImageData): string | null {
  const source = new RGBLuminanceSource(toArgb(image), image.width, image.height)
  const bitmap = new BinaryBitmap(new HybridBinarizer(source))
  try {
    return new QRCodeReader().decode(bitmap, DECODE_HINTS).getText()
  } catch {
    // ZXing throws NotFoundException (and friends) when no readable code is present.
    return null
  }
}

/**
 * Longest-edge pixel sizes the library fallback is attempted at, largest first. There is no
 * single right size: the decoder's locator fails on oversized inputs (a 24MP photo reads
 * nothing at full scale), yet a QR that is small within a large frame — a code on a screen
 * photographed from across a room — needs a *high* working resolution or it shrinks below the
 * locator's reach. A close-up that fills the frame decodes around 512-1024px; a small, distant
 * code only reads at 1280-2560px. The glue fans across the whole band so whichever scale fits
 * a given photo gets a pass. 2560 is the ceiling: 2560x1920 (~4.9M px) stays well under iOS
 * Safari's ~16.7M-px canvas limit, and the full frame is never drawn to a canvas.
 */
export const DECODE_EDGES = [2560, 1600, 1280, 1024, 800, 640, 512, 400, 300]

/**
 * The distinct longest-edge targets to try for a source whose longest edge is `longest`, in
 * descending order. Targets larger than the source are clamped to its size (the decoder is
 * never asked to upscale) and the resulting duplicates removed — so a small, clean upload
 * decodes once at native size while a large photo fans out across scales.
 */
export function getDecodeEdges(longest: number): number[] {
  const edges: number[] = []
  for (const target of DECODE_EDGES) {
    const edge = Math.min(target, longest)
    if (edge > 0 && !edges.includes(edge)) edges.push(edge)
  }
  return edges
}

/** Minimal shape of a `BarcodeDetector` detection result (only the field we read). */
interface DetectedBarcodeLike {
  rawValue: string
}

interface BarcodeDetectorLike {
  detect(source: ImageBitmapSource): Promise<DetectedBarcodeLike[]>
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorLike
}

function getBarcodeDetectorCtor(): BarcodeDetectorConstructor | null {
  const ctor = (globalThis as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector
  return typeof ctor === 'function' ? ctor : null
}

/**
 * Whether the native `BarcodeDetector` API is present. When true it is the preferred
 * decode path (hardware-accelerated, more robust); the ZXing decoder is the fallback for
 * browsers that lack it (notably Safari and Firefox as of writing).
 */
export function isBarcodeDetectorSupported(): boolean {
  return getBarcodeDetectorCtor() !== null
}

/**
 * Decodes a QR code from any `ImageBitmapSource` (a video frame, canvas, or image bitmap)
 * using the native `BarcodeDetector`. Returns the first QR code's value, or null when the
 * API is unavailable, no code is found, or detection throws.
 */
export async function decodeWithBarcodeDetector(
  source: ImageBitmapSource,
): Promise<string | null> {
  const Ctor = getBarcodeDetectorCtor()
  if (!Ctor) return null
  try {
    const detector = new Ctor({ formats: ['qr_code'] })
    const results = await detector.detect(source)
    return results[0]?.rawValue ?? null
  } catch {
    return null
  }
}
