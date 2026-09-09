import { describe, it, expect } from 'vitest'
import { classifyDecoded, getOpenableUrl } from '../qrClassify'

describe('classifyDecoded', () => {
  it('treats empty or whitespace-only input as text', () => {
    expect(classifyDecoded('')).toBe('text')
    expect(classifyDecoded('   ')).toBe('text')
  })

  it('detects http and https URLs', () => {
    expect(classifyDecoded('https://example.com')).toBe('url')
    expect(classifyDecoded('http://example.com/path?q=1')).toBe('url')
  })

  it('detects structured vCard and vEvent payloads', () => {
    expect(classifyDecoded('BEGIN:VCARD\nVERSION:3.0\nEND:VCARD')).toBe('vcard')
    expect(classifyDecoded('BEGIN:VCALENDAR\nBEGIN:VEVENT\nEND:VEVENT')).toBe('vevent')
    expect(classifyDecoded('BEGIN:VEVENT\nSUMMARY:Test')).toBe('vevent')
  })

  it('detects Wi-Fi, email, sms, tel, and geo schemes', () => {
    expect(classifyDecoded('WIFI:S:Cafe;T:WPA;P:hunter2;;')).toBe('wifi')
    expect(classifyDecoded('mailto:jane@example.com')).toBe('email')
    expect(classifyDecoded('MATMSG:TO:jane@example.com;;')).toBe('email')
    expect(classifyDecoded('SMSTO:+15551234567:Hi')).toBe('sms')
    expect(classifyDecoded('sms:+15551234567')).toBe('sms')
    expect(classifyDecoded('tel:+15551234567')).toBe('tel')
    expect(classifyDecoded('geo:37.787,-122.4')).toBe('geo')
  })

  it('detects crypto payment URIs', () => {
    expect(classifyDecoded('bitcoin:bc1qexample?amount=0.1')).toBe('crypto')
    expect(classifyDecoded('ethereum:0xabc?value=1e18')).toBe('crypto')
  })

  it('is case-insensitive about schemes and markers', () => {
    expect(classifyDecoded('WiFi:S:Net;;')).toBe('wifi')
    expect(classifyDecoded('MAILTO:jane@example.com')).toBe('email')
    expect(classifyDecoded('begin:vcard\nEND:VCARD')).toBe('vcard')
  })

  it('prefers an explicit scheme over the generic URL test', () => {
    // mailto is a valid URL but should classify as email, not url.
    expect(classifyDecoded('mailto:jane@example.com')).toBe('email')
  })

  it('falls back to text for plain strings', () => {
    expect(classifyDecoded('just some text')).toBe('text')
    expect(classifyDecoded('not a url with spaces')).toBe('text')
  })
})

describe('getOpenableUrl', () => {
  it('returns the trimmed URL for http/https', () => {
    expect(getOpenableUrl('  https://example.com ')).toBe('https://example.com')
    expect(getOpenableUrl('http://example.com')).toBe('http://example.com')
  })

  it('returns null for non-http schemes and plain text', () => {
    expect(getOpenableUrl('mailto:jane@example.com')).toBeNull()
    expect(getOpenableUrl('javascript:alert(1)')).toBeNull()
    expect(getOpenableUrl('file:///etc/passwd')).toBeNull()
    expect(getOpenableUrl('just text')).toBeNull()
  })
})
