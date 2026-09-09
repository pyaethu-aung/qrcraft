import { describe, it, expect } from 'vitest'
import { buildTelString, TEL_PHONE_REGEX } from '../tel'
import type { TelConfig } from '../../types/qr'

const base: TelConfig = {
  number: '+15551234567',
}

describe('buildTelString', () => {
  it('returns empty string when number is empty', () => {
    expect(buildTelString({ number: '' })).toBe('')
  })

  it('returns empty string when number is whitespace only', () => {
    expect(buildTelString({ number: '   ' })).toBe('')
  })

  it('returns empty string when number has no digits', () => {
    expect(buildTelString({ number: '---()' })).toBe('')
  })

  it('returns empty string when number is too short', () => {
    expect(buildTelString({ number: '12' })).toBe('')
  })

  it('builds a tel: URI from a plain number', () => {
    expect(buildTelString(base)).toBe('tel:+15551234567')
  })

  it('trims whitespace from the number', () => {
    expect(buildTelString({ number: '  +15551234567  ' })).toBe('tel:+15551234567')
  })

  it('strips spaces, parens, dots, and hyphens from the number', () => {
    expect(buildTelString({ number: '+1 (555) 123-4567' })).toBe('tel:+15551234567')
    expect(buildTelString({ number: '09.123.456.789' })).toBe('tel:09123456789')
  })
})

describe('TEL_PHONE_REGEX', () => {
  it('accepts international and locally formatted numbers', () => {
    expect(TEL_PHONE_REGEX.test('+15551234567')).toBe(true)
    expect(TEL_PHONE_REGEX.test('+1 (555) 123-4567')).toBe(true)
    expect(TEL_PHONE_REGEX.test('095123456')).toBe(true)
  })

  it('rejects letters and empty / digitless input', () => {
    expect(TEL_PHONE_REGEX.test('call me')).toBe(false)
    expect(TEL_PHONE_REGEX.test('   ')).toBe(false)
    expect(TEL_PHONE_REGEX.test('()-.')).toBe(false)
  })
})
