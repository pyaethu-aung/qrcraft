import { describe, it, expect } from 'vitest'
import {
  buildVEventString,
  isEndBeforeStart,
  timePartOf,
  toAllDayValue,
  toICalDate,
  toICalDateTime,
  toTimedValue,
  veventDraftLength,
  VEVENT_PAYLOAD_WARN,
} from '../vevent'
import type { VEventConfig } from '../../types/qr'

const base: VEventConfig = {
  summary: 'Team dinner',
  start: '2026-07-01T19:00',
  end: '2026-07-01T21:30',
  allDay: false,
  location: '',
  description: '',
}

const lines = (config: VEventConfig) => buildVEventString(config).split('\r\n')

describe('buildVEventString', () => {
  it('returns empty string when the title is missing', () => {
    expect(buildVEventString({ ...base, summary: '' })).toBe('')
    expect(buildVEventString({ ...base, summary: '   ' })).toBe('')
  })

  it('returns empty string when the start is missing or malformed', () => {
    expect(buildVEventString({ ...base, start: '' })).toBe('')
    expect(buildVEventString({ ...base, start: 'tonight' })).toBe('')
    expect(buildVEventString({ ...base, start: '2026-02-31T19:00' })).toBe('')
  })

  it('returns empty string when the end precedes the start', () => {
    expect(buildVEventString({ ...base, end: '2026-07-01T18:00' })).toBe('')
  })

  it('wraps the event in a VCALENDAR envelope with CRLF line endings', () => {
    expect(lines(base)).toEqual([
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      'SUMMARY:Team dinner',
      'DTSTART:20260701T190000',
      'DTEND:20260701T213000',
      'END:VEVENT',
      'END:VCALENDAR',
    ])
  })

  it('encodes times as floating local time, without Z or TZID', () => {
    const payload = buildVEventString(base)
    expect(payload).toContain('DTSTART:20260701T190000')
    expect(payload).not.toContain('Z')
    expect(payload).not.toContain('TZID')
  })

  it('omits DTEND when no end is given', () => {
    const payload = buildVEventString({ ...base, end: '' })
    expect(payload).toContain('DTSTART:20260701T190000')
    expect(payload).not.toContain('DTEND')
  })

  it('allows a zero-duration event (end equals start)', () => {
    const payload = buildVEventString({ ...base, end: base.start })
    expect(payload).toContain('DTEND:20260701T190000')
  })

  it('includes location and description only when present', () => {
    const payload = buildVEventString({
      ...base,
      location: 'City Hall',
      description: 'Bring the deck',
    })
    expect(payload).toContain('LOCATION:City Hall')
    expect(payload).toContain('DESCRIPTION:Bring the deck')
    expect(buildVEventString(base)).not.toContain('LOCATION')
    expect(buildVEventString(base)).not.toContain('DESCRIPTION')
  })

  it('escapes commas, semicolons, backslashes, and newlines in text fields', () => {
    const payload = buildVEventString({
      ...base,
      summary: 'Dinner; with team, maybe',
      location: 'Hall A\\B',
      description: 'Line one\nLine two',
    })
    expect(payload).toContain('SUMMARY:Dinner\\; with team\\, maybe')
    expect(payload).toContain('LOCATION:Hall A\\\\B')
    expect(payload).toContain('DESCRIPTION:Line one\\nLine two')
  })

  describe('all-day events', () => {
    const allDay: VEventConfig = { ...base, allDay: true, start: '2026-07-01', end: '2026-07-02' }

    it('uses VALUE=DATE and emits the exclusive day after the inclusive end', () => {
      const payload = buildVEventString(allDay)
      expect(payload).toContain('DTSTART;VALUE=DATE:20260701')
      expect(payload).toContain('DTEND;VALUE=DATE:20260703')
    })

    it('omits DTEND for a single day with no explicit end', () => {
      const payload = buildVEventString({ ...allDay, end: '' })
      expect(payload).toContain('DTSTART;VALUE=DATE:20260701')
      expect(payload).not.toContain('DTEND')
    })

    it('treats end equal to start as a one-day event', () => {
      const payload = buildVEventString({ ...allDay, end: '2026-07-01' })
      expect(payload).toContain('DTEND;VALUE=DATE:20260702')
    })

    it('rolls the exclusive end over month and year boundaries', () => {
      expect(buildVEventString({ ...allDay, start: '2026-12-31', end: '2026-12-31' })).toContain(
        'DTEND;VALUE=DATE:20270101',
      )
      expect(buildVEventString({ ...allDay, start: '2028-02-28', end: '2028-02-29' })).toContain(
        'DTEND;VALUE=DATE:20280301',
      )
    })

    it('rejects an end date before the start date', () => {
      expect(buildVEventString({ ...allDay, end: '2026-06-30' })).toBe('')
    })
  })
})

