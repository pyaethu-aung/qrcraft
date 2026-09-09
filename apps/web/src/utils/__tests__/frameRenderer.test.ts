import { describe, it, expect } from 'vitest'
import { renderFrame } from '../frameRenderer'
import type { QRFrameStyle } from '../../types/qr'

const STYLES: Exclude<QRFrameStyle, 'None'>[] = ['Banner', 'Card', 'Ticket', 'Label', 'Bubble', 'Ticks', 'Photo', 'Circle']
const Q = 250
const COLOR = '#A04D28'
const BG = '#FFFFFF'

describe('renderFrame', () => {
  it.each(STYLES)('produces a valid square layout for %s', (style) => {
    const { viewBox, qrBox, decoration } = renderFrame(style, Q, COLOR, BG, 'SCAN ME', 'bottom')

    // The frame always grows the canvas beyond the bare QR…
    expect(viewBox).toBeGreaterThan(Q)
    // …but never scales the QR itself.
    expect(qrBox.size).toBe(Q)
    // QR stays fully inside the canvas.
    expect(qrBox.x).toBeGreaterThanOrEqual(0)
    expect(qrBox.y).toBeGreaterThanOrEqual(0)
    expect(qrBox.x + qrBox.size).toBeLessThanOrEqual(viewBox + 0.001)
    expect(qrBox.y + qrBox.size).toBeLessThanOrEqual(viewBox + 0.001)
    // The frame accent color is painted somewhere.
    expect(decoration).toContain(COLOR)
  })

  it.each(STYLES)('moves the QR when the caption flips sides for %s', (style) => {
    const bottom = renderFrame(style, Q, COLOR, BG, 'SCAN ME', 'bottom')
    const top = renderFrame(style, Q, COLOR, BG, 'SCAN ME', 'top')
    expect(top.qrBox.y).not.toBe(bottom.qrBox.y)
  })

  it('renders caption text when provided and omits it when empty', () => {
    expect(renderFrame('Banner', Q, COLOR, BG, 'SCAN ME', 'bottom').decoration).toContain('<text')
    expect(renderFrame('Banner', Q, COLOR, BG, '   ', 'bottom').decoration).not.toContain('<text')
  })

  it('escapes XML-special characters in the caption', () => {
    const { decoration } = renderFrame('Banner', Q, COLOR, BG, 'A & B <C>', 'bottom')
    expect(decoration).toContain('A &amp; B &lt;C&gt;')
    expect(decoration).not.toContain('<C>')
  })

  it('constrains overlong captions with textLength', () => {
    const long = renderFrame('Banner', Q, COLOR, BG, 'THIS IS A VERY LONG CAPTION', 'bottom')
    const short = renderFrame('Banner', Q, COLOR, BG, 'GO', 'bottom')
    expect(long.decoration).toContain('textLength=')
    expect(short.decoration).not.toContain('textLength=')
  })

  it('uses the background color to cut the ticket notches', () => {
    const { decoration } = renderFrame('Ticket', Q, COLOR, '#FAF6F1', 'SCAN', 'bottom')
    expect(decoration).toContain('<circle')
    expect(decoration).toContain('#FAF6F1')
  })
})
