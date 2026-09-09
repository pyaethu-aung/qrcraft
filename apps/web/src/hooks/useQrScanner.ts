import { useCallback, useEffect, useRef, useState } from 'react'
import {
  decodeImageData,
  decodeWithBarcodeDetector,
  getDecodeEdges,
  isBarcodeDetectorSupported,
} from '../utils/qrDecode'
import { loadUnsupportedImage, sniffImageFormat } from '../utils/imageFormat'

/**
 * Live-camera decode budget. The loop used to reschedule on every animation
 * frame and run the full scale ladder, so a browser without `BarcodeDetector`
 * (Firefox, older Safari) did up to nine synchronous ZXing passes per frame on
 * the main thread — pinning a core and draining battery on exactly the mobile
 * devices this feature targets.
 *
 * ~10 fps is well above what a hand-held scan needs, and two passes per frame
 * is enough because successive frames re-frame the code anyway: a miss costs
 * 100ms, not the scan. Still uploads keep the full ladder, where latency is
 * acceptable and the single attempt has to count.
 */
const LIVE_FRAME_INTERVAL_MS = 100
const LIVE_FRAME_MAX_PASSES = 2

/**
 * Why a decode attempt failed, mapped to a user-facing message by the component:
 * - `no-code` — the image or frame held no readable QR code
 * - `unsupported-file` — the dropped file was not an image
 * - `file-too-large` — the image exceeded the size we are willing to decode
 * - `camera-denied` — the user blocked camera permission
 * - `camera-unsupported` — the browser exposes no usable camera API
 * - `decode-failed` — the file could not be loaded/processed at all
 */
export type ScanErrorCode =
  | 'no-code'
  | 'unsupported-file'
  | 'file-too-large'
  | 'camera-denied'
  | 'camera-unsupported'
  | 'decode-failed'

/**
 * Largest still image we attempt to decode. A file beyond this is almost always a mistake (a
 * raw high-megapixel capture, a mis-picked video) rather than a QR photo, and pushing it
 * through the decode ladder — a HEIC/TIFF especially, which runs a WASM codec — can lock the
 * tab up. 25 MB clears any real phone photo while ruling out the runaway case.
 */
const MAX_FILE_BYTES = 25 * 1024 * 1024

export interface UseQrScannerReturn {
  /** The decoded string once a scan succeeds, or null. */
  decoded: string | null
  /** The latest failure, or null. */
  error: ScanErrorCode | null
  /** True while a still image is being decoded. */
  isDecoding: boolean
  /** True while the live camera stream is running. */
  isCameraActive: boolean
  /** Attach to the live-preview <video>; the hook drives its stream. */
  videoRef: React.RefObject<HTMLVideoElement | null>
  /** Decode a still image (upload or drop). */
  scanFile: (file: File) => Promise<void>
  /** Abandon an in-flight still-image decode; its pending result is discarded. */
  cancelScan: () => void
  /** Request the camera and begin scanning frames. */
  startCamera: () => Promise<void>
  /** Stop the camera and release the stream. */
  stopCamera: () => void
  /** Display a previously decoded value as the current result (used to restore from history). */
  showResult: (value: string) => void
  /** Clear the current result/error so the scanner can be used again. */
  reset: () => void
}

/** Intrinsic [width, height] of a source, or [0, 0] before it has loaded. */
function sourceDimensions(source: HTMLImageElement | HTMLVideoElement): [number, number] {
  return source instanceof HTMLVideoElement
    ? [source.videoWidth, source.videoHeight]
    : [source.naturalWidth, source.naturalHeight]
}

/**
 * Draws any canvas-drawable source (image, video, or bitmap) of intrinsic size `sw`x`sh` onto
 * a canvas scaled so its longest edge is `maxEdge` (never upscaling), and returns the resulting
 * ImageData, or null when the source has no size or the 2D context is unavailable.
 */
function drawScaled(
  source: CanvasImageSource,
  sw: number,
  sh: number,
  canvas: HTMLCanvasElement,
  maxEdge: number,
): ImageData | null {
  if (!sw || !sh) return null

  const scale = Math.min(1, maxEdge / Math.max(sw, sh))
  const width = Math.max(1, Math.round(sw * scale))
  const height = Math.max(1, Math.round(sh * scale))
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, width, height)
  return ctx.getImageData(0, 0, width, height)
}

/**
 * Decodes a QR from any drawable source of intrinsic size `sw`x`sh`. Prefers the native
 * BarcodeDetector (passing the source straight through, which handles full-resolution input),
 * then falls back to the ZXing decoder over canvas-extracted ImageData, retrying at
 * progressively smaller sizes — the locator fails on oversized photos, so a downscaled pass is
 * what actually reads them. Returns the decoded string or null.
 */
