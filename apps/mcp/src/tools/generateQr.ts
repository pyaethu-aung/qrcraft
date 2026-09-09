import { z } from 'zod'
import { appearanceSchema, renderQrToolResult } from '../render.js'

export const generateQrInputSchema = {
  content: z.string().min(1).describe('The text or URL to encode'),
  ...appearanceSchema,
}

export type GenerateQrInput = z.infer<ReturnType<typeof z.object<typeof generateQrInputSchema>>>

export async function handleGenerateQr(input: GenerateQrInput) {
  return renderQrToolResult(input.content, input)
}
