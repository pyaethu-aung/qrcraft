import { describe, it, expect } from 'vitest'
import { PHONE_REGEX, normalizePhone, phoneFeedback } from '../phone'

describe('normalizePhone', () => {
  it('returns null for empty or whitespace-only input', () => {
    expect(normalizePhone('')).toBeNull()
    expect(normalizePhone('   ')).toBeNull()
  })

  it('returns null when the input has no digits', () => {
    expect(normalizePhone('---()')).toBeNull()
  })

  it('returns null when the input is too short', () => {
    expect(normalizePhone('12')).toBeNull()
  })

  it('keeps a leading + and strips spaces, hyphens, parens, and dots', () => {
    expect(normalizePhone('+1 (555) 123-4567')).toBe('+15551234567')
    expect(normalizePhone('09.123.456.789')).toBe('09123456789')
  })

  it('trims surrounding whitespace', () => {
    expect(normalizePhone('  +15551234567  ')).toBe('+15551234567')
  })
})

describe('PHONE_REGEX', () => {
  it('accepts international and locally formatted numbers', () => {
    expect(PHONE_REGEX.test('+15551234567')).toBe(true)
    expect(PHONE_REGEX.test('+1 (555) 123-4567')).toBe(true)
    expect(PHONE_REGEX.test('095123456')).toBe(true)
  })

  it('rejects letters and empty / digitless input', () => {
    expect(PHONE_REGEX.test('call me')).toBe(false)
    expect(PHONE_REGEX.test('   ')).toBe(false)
    expect(PHONE_REGEX.test('()-.')).toBe(false)
  })
})

describe('phoneFeedback', () => {
  it('does not preview for empty, invalid, or too-short numbers', () => {
    expect(phoneFeedback('')).toMatchObject({ showPreview: false, missingCountryCode: false })
    expect(phoneFeedback('call me')).toMatchObject({ normalized: null, showPreview: false })
    // "123" passes the loose regex but is too short to assert as a real destination
    expect(phoneFeedback('123')).toMatchObject({ showPreview: false, missingCountryCode: false })
  })

  it('previews once the number has enough digits', () => {
    expect(phoneFeedback('+1 (555) 123-4567')).toMatchObject({
      normalized: '+15551234567',
      showPreview: true,
      missingCountryCode: false,
    })
  })

  it('flags a previewable number with no country code', () => {
    expect(phoneFeedback('09 123 456 789')).toMatchObject({
      normalized: '09123456789',
      showPreview: true,
      missingCountryCode: true,
    })
  })
})
