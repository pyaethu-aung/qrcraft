import { describe, it, expect } from 'vitest'
import { buildFgGradientDefs } from '../gradient'
import type { QRGradient } from '../../types/qr'

const linear = (overrides: Partial<QRGradient> = {}): QRGradient => ({
  type: 'linear',
  from: '#000000',
  to: '#4F46E5',
  direction: 'to-r',
  ...overrides,
})

describe('buildFgGradientDefs', () => {
  it('wraps a linearGradient in <defs> with the given id and both stops', () => {
    const defs = buildFgGradientDefs(linear(), 'qr-fg', 100)
    expect(defs.startsWith('<defs>')).toBe(true)
    expect(defs.endsWith('</defs>')).toBe(true)
    expect(defs).toContain('<linearGradient id="qr-fg"')
    expect(defs).toContain('gradientUnits="userSpaceOnUse"')
    expect(defs).toContain('<stop offset="0" stop-color="#000000"/>')
    expect(defs).toContain('<stop offset="1" stop-color="#4F46E5"/>')
  })

  it('maps "to-r" to a left→right horizontal line spanning the box', () => {
    const defs = buildFgGradientDefs(linear({ direction: 'to-r' }), 'g', 100)
    // from on the left edge, to on the right edge, at vertical center.
    expect(defs).toContain('x1="0" y1="50" x2="100" y2="50"')
  })

  it('maps "to-b" to a top→bottom vertical line', () => {
    const defs = buildFgGradientDefs(linear({ direction: 'to-b' }), 'g', 100)
    expect(defs).toContain('x1="50" y1="0" x2="50" y2="100"')
  })

  it('maps "to-t" to a bottom→top vertical line (start below, end above)', () => {
    const defs = buildFgGradientDefs(linear({ direction: 'to-t' }), 'g', 100)
    expect(defs).toContain('x1="50" y1="100" x2="50" y2="0"')
  })

  it('emits a radialGradient centered in the box reaching the corners', () => {
    const defs = buildFgGradientDefs(linear({ type: 'radial' }), 'g', 100)
    expect(defs).toContain('<radialGradient id="g"')
    expect(defs).toContain('cx="50" cy="50"')
    // half-diagonal ≈ 70.71 so the end color reaches the corners.
    expect(defs).toContain('r="70.71"')
    expect(defs).not.toContain('linearGradient')
  })
})