async function decodeDrawable(
  source: CanvasImageSource & ImageBitmapSource,
  sw: number,
  sh: number,
  canvas: HTMLCanvasElement,
  maxFallbackPasses?: number,
): Promise<string | null> {
  if (isBarcodeDetectorSupported()) {
    const value = await decodeWithBarcodeDetector(source)
    if (value) return value
  }
  const edges = getDecodeEdges(Math.max(sw, sh))
  for (const edge of maxFallbackPasses ? edges.slice(0, maxFallbackPasses) : edges) {
    const imageData = drawScaled(source, sw, sh, canvas, edge)
    if (!imageData) return null
    const value = decodeImageData(imageData)
    if (value) return value
  }
  return null
}

/** Decodes a QR from a loaded image/video element. */
function decodeFromSource(
  source: HTMLImageElement | HTMLVideoElement,
  canvas: HTMLCanvasElement,
  maxFallbackPasses?: number,
): Promise<string | null> {
  const [sw, sh] = sourceDimensions(source)
  return decodeDrawable(source, sw, sh, canvas, maxFallbackPasses)
}

/** Loads a File into an HTMLImageElement via an object URL, revoking it when done. */
function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not load image'))
    }
    img.src = url
  })
}

/** Draws an already-sized bitmap 1:1 onto a canvas and returns its ImageData, or null. */
function bitmapToImageData(bitmap: ImageBitmap, canvas: HTMLCanvasElement): ImageData | null {
  if (!bitmap.width || !bitmap.height) return null
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0)
  return ctx.getImageData(0, 0, bitmap.width, bitmap.height)
}

/**
 * Decodes a still image File using createImageBitmap, which lets the browser decode the
 * source directly at each target size with high-quality resampling. This matters most on
 * iOS Safari: decoding a multi-megapixel photo at full size and squashing it with a single
 * canvas drawImage aliases the QR modules enough to defeat the decoder, whereas a bitmap
 * decoded straight to ~640px stays crisp. `imageOrientation: 'from-image'` also honors EXIF
 * rotation so portrait phone shots are not stretched. Prefers BarcodeDetector, then ZXing
 * per scale.
 */
async function decodeImageBitmap(file: File, canvas: HTMLCanvasElement): Promise<string | null> {
  const full = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    if (isBarcodeDetectorSupported()) {
      const value = await decodeWithBarcodeDetector(full)
      if (value) return value
    }
    const longest = Math.max(full.width, full.height)
    for (const edge of getDecodeEdges(longest)) {
      const scale = Math.min(1, edge / longest)
      let bitmap = full
      if (scale < 1) {
        bitmap = await createImageBitmap(file, {
          resizeWidth: Math.max(1, Math.round(full.width * scale)),
          resizeHeight: Math.max(1, Math.round(full.height * scale)),
          resizeQuality: 'high',
          imageOrientation: 'from-image',
        })
      }
      try {
        const imageData = bitmapToImageData(bitmap, canvas)
        const value = imageData ? decodeImageData(imageData) : null
        if (value) return value
      } finally {
        if (bitmap !== full) bitmap.close()
      }
    }
    return null
  } finally {
    full.close()
  }
}

/**
 * Decodes a still image File through the browser's native pipeline: the createImageBitmap path
 * first (high-quality resampling), then the <img> + canvas path. The <img> fallback runs not
 * only when bitmap decoding throws (an unsupported format) but also when it simply finds no
 * code: some iOS Safari versions silently ignore createImageBitmap's resize options, leaving
 * the frame too large to read, whereas the <img> path's drawImage downscale always honors the
 * target size. Throws when the file cannot be loaded at all. Browsers without createImageBitmap
 * use the <img> path directly.
 */
async function decodeNativeFile(file: File, canvas: HTMLCanvasElement): Promise<string | null> {
  if (typeof createImageBitmap === 'function') {
    try {
      const value = await decodeImageBitmap(file, canvas)
      if (value) return value
    } catch {
      // Unsupported format or decode failure; fall through to the <img> path below.
    }
  }
  const img = await loadImageFromFile(file)
  return decodeFromSource(img, canvas)
}

/**
 * Decodes a still image File. Tries the browser's native pipeline first; if the file cannot be
 * loaded (Chrome, Firefox, and Android reject HEIC/HEIF and TIFF), sniffs the format and
 * decodes the two we support ourselves via a lazily loaded codec. A genuinely unreadable file
 * (a recognized-as-native format that still failed to load) rethrows so the caller reports a
 * decode failure rather than a missing code.
 */
