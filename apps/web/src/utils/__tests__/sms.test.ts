import { describe, it, expect } from 'vitest'
import { buildSmsString, SMS_PHONE_REGEX } from '../sms'
import type { SmsConfig } from '../../types/qr'

const base: SmsConfig = {
  number: '+15551234567',
  message: '',
}

describe('buildSmsString', () => {
  it('returns empty string when number is empty', () => {
    expect(buildSmsString({ ...base, number: '' })).toBe('')
  })

  it('returns empty string when number is whitespace only', () => {
    expect(buildSmsString({ ...base, number: '   ' })).toBe('')
  })

  it('returns empty string when number has no digits', () => {
    expect(buildSmsString({ ...base, number: '---()' })).toBe('')
  })

  it('returns empty string when number is too short', () => {
    expect(buildSmsString({ ...base, number: '12' })).toBe('')
  })

  it('builds a minimal SMSTO with number only', () => {
    expect(buildSmsString(base)).toBe('SMSTO:+15551234567')
  })

  it('trims whitespace from the number', () => {
    expect(buildSmsString({ ...base, number: '  +15551234567  ' })).toBe('SMSTO:+15551234567')
  })

  it('strips spaces from the number in the payload', () => {
    expect(buildSmsString({ ...base, number: '+1 555 123 4567' })).toBe('SMSTO:+15551234567')
  })

  it('strips parens, dots, and hyphens from the number in the payload', () => {
    expect(buildSmsString({ ...base, number: '+1 (555) 123-4567' })).toBe('SMSTO:+15551234567')
    expect(buildSmsString({ ...base, number: '09.123.456.789' })).toBe('SMSTO:09123456789')
  })

  it('includes the message when provided', () => {
    expect(buildSmsString({ ...base, message: 'See you at 7pm' })).toBe('SMSTO:+15551234567:See you at 7pm')
  })

  it('trims the message before appending', () => {
    expect(buildSmsString({ ...base, message: '  See you at 7pm  ' })).toBe('SMSTO:+15551234567:See you at 7pm')
  })

  it('omits the message when whitespace only', () => {
    const result = buildSmsString({ ...base, message: '   ' })
    expect(result).toBe('SMSTO:+15551234567')
  })

  it('does not percent-encode the message (SMSTO is not a URI)', () => {
    const result = buildSmsString({ ...base, message: 'Meeting & notes: 50% off' })
    expect(result).toBe('SMSTO:+15551234567:Meeting & notes: 50% off')
  })
})

describe('SMS_PHONE_REGEX', () => {
  it('accepts international and locally formatted numbers', () => {
    expect(SMS_PHONE_REGEX.test('+15551234567')).toBe(true)
    expect(SMS_PHONE_REGEX.test('+1 (555) 123-4567')).toBe(true)
    expect(SMS_PHONE_REGEX.test('095123456')).toBe(true)
  })

  it('rejects letters and empty / digitless input', () => {
    expect(SMS_PHONE_REGEX.test('call me')).toBe(false)
    expect(SMS_PHONE_REGEX.test('   ')).toBe(false)
    expect(SMS_PHONE_REGEX.test('()-.')).toBe(false)
  })
})
