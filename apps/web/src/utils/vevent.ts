import type { VEventConfig } from '../types/qr'

/**
 * Past this payload length the QR matrix gets dense enough that small prints
 * scan unreliably. Same threshold the email mode uses for its long-body warning.
 */
export const VEVENT_PAYLOAD_WARN = 300

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

/** Escapes iCalendar TEXT values (RFC 5545 §3.3.11): backslash, separators, newlines. */
function escapeICalText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n')
}

/**
 * Splits a `YYYY-MM-DD` prefix into numeric parts, rejecting strings whose shape
 * is right but whose date doesn't exist on the calendar (e.g. 2026-02-31). Native
 * date inputs never produce those, but the builder shouldn't trust its callers.
 */
function parseDateParts(raw: string): { y: number; m: number; d: number } | null {
  const y = Number(raw.slice(0, 4))
  const m = Number(raw.slice(5, 7))
  const d = Number(raw.slice(8, 10))
  const probe = new Date(Date.UTC(y, m - 1, d))
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d)
    return null
  return { y, m, d }
}

const pad = (n: number, width: number) => String(n).padStart(width, '0')

/** `YYYY-MM-DD` → iCalendar DATE (`YYYYMMDD`), or null when absent/invalid. */
export function toICalDate(raw: string): string | null {
  const trimmed = raw.trim()
  if (!DATE_RE.test(trimmed) || !parseDateParts(trimmed)) return null
  return trimmed.replaceAll('-', '')
}

/**
 * `YYYY-MM-DDTHH:mm` → iCalendar floating local DATE-TIME (`YYYYMMDDTHHmm00`),
 * or null when absent/invalid. Floating (no `Z`, no TZID) means the event lands at
 * the wall-clock time the user typed, which is what an invitation poster expects.
 */
export function toICalDateTime(raw: string): string | null {
  const trimmed = raw.trim()
  if (!DATETIME_RE.test(trimmed) || !parseDateParts(trimmed)) return null
  const hh = Number(trimmed.slice(11, 13))
  const mm = Number(trimmed.slice(14, 16))
  if (hh > 23 || mm > 59) return null
  return `${trimmed.slice(0, 10).replaceAll('-', '')}T${pad(hh, 2)}${pad(mm, 2)}00`
}

/** The day after a `YYYY-MM-DD` date, as iCalendar DATE — see the DTEND note below. */
function nextICalDate(raw: string): string | null {
  const parts = parseDateParts(raw.trim())
  if (!parts) return null
  const next = new Date(Date.UTC(parts.y, parts.m - 1, parts.d + 1))
  return `${pad(next.getUTCFullYear(), 4)}${pad(next.getUTCMonth() + 1, 2)}${pad(next.getUTCDate(), 2)}`
}

/**
 * True only when both ends are present, well-formed, and the end precedes the start.
 * An equal end is allowed: a zero-duration reminder when timed, a one-day event when
 * all-day. Incomplete or malformed fields are "not yet an error", matching how the
 * other modes stay quiet until the user has actually said something contradictory.
 * Both native input formats are fixed-width ISO prefixes, so string order is date order.
 */
export function isEndBeforeStart(config: VEventConfig): boolean {
  const re = config.allDay ? DATE_RE : DATETIME_RE
  const start = config.start.trim()
  const end = config.end.trim()
  if (!re.test(start) || !re.test(end)) return false
  return end < start
}

/**
 * Length the payload will have once the form is complete, usable while it is
 * still incomplete: a long description typed before the title should trigger
 * the size warning immediately, not the moment the title lands. Falls back to
 * placeholder required fields (same encoded length) when the real payload is
 * incoherent; the optional end is dropped in the fallback, a small
 * underestimate that never hides a genuinely long payload.
 */
export function veventDraftLength(config: VEventConfig): number {
  const real = buildVEventString(config)
  if (real) return real.length
  return buildVEventString({
    ...config,
    summary: config.summary.trim() || 'x',
    start: config.allDay ? '2000-01-01' : '2000-01-01T00:00',
    end: '',
  }).length
}

/** Extracts the `HH:mm` portion of a timed value, or null for date-only/empty input. */
export function timePartOf(raw: string): string | null {
  const trimmed = raw.trim()
  return DATETIME_RE.test(trimmed) ? trimmed.slice(11) : null
}

/** Drops the time portion when switching to all-day, keeping the chosen day. */
export function toAllDayValue(raw: string): string {
  const trimmed = raw.trim()
  if (DATE_RE.test(trimmed)) return trimmed
  if (DATETIME_RE.test(trimmed)) return trimmed.slice(0, 10)
  return ''
}

/**
 * Restores a usable timed value when switching back from all-day: the chosen day
 * survives and gets a default time the user can immediately edit, instead of the
 * field blanking out and losing their date.
 */
export function toTimedValue(raw: string, defaultTime: string): string {
  const trimmed = raw.trim()
  if (DATETIME_RE.test(trimmed)) return trimmed
  if (DATE_RE.test(trimmed)) return `${trimmed}T${defaultTime}`
  return ''
}

/**
 * Builds an iCalendar event (RFC 5545) that camera apps offer to add to the calendar.
 * Returns '' until the payload is coherent — title plus a valid start, and no end
 * before the start — so an in-progress form behaves exactly like an empty text field.
 *
 * Encoding choices, all in favor of scanner compatibility and payload size:
 * - Full VCALENDAR wrapper: bare VEVENT blocks trip up some scanners (notably iOS).
 * - No PRODID/UID and no 75-octet line folding: scanners don't require them, and
 *   every byte saved keeps the QR matrix sparser and easier to scan.
 * - All-day DTEND is exclusive per the RFC, so the user's inclusive "Ends" date is
 *   emitted as the following day; with no explicit end it's omitted entirely
 *   (the RFC default of one day is what a single-day event wants anyway).
 */
export function buildVEventString(config: VEventConfig): string {
  const summary = config.summary.trim()
  if (!summary) return ''
  if (isEndBeforeStart(config)) return ''

  const dates: string[] = []
  if (config.allDay) {
    const start = toICalDate(config.start)
    if (!start) return ''
    dates.push(`DTSTART;VALUE=DATE:${start}`)
    if (config.end.trim() !== '') {
      const end = nextICalDate(config.end)
      if (!end) return ''
      dates.push(`DTEND;VALUE=DATE:${end}`)
    }
  } else {
    const start = toICalDateTime(config.start)
    if (!start) return ''
    dates.push(`DTSTART:${start}`)
    if (config.end.trim() !== '') {
      const end = toICalDateTime(config.end)
      if (!end) return ''
      dates.push(`DTEND:${end}`)
    }
  }

  const fields = [`SUMMARY:${escapeICalText(summary)}`, ...dates]
  const location = config.location.trim()
  if (location) fields.push(`LOCATION:${escapeICalText(location)}`)
  const description = config.description.trim()
  if (description) fields.push(`DESCRIPTION:${escapeICalText(description)}`)

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    ...fields,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}
