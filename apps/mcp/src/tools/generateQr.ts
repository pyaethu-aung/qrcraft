import { z } from 'zod'
import { appearanceSchema, renderQrToolResult } from '../render.js'

export const generateQrInputSchema = {
  content: z.string().min(1).describe('The text or URL to encode'),
  ...appearanceSchema,
}

export const generateQrInputObject = z.object(generateQrInputSchema)
export type GenerateQrInput = z.infer<typeof generateQrInputObject>

export async function handleGenerateQr(input: GenerateQrInput) {
  return renderQrToolResult(input.content, input)
}
