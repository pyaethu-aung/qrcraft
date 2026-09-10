import { Jimp } from 'jimp'
import { decodeImageData } from '@qrcraft/core/utils/qrDecode'
import { classifyDecoded, getOpenableUrl } from '@qrcraft/core'

export interface DecodeResult {
  value: string
  contentType: ReturnType<typeof classifyDecoded>
  openableUrl: string | null
}

export class ImageDecodeError extends Error {
  constructor(cause: unknown) {
    super(`Could not read the image: ${cause instanceof Error ? cause.message : String(cause)}`)
    this.name = 'ImageDecodeError'
  }
}

/**
 * Decodes a QR code from a base64-encoded image (PNG, JPEG, BMP, GIF, or
 * TIFF — whatever Jimp's pure-JS decoders support). Returns null when the
 * image decodes fine but holds no readable QR code; throws ImageDecodeError
 * when the bytes aren't a readable image at all.
 */
export async function decodeQrImage(base64: string): Promise<DecodeResult | null> {
  const buffer = Buffer.from(base64, 'base64')

  let bitmap: { data: Buffer; width: number; height: number }
  try {
    const image = await Jimp.read(buffer)
    bitmap = image.bitmap
  } catch (error) {
    throw new ImageDecodeError(error)
  }

  const value = decodeImageData(bitmap)
  if (!value) return null

  return {
    value,
    contentType: classifyDecoded(value),
    openableUrl: getOpenableUrl(value),
  }
}
