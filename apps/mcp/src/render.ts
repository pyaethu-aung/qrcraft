import QRCode from 'qrcode'
import { getCapacityStatus, type QRErrorCorrectionLevel } from '@qrcraft/core'

export interface RenderOptions {
  ecLevel: QRErrorCorrectionLevel
  format: 'png' | 'svg'
  size: number
  margin: number
  dark: string
  light: string
}

export class CapacityExceededError extends Error {
  readonly used: number
  readonly max: number

  constructor(used: number, max: number) {
    super(
      `Content is ${used} bytes, over the ${max}-byte capacity for this error-correction level. Use less content or a lower error-correction level.`,
    )
    this.name = 'CapacityExceededError'
    this.used = used
    this.max = max
  }
}

export async function renderQr(
  content: string,
  options: RenderOptions,
): Promise<{ png: Buffer } | { svg: string }> {
  const capacity = getCapacityStatus(content, options.ecLevel)
  if (capacity.isOverLimit) {
    throw new CapacityExceededError(capacity.used, capacity.max)
  }

  const qrOptions = {
    errorCorrectionLevel: options.ecLevel,
    margin: options.margin,
    width: options.size,
    color: { dark: options.dark, light: options.light },
  }

  if (options.format === 'svg') {
    const svg = await QRCode.toString(content, { ...qrOptions, type: 'svg' })
    return { svg }
  }

  const png = await QRCode.toBuffer(content, { ...qrOptions, type: 'png' })
  return { png }
}
