import { describe, it, expect } from 'vitest'
import { buildEmailString } from '../email'
import type { EmailConfig } from '../../types/qr'

const base: EmailConfig = {
  to: 'jane@example.com',
  subject: '',
  body: '',
}

describe('buildEmailString', () => {
  it('returns empty string when to is empty', () => {
    expect(buildEmailString({ ...base, to: '' })).toBe('')
  })

  it('returns empty string when to is whitespace only', () => {
    expect(buildEmailString({ ...base, to: '   ' })).toBe('')
  })

  it('returns empty string when to is not a valid email address', () => {
    expect(buildEmailString({ ...base, to: 'not-an-email' })).toBe('')
    expect(buildEmailString({ ...base, to: 'missing@tld' })).toBe('')
    expect(buildEmailString({ ...base, to: '@nodomain.com' })).toBe('')
  })

  it('builds a minimal mailto with to only', () => {
    const result = buildEmailString(base)
    expect(result).toBe('mailto:jane@example.com')
  })

  it('trims whitespace from to address', () => {
    const result = buildEmailString({ ...base, to: '  jane@example.com  ' })
    expect(result).toBe('mailto:jane@example.com')
  })

  it('includes subject when provided', () => {
    const result = buildEmailString({ ...base, subject: 'Hello' })
    expect(result).toBe('mailto:jane@example.com?subject=Hello')
  })

  it('encodes spaces in subject', () => {
    const result = buildEmailString({ ...base, subject: 'Hello World' })
    expect(result).toContain('subject=Hello%20World')
  })

  it('encodes special characters in subject', () => {
    const result = buildEmailString({ ...base, subject: 'Re: Meeting & Notes' })
    expect(result).toContain('subject=Re%3A%20Meeting%20%26%20Notes')
  })

  it('includes body when provided', () => {
    const result = buildEmailString({ ...base, body: 'Hi there' })
    expect(result).toBe('mailto:jane@example.com?body=Hi%20there')
  })

  it('encodes newlines in body', () => {
    const result = buildEmailString({ ...base, body: 'Line 1\nLine 2' })
    expect(result).toContain('body=Line%201%0ALine%202')
  })

  it('includes both subject and body', () => {
    const result = buildEmailString({ ...base, subject: 'Hello', body: 'Hi there' })
    expect(result).toBe('mailto:jane@example.com?subject=Hello&body=Hi%20there')
  })

  it('omits subject when whitespace only', () => {
    const result = buildEmailString({ ...base, subject: '   ' })
    expect(result).toBe('mailto:jane@example.com')
    expect(result).not.toContain('subject')
  })

  it('omits body when whitespace only', () => {
    const result = buildEmailString({ ...base, body: '   ' })
    expect(result).toBe('mailto:jane@example.com')
    expect(result).not.toContain('body')
  })

  it('trims subject and body before encoding', () => {
    const result = buildEmailString({ ...base, subject: '  Hello  ', body: '  Hi  ' })
    expect(result).toContain('subject=Hello')
    expect(result).toContain('body=Hi')
  })
})
