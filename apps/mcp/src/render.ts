import { z } from 'zod'
import QRCode from 'qrcode'
import { getCapacityStatus } from '@qrcraft/core'

// Shared by both tools' input schemas (generateQr.ts, generateStructuredQr.ts)
// so appearance options are defined once.
export const appearanceSchema = {
  ecLevel: z.enum(['L', 'M', 'Q', 'H']).default('M').describe('Error-correction level'),
  format: z.enum(['png', 'svg']).default('png'),
  size: z.number().int().min(64).max(2048).default(512).describe('Output size in pixels (PNG only)'),
  margin: z.number().int().min(0).max(20).default(4).describe('Quiet-zone width, in modules'),
  dark: z.string().default('#000000').describe('Foreground color, hex'),
  light: z.string().default('#ffffff').describe('Background color, hex'),
}

export const appearanceObject = z.object(appearanceSchema)
export type RenderOptions = z.infer<typeof appearanceObject>

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

/** Shared by both tool handlers: render, then shape the result as MCP tool content. */
export async function renderQrToolResult(content: string, options: RenderOptions) {
  try {
    const result = await renderQr(content, options)
    if ('svg' in result) {
      return { content: [{ type: 'text' as const, text: result.svg }] }
    }
    return {
      content: [{ type: 'image' as const, data: result.png.toString('base64'), mimeType: 'image/png' }],
    }
  } catch (error) {
    if (error instanceof CapacityExceededError) {
      return { content: [{ type: 'text' as const, text: error.message }], isError: true }
    }
    throw error
  }
}
