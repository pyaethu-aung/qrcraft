import { z } from 'zod'
import { decodeQrImage, ImageDecodeError } from '../decode.js'

export const decodeQrInputSchema = {
  image: z
    .string()
    .min(1)
    .describe('Base64-encoded image containing a QR code (PNG, JPEG, BMP, GIF, or TIFF)'),
}

export const decodeQrInputObject = z.object(decodeQrInputSchema)
export type DecodeQrInput = z.infer<typeof decodeQrInputObject>

export async function handleDecodeQr(input: DecodeQrInput) {
  try {
    const result = await decodeQrImage(input.image)
    if (!result) {
      return {
        content: [{ type: 'text' as const, text: 'No QR code found in the image.' }],
        isError: true,
      }
    }
    return {
      content: [
        { type: 'text' as const, text: JSON.stringify(result, null, 2) },
      ],
    }
  } catch (error) {
    if (error instanceof ImageDecodeError) {
      return { content: [{ type: 'text' as const, text: error.message }], isError: true }
    }
    throw error
  }
}
