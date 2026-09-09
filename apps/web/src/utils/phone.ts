// Loose phone shape: optional leading +, then at least three of digit / space /
// hyphen / parens / dot. Deliberately permissive — number formats vary by country
// and the goal is to reject obvious garbage, not to enforce E.164.
export const PHONE_REGEX = /^\+?(?=.*\d)[\d\s\-().]{3,}$/

/**
 * Normalizes a user-entered phone number to a leading `+` and digits only: spaces,
 * hyphens, parens, and dots are stripped, because many scanner apps and OS dial/SMS
 * intents choke on formatting characters in the number and silently fail. Returns
 * `null` for an empty or implausible number (fails PHONE_REGEX, or has no digit once
 * stripped) so callers can treat it the same as empty input.
 */
export function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed || !PHONE_REGEX.test(trimmed)) return null

  const normalized = trimmed.replace(/[^\d+]/g, '')
  if (!/\d/.test(normalized)) return null

  return normalized
}

// Below this many digits we don't show a confident "Will dial/text: …" preview — the
// permissive regex accepts short strings like "123", but previewing them as a real
// destination asserts confidence the number hasn't earned.
export const MIN_PHONE_DIGITS = 7

export interface PhoneFeedback {
  /** Normalized `+`/digits string, or null when empty/garbage. */
  normalized: string | null
  /** Whether to surface the "Will dial/text: …" confirmation (gated on MIN_PHONE_DIGITS). */
  showPreview: boolean
  /** A previewable number that lacks a leading `+` (may not reach across regions). */
  missingCountryCode: boolean
}

/**
 * Derives the phone-field feedback shared by the Phone (tel:) and SMS forms: whether to
 * confirm the encoded number and whether to nudge for a country code. Keeping this in one
 * place stops the two forms from drifting apart.
 */
export function phoneFeedback(raw: string): PhoneFeedback {
  const normalized = normalizePhone(raw)
  const digitCount = normalized ? normalized.replace(/\D/g, '').length : 0
  const showPreview = digitCount >= MIN_PHONE_DIGITS
  return {
    normalized,
    showPreview,
    missingCountryCode: showPreview && !normalized!.startsWith('+'),
  }
}
