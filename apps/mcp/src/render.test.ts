import { describe, it, expect } from 'vitest'
import { renderQr, renderQrToolResult, CapacityExceededError, type RenderOptions } from './render.js'

const BASE_OPTIONS: RenderOptions = {
  ecLevel: 'M',
  format: 'png',
  size: 128,
  margin: 4,
  dark: '#000000',
  light: '#ffffff',
}

describe('renderQr', () => {
  it('renders a PNG buffer for format png', async () => {
    const result = await renderQr('https://example.com', BASE_OPTIONS)
    expect('png' in result).toBe(true)
    if ('png' in result) {
      expect(Buffer.isBuffer(result.png)).toBe(true)
      expect(result.png.length).toBeGreaterThan(0)
    }
  })

  it('renders SVG text for format svg', async () => {
    const result = await renderQr('https://example.com', { ...BASE_OPTIONS, format: 'svg' })
    expect('svg' in result).toBe(true)
    if ('svg' in result) {
      expect(result.svg).toContain('<svg')
    }
  })

  it('throws CapacityExceededError with the used/max byte counts when content is over capacity', async () => {
    const tooLong = 'x'.repeat(3000)
    await expect(renderQr(tooLong, { ...BASE_OPTIONS, ecLevel: 'H' })).rejects.toSatisfy(
      (error: unknown) => {
        expect(error).toBeInstanceOf(CapacityExceededError)
        const capacityError = error as CapacityExceededError
        expect(capacityError.used).toBe(3000)
        expect(capacityError.max).toBeGreaterThan(0)
        expect(capacityError.max).toBeLessThan(3000)
        return true
      },
    )
  })
})

describe('renderQrToolResult', () => {
  it('returns an image content block for png', async () => {
    const result = await renderQrToolResult('https://example.com', BASE_OPTIONS)
    const block = result.content[0]
    expect(block).toMatchObject({ type: 'image', mimeType: 'image/png' })
    if (block.type !== 'image') throw new Error('expected an image block')
    expect(typeof block.data).toBe('string')
    expect(result.isError).toBeUndefined()
  })

  it('returns a text content block for svg', async () => {
    const result = await renderQrToolResult('https://example.com', { ...BASE_OPTIONS, format: 'svg' })
    const block = result.content[0]
    expect(block.type).toBe('text')
    if (block.type !== 'text') throw new Error('expected a text block')
    expect(block.text).toContain('<svg')
    expect(result.isError).toBeUndefined()
  })

  it('returns isError with the capacity message instead of throwing', async () => {
    const tooLong = 'x'.repeat(3000)
    const result = await renderQrToolResult(tooLong, { ...BASE_OPTIONS, ecLevel: 'H' })
    expect(result.isError).toBe(true)
    const block = result.content[0]
    if (block.type !== 'text') throw new Error('expected a text block')
    expect(block.text).toContain('capacity')
  })
})
