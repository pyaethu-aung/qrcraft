import { describe, it, expect } from 'vitest'
import { COUNTRIES } from '../../data/countries'
import { countryFlag, countryName, filterCountries, findCountry, matchDialCode, sortedCountries } from '../country'

describe('countryFlag', () => {
  it('maps an ISO code to its flag emoji', () => {
    expect(countryFlag('MM')).toBe('🇲🇲')
    expect(countryFlag('US')).toBe('🇺🇸')
  })

  it('accepts lowercase codes', () => {
    expect(countryFlag('mm')).toBe('🇲🇲')
  })
})

describe('countryName', () => {
  it('returns the English name', () => {
    expect(countryName('MM', 'en')).toMatch(/myanmar/i)
    expect(countryName('US', 'en')).toMatch(/united states/i)
  })

  it('returns the Burmese name for the my locale', () => {
    expect(countryName('MM', 'my')).toBe('မြန်မာ')
  })

  it('falls back to the code for an unassigned region', () => {
    // AA is user-assigned: syntactically valid, no CLDR display name.
    expect(countryName('AA', 'en')).toBe('AA')
  })
})

describe('findCountry', () => {
  it('finds a country by ISO code', () => {
    expect(findCountry('MM')).toEqual({ iso: 'MM', dialCode: '+95' })
  })

  it('returns undefined for an unknown code', () => {
    expect(findCountry('ZZ')).toBeUndefined()
  })
})

describe('sortedCountries', () => {
  it('returns every country sorted by localized name', () => {
    const sorted = sortedCountries('en')
    expect(sorted).toHaveLength(COUNTRIES.length)
    const names = sorted.map((c) => countryName(c.iso, 'en'))
    const collator = new Intl.Collator('en')
    expect(names).toEqual([...names].sort((a, b) => collator.compare(a, b)))
  })
})

describe('matchDialCode', () => {
  it('matches Myanmar and keeps the local formatting', () => {
    expect(matchDialCode('+95 9 123 456 789')).toEqual({
      country: { iso: 'MM', dialCode: '+95' },
      rest: '9 123 456 789',
    })
  })

  it('resolves shared dial codes to the primary territory', () => {
    expect(matchDialCode('+1 (555) 123-4567')?.country.iso).toBe('US')
    expect(matchDialCode('+7 912 345 67 89')?.country.iso).toBe('RU')
    expect(matchDialCode('+44 20 7946 0958')?.country.iso).toBe('GB')
  })

  it('prefers the longest matching code', () => {
    // +358 (Finland) must win over a shorter prefix interpretation.
    expect(matchDialCode('+358 40 1234567')?.country.iso).toBe('FI')
    expect(matchDialCode('+35812')?.rest).toBe('12')
  })

  it('strips formatting between the + and the code digits', () => {
    expect(matchDialCode('+ 9 5 9123')).toEqual({
      country: { iso: 'MM', dialCode: '+95' },
      rest: '9123',
    })
  })

  it('returns null without a leading +', () => {
    expect(matchDialCode('09 123 456 789')).toBeNull()
    expect(matchDialCode('')).toBeNull()
  })

  it('returns null for + with no digits or an unknown code', () => {
    expect(matchDialCode('+')).toBeNull()
    expect(matchDialCode('+999 123')).toBeNull()
  })
})

describe('filterCountries', () => {
  it('returns all countries for an empty query', () => {
    expect(filterCountries('', 'en')).toHaveLength(COUNTRIES.length)
    expect(filterCountries('   ', 'en')).toHaveLength(COUNTRIES.length)
  })

  it('matches by localized name', () => {
    const result = filterCountries('myan', 'en')
    expect(result.map((c) => c.iso)).toContain('MM')
  })

  it('matches by Burmese name when the locale is my', () => {
    const result = filterCountries('မြန်မာ', 'my')
    expect(result.map((c) => c.iso)).toContain('MM')
  })

  it('falls back to the English name in non-English locales', () => {
    const result = filterCountries('myanmar', 'my')
    expect(result.map((c) => c.iso)).toContain('MM')
  })

  it('matches by dial code with or without +', () => {
    expect(filterCountries('+95', 'en').map((c) => c.iso)).toContain('MM')
    expect(filterCountries('95', 'en').map((c) => c.iso)).toContain('MM')
    expect(filterCountries('+1', 'en').map((c) => c.iso)).toContain('US')
  })

  it('returns an empty list when nothing matches', () => {
    expect(filterCountries('zzzzzz', 'en')).toHaveLength(0)
    expect(filterCountries('+999', 'en')).toHaveLength(0)
  })
})
