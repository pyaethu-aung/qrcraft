// The zxing-based pixel decoder itself has no DOM dependency, so it lives in
// @qrcraft/core (shared with the MCP server's decode_qr tool). This module
// re-exports it for existing call sites, and keeps everything that genuinely
// is browser-only: the multi-scale retry planning around canvas size limits,
// and the native BarcodeDetector wrapper.
export { decodeImageData } from '@qrcraft/core/utils/qrDecode'

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
