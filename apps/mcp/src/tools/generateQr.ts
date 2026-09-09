import { z } from 'zod'
import { renderQr, CapacityExceededError } from '../render.js'

export const generateQrInputSchema = {
  content: z.string().min(1).describe('The text or URL to encode'),
  ecLevel: z.enum(['L', 'M', 'Q', 'H']).default('M').describe('Error-correction level'),
  format: z.enum(['png', 'svg']).default('png'),
  size: z.number().int().min(64).max(2048).default(512).describe('Output size in pixels (PNG only)'),
  margin: z.number().int().min(0).max(20).default(4).describe('Quiet-zone width, in modules'),
  dark: z.string().default('#000000').describe('Foreground color, hex'),
  light: z.string().default('#ffffff').describe('Background color, hex'),
}

export interface GenerateQrInput {
  content: string
  ecLevel: 'L' | 'M' | 'Q' | 'H'
  format: 'png' | 'svg'
  size: number
  margin: number
  dark: string
  light: string
}

export async function handleGenerateQr(input: GenerateQrInput) {
  try {
    const result = await renderQr(input.content, input)
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