describe('isEndBeforeStart', () => {
  it('flags a timed end earlier than the start', () => {
    expect(isEndBeforeStart({ ...base, end: '2026-07-01T18:59' })).toBe(true)
  })

  it('accepts an equal or later end', () => {
    expect(isEndBeforeStart(base)).toBe(false)
    expect(isEndBeforeStart({ ...base, end: base.start })).toBe(false)
  })

  it('stays quiet while either field is empty or malformed', () => {
    expect(isEndBeforeStart({ ...base, end: '' })).toBe(false)
    expect(isEndBeforeStart({ ...base, start: '' })).toBe(false)
    expect(isEndBeforeStart({ ...base, end: 'soon' })).toBe(false)
  })

  it('compares all-day dates in date format', () => {
    const allDay = { ...base, allDay: true, start: '2026-07-02', end: '2026-07-01' }
    expect(isEndBeforeStart(allDay)).toBe(true)
    expect(isEndBeforeStart({ ...allDay, end: '2026-07-02' })).toBe(false)
  })
})

describe('toICalDate / toICalDateTime', () => {
  it('formats valid values and rejects invalid ones', () => {
    expect(toICalDate('2026-07-01')).toBe('20260701')
    expect(toICalDate('2026-02-30')).toBeNull()
    expect(toICalDate('')).toBeNull()
    expect(toICalDateTime('2026-07-01T08:05')).toBe('20260701T080500')
    expect(toICalDateTime('2026-07-01T24:00')).toBeNull()
    expect(toICalDateTime('2026-07-01')).toBeNull()
  })
})

describe('all-day toggle conversions', () => {
  it('keeps the day when dropping the time', () => {
    expect(toAllDayValue('2026-07-01T19:00')).toBe('2026-07-01')
    expect(toAllDayValue('2026-07-01')).toBe('2026-07-01')
    expect(toAllDayValue('')).toBe('')
  })

  it('keeps the day and applies a default time when switching back', () => {
    expect(toTimedValue('2026-07-01', '09:00')).toBe('2026-07-01T09:00')
    expect(toTimedValue('2026-07-01T19:00', '09:00')).toBe('2026-07-01T19:00')
    expect(toTimedValue('', '09:00')).toBe('')
  })

  it('extracts the time part of timed values only', () => {
    expect(timePartOf('2026-07-01T19:00')).toBe('19:00')
    expect(timePartOf('2026-07-01')).toBeNull()
    expect(timePartOf('')).toBeNull()
  })
})

describe('veventDraftLength', () => {
  it('matches the real payload length once the payload is coherent', () => {
    expect(veventDraftLength(base)).toBe(buildVEventString(base).length)
  })

  it('reports a long draft even before required fields exist', () => {
    const draft = { ...base, summary: '', start: '', description: 'x'.repeat(400) }
    expect(buildVEventString(draft)).toBe('')
    expect(veventDraftLength(draft)).toBeGreaterThan(VEVENT_PAYLOAD_WARN)
  })

  it('stays short for a near-empty draft', () => {
    const draft = { ...base, summary: '', start: '', end: '' }
    expect(veventDraftLength(draft)).toBeLessThan(VEVENT_PAYLOAD_WARN)
  })
})
