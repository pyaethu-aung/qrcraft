import { describe, it, expect } from 'vitest'
import QRCode from 'qrcode'
import { decodeQrImage, ImageDecodeError } from './decode.js'

// A 1x1 white PNG — a valid, decodable image with no QR code in it.
const BLANK_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

async function qrPngBase64(text: string): Promise<string> {
  const buffer = await QRCode.toBuffer(text, { type: 'png', width: 300, margin: 4 })
  return buffer.toString('base64')
}

describe('decodeQrImage', () => {
  it('decodes a real QR PNG and classifies a plain URL', async () => {
    const base64 = await qrPngBase64('https://example.com/hello')
    const result = await decodeQrImage(base64)
    expect(result).toEqual({
      value: 'https://example.com/hello',
      contentType: 'url',
      openableUrl: 'https://example.com/hello',
    })
  })

  it('classifies a non-URL payload with a null openableUrl', async () => {
    const base64 = await qrPngBase64('WIFI:T:WPA;S:MyNetwork;P:hunter2;;')
    const result = await decodeQrImage(base64)
    expect(result?.contentType).toBe('wifi')
    expect(result?.openableUrl).toBeNull()
  })

  it('returns null for a valid image with no QR code', async () => {
    const result = await decodeQrImage(BLANK_PNG_BASE64)
    expect(result).toBeNull()
  })

  it('throws ImageDecodeError for bytes that are not a readable image', async () => {
    const notAnImage = Buffer.from('definitely not an image').toString('base64')
    await expect(decodeQrImage(notAnImage)).rejects.toBeInstanceOf(ImageDecodeError)
  })
})
