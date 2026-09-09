import type { GeoConfig } from '../types/qr'

/**
 * Parses a decimal-degree string and bounds-checks it. Returns null for empty,
 * non-numeric, or out-of-range input so callers can treat "not yet a coordinate"
 * uniformly, whether the field is blank or holds garbage.
 */
function parseInRange(raw: string, min: number, max: number): number | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const n = Number(trimmed)
  if (!Number.isFinite(n) || n < min || n > max) return null
  return n
}

/** Decimal-degree latitude within ±90, or null when absent/invalid. */
export const parseLatitude = (raw: string): number | null => parseInRange(raw, -90, 90)

/** Decimal-degree longitude within ±180, or null when absent/invalid. */
export const parseLongitude = (raw: string): number | null => parseInRange(raw, -180, 180)

/**
 * Builds a `geo:` URI (RFC 5870) that map apps open at the given point. Both coordinates
 * must be present and within range (latitude ±90, longitude ±180); otherwise returns ''
 * so callers treat an incomplete location exactly like an empty text field. Coordinates
 * are re-emitted in canonical decimal form, with whitespace and any leading `+` stripped.
 */
export function buildGeoString(config: GeoConfig): string {
  const lat = parseLatitude(config.latitude)
  const lng = parseLongitude(config.longitude)
  if (lat === null || lng === null) return ''
  return `geo:${lat},${lng}`
}
