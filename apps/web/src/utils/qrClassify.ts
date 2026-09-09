/**
 * The content kind a decoded QR payload represents. Drives the result chip's label and
 * the "Open" action: only `url` yields an openable https link (see getOpenableUrl).
 * `text` is the catch-all for anything that isn't a recognized structured payload.
 */
export type DecodedContentType =
  | 'url'
  | 'wifi'
  | 'vcard'
  | 'email'
  | 'sms'
  | 'tel'
  | 'geo'
  | 'vevent'
  | 'crypto'
  | 'text'

/** A scheme prefix paired with the content type it maps to, matched case-insensitively. */
const SCHEME_PREFIXES: ReadonlyArray<[prefix: string, type: DecodedContentType]> = [
  ['wifi:', 'wifi'],
  ['mailto:', 'email'],
  ['matmsg:', 'email'],
  ['smsto:', 'sms'],
  ['sms:', 'sms'],
  ['tel:', 'tel'],
  ['geo:', 'geo'],
  ['bitcoin:', 'crypto'],
  ['ethereum:', 'crypto'],
]

/**
 * Classifies a decoded QR string into a {@link DecodedContentType}. Purely lexical: it
 * inspects scheme prefixes and a couple of structured-payload markers, never the network.
 * Order matters — vCard/vEvent markers and explicit schemes are checked before the
 * generic URL test so e.g. a `mailto:` link reads as `email`, not `url`.
 */
export function classifyDecoded(raw: string): DecodedContentType {
  const trimmed = raw.trim()
  if (!trimmed) return 'text'

  const lower = trimmed.toLowerCase()

  // Structured calendar/contact payloads carry explicit BEGIN markers.
  if (lower.startsWith('begin:vcard')) return 'vcard'
  if (lower.startsWith('begin:vcalendar') || lower.startsWith('begin:vevent')) return 'vevent'

  for (const [prefix, type] of SCHEME_PREFIXES) {
    if (lower.startsWith(prefix)) return type
  }

  if (isHttpUrl(trimmed)) return 'url'

  return 'text'
}

/**
 * Returns a safe, openable URL for the decoded value, or null. Restricted to http/https
 * so the "Open" action can never launch a `javascript:`, `file:`, or other unexpected
 * scheme from an untrusted scanned code.
 */
export function getOpenableUrl(raw: string): string | null {
  const trimmed = raw.trim()
  return isHttpUrl(trimmed) ? trimmed : null
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
