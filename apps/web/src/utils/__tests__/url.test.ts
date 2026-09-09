import { describe, it, expect } from 'vitest'
import { isValidUrl } from '../url'

describe('isValidUrl', () => {
  it('accepts a bare domain', () => {
    expect(isValidUrl('example.com')).toBe(true)
  })

  it('accepts a domain with https scheme', () => {
    expect(isValidUrl('https://example.com')).toBe(true)
  })

  it('accepts a domain with http scheme', () => {
    expect(isValidUrl('http://example.com')).toBe(true)
  })

  it('accepts a subdomain', () => {
    expect(isValidUrl('www.example.co.uk')).toBe(true)
  })

  it('accepts a path, query, and fragment', () => {
    expect(isValidUrl('https://example.com/path?q=1#section')).toBe(true)
  })

  it('accepts a port', () => {
    expect(isValidUrl('https://example.com:8080')).toBe(true)
  })

  it('trims surrounding whitespace before validating', () => {
    expect(isValidUrl('  example.com  ')).toBe(true)
  })

  it('rejects plain text with no dot', () => {
    expect(isValidUrl('not a url')).toBe(false)
  })

  it('rejects a bare word', () => {
    expect(isValidUrl('example')).toBe(false)
  })

  it('rejects a scheme with nothing after it', () => {
    expect(isValidUrl('https://')).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(isValidUrl('')).toBe(false)
  })

  it('rejects whitespace only', () => {
    expect(isValidUrl('   ')).toBe(false)
  })
})
