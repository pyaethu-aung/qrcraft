import { COUNTRIES, SHARED_DIAL_PRIMARY } from '../data/countries'
import type { Country } from '../data/countries'

// Regional indicator symbols start at U+1F1E6 ('A' = 65). Every ISO alpha-2 code
// maps to a flag emoji by offsetting each letter into that block.
const REGIONAL_INDICATOR_OFFSET = 0x1f1e6 - 65

/** Flag emoji for an ISO 3166-1 alpha-2 code, e.g. "MM" → 🇲🇲. */
export function countryFlag(iso: string): string {
  return Array.from(iso.toUpperCase())
    .map((char) => String.fromCodePoint(char.charCodeAt(0) + REGIONAL_INDICATOR_OFFSET))
    .join('')
}

export function findCountry(iso: string): Country | undefined {
  return COUNTRIES.find((c) => c.iso === iso)
}

// Display-name and collation helpers are cached per locale: the selector renders
// ~240 rows and re-filters on every keystroke, so rebuilding Intl objects (or
// re-sorting) each time would be wasted work.
const displayNamesCache = new Map<string, Intl.DisplayNames | null>()
const sortedCache = new Map<string, Country[]>()

function regionNames(locale: string): Intl.DisplayNames | null {
  if (!displayNamesCache.has(locale)) {
    try {
      // The 'en' fallback covers locales whose ICU data lacks region names.
      displayNamesCache.set(locale, new Intl.DisplayNames([locale, 'en'], { type: 'region' }))
    } catch {
      displayNamesCache.set(locale, null)
    }
  }
  return displayNamesCache.get(locale) ?? null
}

/** Localized country name via Intl.DisplayNames, falling back to the ISO code. */
export function countryName(iso: string, locale: string): string {
  try {
    return regionNames(locale)?.of(iso) ?? iso
  } catch {
    return iso
  }
}

/** All countries sorted by localized name for the given locale. */
export function sortedCountries(locale: string): Country[] {
  let sorted = sortedCache.get(locale)
  if (!sorted) {
    const collator = new Intl.Collator(locale)
    sorted = [...COUNTRIES].sort((a, b) => collator.compare(countryName(a.iso, locale), countryName(b.iso, locale)))
    sortedCache.set(locale, sorted)
  }
  return sorted
}

/**
 * Filters countries by a free-text query: digit queries (with or without `+`)
 * match the dial code, anything else matches the localized or English name.
 * Results stay sorted by localized name.
 */
export function filterCountries(query: string, locale: string): Country[] {
  const sorted = sortedCountries(locale)
  const q = query.trim().toLowerCase()
  if (!q) return sorted

  if (/^\+?\d+$/.test(q)) {
    const digits = q.replace(/^\+/, '')
    return sorted.filter((c) => c.dialCode.slice(1).startsWith(digits))
  }

  return sorted.filter(
    (c) =>
      countryName(c.iso, locale).toLowerCase().includes(q) ||
      countryName(c.iso, 'en').toLowerCase().includes(q) ||
      c.iso.toLowerCase() === q,
  )
}

export interface DialCodeMatch {
  country: Country
  /** The raw string after the dial code, leading separators stripped (formatting kept). */
  rest: string
}

// Dial codes are 1-3 digits; checking longest-first means "+358..." matches
// Finland rather than a hypothetical shorter prefix.
const MAX_DIAL_DIGITS = 3

/**
 * Detects a country from a raw string that starts with `+`, preferring the
 * longest matching dial code. Shared codes (e.g. +1, +44) resolve to the
 * primary territory in SHARED_DIAL_PRIMARY. Returns null when the string has
 * no leading `+` or no known code.
 */
export function matchDialCode(raw: string): DialCodeMatch | null {
  const trimmed = raw.trimStart()
  if (!trimmed.startsWith('+')) return null

  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return null

  for (let length = Math.min(MAX_DIAL_DIGITS, digits.length); length >= 1; length--) {
    const code = `+${digits.slice(0, length)}`
    const candidates = COUNTRIES.filter((c) => c.dialCode === code)
    if (candidates.length === 0) continue

    const primaryIso = SHARED_DIAL_PRIMARY[code]
    const country = candidates.find((c) => c.iso === primaryIso) ?? candidates[0]
    return { country, rest: stripDialPrefix(trimmed, length) }
  }

  return null
}

// Walks past the `+` and the first `digitCount` digits (formatting characters in
// between included), then strips leading joiners from what remains so the local
// part starts clean. Parens are kept — "(555)" is local formatting, not a joiner.
function stripDialPrefix(raw: string, digitCount: number): string {
  let consumed = 0
  let index = 0
  while (index < raw.length && consumed < digitCount) {
    if (/\d/.test(raw[index])) consumed++
    index++
  }
  return raw.slice(index).replace(/^[\s\-.]+/, '')
}
