import type { SharePayload } from '../types/qr'

const SHARE_FILENAME = 'qr-code.png'
const MOBILE_USER_AGENT_PATTERN = /android|iphone|ipad|ipod|mobile/i

const captureCanvasBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Failed to generate QR blob'))
      }
    }, 'image/png')
  })

const ensureCanvas = (element: HTMLCanvasElement | null): HTMLCanvasElement => {
  if (!element) {
    throw new Error('QR canvas reference is missing')
  }
  return element
}

export const createSharePayload = async (
  canvasElement: HTMLCanvasElement | null,
): Promise<SharePayload> => {
  const canvas = ensureCanvas(canvasElement)
  const blob = await captureCanvasBlob(canvas)

  return {
    blob,
    filename: SHARE_FILENAME,
    lastUpdated: new Date(),
  }
}

export const payloadToFile = (payload: SharePayload): File =>
  new File([payload.blob], payload.filename, {
    type: payload.blob.type || 'image/png',
  })

export const isSharePayload = (value: unknown): value is SharePayload =>
  typeof value === 'object' && value !== null && 'blob' in value && 'filename' in value

const isNavigatorShareAvailable = (): boolean =>
  typeof navigator !== 'undefined' && typeof navigator.share === 'function'

export const supportsNavigatorShare = (): boolean => isNavigatorShareAvailable()

export const isMobileDevice = (): boolean => {
  if (typeof navigator === 'undefined') {
    return false
  }

  const userAgent = navigator.userAgent ?? ''
  return MOBILE_USER_AGENT_PATTERN.test(userAgent)
}

export const canShareFiles = (files: File[]): boolean => {
  if (!isNavigatorShareAvailable()) {
    return false
  }

  if (typeof navigator.canShare !== 'function') {
    return true
  }

  try {
    const isSupported = navigator.canShare({ files })
    if (isSupported) {
      return true
    }

    return isMobileDevice()
  } catch {
    return isMobileDevice()
  }
}

export const supportsClipboardImage = (): boolean =>
  typeof navigator !== 'undefined' &&
  typeof navigator.clipboard?.write === 'function' &&
  typeof ClipboardItem !== 'undefined'

export const copyPayloadToClipboard = async (payload: SharePayload): Promise<void> => {
  if (!supportsClipboardImage()) {
    throw new Error('Clipboard image sharing is not supported in this environment')
  }

  const clipboardItem = new ClipboardItem({ 'image/png': payload.blob })
  await navigator.clipboard.write([clipboardItem])
}

export const downloadPayload = (payload: SharePayload): void => {
  const url = URL.createObjectURL(payload.blob)
  const anchor = document.createElement('a')
  anchor.style.display = 'none'
  anchor.href = url
  anchor.download = payload.filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
