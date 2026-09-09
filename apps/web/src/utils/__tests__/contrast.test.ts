import { describe, it, expect } from 'vitest'
import { relativeLuminance, wcagContrastRatio, readableTextColor } from '../contrast'

describe('relativeLuminance', () => {
  it('returns 1 for white and 0 for black', () => {
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 5)
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5)
  })

  it('is case-insensitive', () => {
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5)
  })

  it('returns null for unparseable input', () => {
    expect(relativeLuminance('red')).toBeNull()
    expect(relativeLuminance('#fff')).toBeNull()
    expect(relativeLuminance('')).toBeNull()
  })
})

describe('wcagContrastRatio', () => {
  it('returns 21 for black on white', () => {
    expect(wcagContrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1)
  })

  it('returns 1 for identical colors', () => {
    expect(wcagContrastRatio('#A04D28', '#A04D28')).toBeCloseTo(1, 5)
  })

  it('is order-independent', () => {
    const a = wcagContrastRatio('#123456', '#abcdef')
    const b = wcagContrastRatio('#abcdef', '#123456')
    expect(a).toEqual(b)
  })

  it('returns null when either color is invalid', () => {
    expect(wcagContrastRatio('nope', '#FFFFFF')).toBeNull()
    expect(wcagContrastRatio('#FFFFFF', 'nope')).toBeNull()
  })
})

describe('readableTextColor', () => {
  it('picks white text on a dark fill', () => {
    expect(readableTextColor('#1A1612')).toBe('#FFFFFF')
    expect(readableTextColor('#A04D28')).toBe('#FFFFFF')
  })

  it('picks ink text on a light fill', () => {
    expect(readableTextColor('#FAF6F1')).toBe('#1C1A17')
    expect(readableTextColor('#E8DDD2')).toBe('#1C1A17')
  })

  it('falls back to ink for invalid input', () => {
    expect(readableTextColor('terracotta')).toBe('#1C1A17')
  })
})
