import { describe, it, expect } from 'vitest'
import { buildVCardString } from '../vcard'
import type { VCardConfig } from '../../types/qr'

const base: VCardConfig = {
  firstName: 'Jane',
  lastName: 'Smith',
  phone: '',
  email: '',
  company: '',
  jobTitle: '',
  website: '',
}

describe('buildVCardString', () => {
  it('returns empty string when both names are empty', () => {
    expect(buildVCardString({ ...base, firstName: '', lastName: '' })).toBe('')
  })

  it('returns empty string when both names are whitespace only', () => {
    expect(buildVCardString({ ...base, firstName: '  ', lastName: '  ' })).toBe('')
  })

  it('builds a minimal vCard with first name only', () => {
    const result = buildVCardString({ ...base, lastName: '' })
    expect(result).toContain('FN:Jane')
    expect(result).toContain('N:;Jane;;;')
    expect(result).toContain('BEGIN:VCARD')
    expect(result).toContain('END:VCARD')
  })

  it('builds a minimal vCard with last name only', () => {
    const result = buildVCardString({ ...base, firstName: '' })
    expect(result).toContain('FN:Smith')
    expect(result).toContain('N:Smith;;;;')
  })

  it('builds FN from both names', () => {
    const result = buildVCardString(base)
    expect(result).toContain('FN:Jane Smith')
    expect(result).toContain('N:Smith;Jane;;;')
  })

  it('includes phone when provided', () => {
    const result = buildVCardString({ ...base, phone: '+1234567890' })
    expect(result).toContain('TEL;TYPE=CELL:+1234567890')
  })

  it('omits phone when empty', () => {
    const result = buildVCardString(base)
    expect(result).not.toContain('TEL')
  })

  it('includes email when provided', () => {
    const result = buildVCardString({ ...base, email: 'jane@example.com' })
    expect(result).toContain('EMAIL:jane@example.com')
  })

  it('includes company when provided', () => {
    const result = buildVCardString({ ...base, company: 'Acme Corp' })
    expect(result).toContain('ORG:Acme Corp')
  })

  it('includes job title when provided', () => {
    const result = buildVCardString({ ...base, jobTitle: 'Designer' })
    expect(result).toContain('TITLE:Designer')
  })

  it('includes website when provided', () => {
    const result = buildVCardString({ ...base, website: 'https://example.com' })
    expect(result).toContain('URL:https://example.com')
  })

  it('escapes backslash in name', () => {
    const result = buildVCardString({ ...base, firstName: 'Jane\\Ann' })
    expect(result).toContain('FN:Jane\\\\Ann')
  })

  it('escapes comma in company', () => {
    const result = buildVCardString({ ...base, company: 'Smith, Jones & Co' })
    expect(result).toContain('ORG:Smith\\, Jones & Co')
  })

  it('escapes semicolon in job title', () => {
    const result = buildVCardString({ ...base, jobTitle: 'VP; Engineering' })
    expect(result).toContain('TITLE:VP\\; Engineering')
  })

  it('produces correct field order', () => {
    const result = buildVCardString({ ...base, phone: '+1', email: 'a@b.com', company: 'Co', jobTitle: 'Dev', website: 'https://x.com' })
    const lines = result.split('\n')
    expect(lines[0]).toBe('BEGIN:VCARD')
    expect(lines[1]).toBe('VERSION:3.0')
    expect(lines.at(-1)).toBe('END:VCARD')
  })

  it('trims whitespace from fields before encoding', () => {
    const result = buildVCardString({ ...base, phone: '  +1234  ', email: '  a@b.com  ' })
    expect(result).toContain('TEL;TYPE=CELL:+1234')
    expect(result).toContain('EMAIL:a@b.com')
  })

  it('omits optional fields when all are empty', () => {
    const result = buildVCardString(base)
    expect(result).not.toContain('TEL')
    expect(result).not.toContain('EMAIL')
    expect(result).not.toContain('ORG')
    expect(result).not.toContain('TITLE')
    expect(result).not.toContain('URL')
  })

  it('omits phone when it fails the phone shape check', () => {
    const result = buildVCardString({ ...base, phone: 'not a number' })
    expect(result).not.toContain('TEL')
  })

  it('omits email when it fails the email shape check', () => {
    const result = buildVCardString({ ...base, email: 'not-an-email' })
    expect(result).not.toContain('EMAIL')
  })

  it('omits website when it fails the url shape check', () => {
    const result = buildVCardString({ ...base, website: 'not a url' })
    expect(result).not.toContain('URL')
  })

  it('includes website without a scheme when it is otherwise valid', () => {
    const result = buildVCardString({ ...base, website: 'example.com' })
    expect(result).toContain('URL:example.com')
  })
})