async function decodeFile(file: File, canvas: HTMLCanvasElement): Promise<string | null> {
  try {
    return await decodeNativeFile(file, canvas)
  } catch (err) {
    const header = new Uint8Array(await file.slice(0, 32).arrayBuffer())
    const format = sniffImageFormat(header)
    if (format === 'native') throw err
    const bitmap = await loadUnsupportedImage(file, format)
    try {
      return await decodeDrawable(bitmap, bitmap.width, bitmap.height, canvas)
    } finally {
      bitmap.close()
    }
  }
}

/**
 * QR-decoding engine for the Scan view: decode a still image (upload/drop) or run a live
 * camera scan loop. The DOM/canvas/getUserMedia glue lives here; the actual decode is
 * delegated to the pure utils in qrDecode. Releases the camera stream on stop and unmount.
 */
export function useQrScanner(): UseQrScannerReturn {
  const [decoded, setDecoded] = useState<string | null>(null)
  const [error, setError] = useState<ScanErrorCode | null>(null)
  const [isDecoding, setIsDecoding] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number | null>(null)
  // Bumped to abandon an in-flight decode: a resolved attempt whose token is stale is dropped.
  const scanTokenRef = useRef(0)
  // Guards against overlapping starts: rapid re-clicks must not stack getUserMedia requests.
  const startingRef = useRef(false)

  function getCanvas(): HTMLCanvasElement {
    canvasRef.current ??= document.createElement('canvas')
    return canvasRef.current
  }

  const stopCamera = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setIsCameraActive(false)
  }, [])

  const scanFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setError('unsupported-file')
        return
      }
      if (file.size > MAX_FILE_BYTES) {
        setError('file-too-large')
        return
      }
      stopCamera()
      const token = ++scanTokenRef.current
      setError(null)
      setDecoded(null)
      setIsDecoding(true)
      try {
        const value = await decodeFile(file, getCanvas())
        // A newer scan or a cancel has superseded this one; drop its result.
        if (scanTokenRef.current !== token) return
        if (value) {
          setDecoded(value)
        } else {
          setError('no-code')
        }
      } catch {
        if (scanTokenRef.current === token) setError('decode-failed')
      } finally {
        if (scanTokenRef.current === token) setIsDecoding(false)
      }
    },
    [stopCamera],
  )

  const cancelScan = useCallback(() => {
    scanTokenRef.current++
    setIsDecoding(false)
  }, [])

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('camera-unsupported')
      return
    }
    // A start is already in flight (or the camera is live); ignore the extra click so we
    // don't stack getUserMedia requests or flash the error message off and on.
    if (startingRef.current || streamRef.current) return
    startingRef.current = true
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      const video = videoRef.current
      if (!video) {
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        return
      }
      video.srcObject = stream
      await video.play()
      // Clear stale state only once the camera is actually live, so a denied retry leaves the
      // existing error in place rather than blanking and re-showing it (the flicker).
      setError(null)
      setDecoded(null)
      setIsCameraActive(true)

      let lastDecodeAt = Number.NEGATIVE_INFINITY
      const tick = async (now: number) => {
        const current = videoRef.current
        if (!current || !streamRef.current) return
        if (now - lastDecodeAt >= LIVE_FRAME_INTERVAL_MS) {
          lastDecodeAt = now
          const value = await decodeFromSource(current, getCanvas(), LIVE_FRAME_MAX_PASSES)
          if (value) {
            setDecoded(value)
            stopCamera()
            return
          }
        }
        frameRef.current = requestAnimationFrame((next) => void tick(next))
      }
      frameRef.current = requestAnimationFrame((next) => void tick(next))
    } catch (err) {
      const name = (err as Error)?.name
      setError(name === 'NotAllowedError' || name === 'SecurityError' ? 'camera-denied' : 'camera-unsupported')
      stopCamera()
    } finally {
      startingRef.current = false
    }
  }, [stopCamera])

  const showResult = useCallback((value: string) => {
    stopCamera()
    setError(null)
    setIsDecoding(false)
    setDecoded(value)
  }, [stopCamera])

  const reset = useCallback(() => {
    setDecoded(null)
    setError(null)
  }, [])

  // Release the camera if the component unmounts mid-scan.
  useEffect(() => stopCamera, [stopCamera])

  return {
    decoded,
    error,
    isDecoding,
    isCameraActive,
    videoRef,
    scanFile,
    cancelScan,
    startCamera,
    stopCamera,
    showResult,
    reset,
  }
}
