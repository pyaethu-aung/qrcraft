import { describe, it, expect } from 'vitest'
import { buildGeoString, parseLatitude, parseLongitude } from '../geo'
import type { GeoConfig } from '../../types/qr'

const sf: GeoConfig = {
  latitude: '37.7870',
  longitude: '-122.3997',
}

describe('buildGeoString', () => {
  it('returns empty string when both coordinates are empty', () => {
    expect(buildGeoString({ latitude: '', longitude: '' })).toBe('')
  })

  it('returns empty string when only one coordinate is present', () => {
    expect(buildGeoString({ latitude: '37.787', longitude: '' })).toBe('')
    expect(buildGeoString({ latitude: '', longitude: '-122.4' })).toBe('')
  })

  it('returns empty string when a coordinate is not a number', () => {
    expect(buildGeoString({ latitude: 'here', longitude: '-122.4' })).toBe('')
  })

  it('returns empty string when latitude is out of range', () => {
    expect(buildGeoString({ latitude: '91', longitude: '0' })).toBe('')
    expect(buildGeoString({ latitude: '-90.1', longitude: '0' })).toBe('')
  })

  it('returns empty string when longitude is out of range', () => {
    expect(buildGeoString({ latitude: '0', longitude: '181' })).toBe('')
    expect(buildGeoString({ latitude: '0', longitude: '-180.5' })).toBe('')
  })

  it('builds a geo: URI from valid coordinates', () => {
    expect(buildGeoString(sf)).toBe('geo:37.787,-122.3997')
  })

  it('accepts the exact range bounds', () => {
    expect(buildGeoString({ latitude: '90', longitude: '180' })).toBe('geo:90,180')
    expect(buildGeoString({ latitude: '-90', longitude: '-180' })).toBe('geo:-90,-180')
  })

  it('canonicalizes whitespace and a leading plus sign', () => {
    expect(buildGeoString({ latitude: '  +37.787 ', longitude: ' -122.3997 ' })).toBe('geo:37.787,-122.3997')
  })

  it('encodes the equator and prime meridian (zero is valid)', () => {
    expect(buildGeoString({ latitude: '0', longitude: '0' })).toBe('geo:0,0')
  })
})

describe('parseLatitude', () => {
  it('parses values within ±90', () => {
    expect(parseLatitude('37.787')).toBe(37.787)
    expect(parseLatitude('-90')).toBe(-90)
  })

  it('rejects out-of-range, empty, and non-numeric input', () => {
    expect(parseLatitude('90.01')).toBeNull()
    expect(parseLatitude('')).toBeNull()
    expect(parseLatitude('north')).toBeNull()
  })
})

describe('parseLongitude', () => {
  it('parses values within ±180', () => {
    expect(parseLongitude('-122.3997')).toBe(-122.3997)
    expect(parseLongitude('180')).toBe(180)
  })

  it('rejects out-of-range, empty, and non-numeric input', () => {
    expect(parseLongitude('-180.01')).toBeNull()
    expect(parseLongitude('   ')).toBeNull()
    expect(parseLongitude('east')).toBeNull()
  })
})
