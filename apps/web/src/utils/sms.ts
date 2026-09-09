import type { SmsConfig } from '../types/qr'
import { normalizePhone } from './phone'

// Re-exported under the SMS name so existing importers (SmsForm, tests) keep working.
export { PHONE_REGEX as SMS_PHONE_REGEX } from './phone'

/**
 * Builds an `SMSTO:number:message` payload — the de-facto QR convention (zxing) that
 * dedicated scanner apps recognize as a send-SMS intent, pre-filling the messaging app.
 * The number is normalized to a leading `+` and digits only (see normalizePhone). The
 * visible input keeps the user's formatting; only the encoded payload is normalized.
 * SMSTO is a plain colon-delimited format, not a URI, so the message is not
 * percent-encoded. Returns '' for an empty or implausible number so callers treat it
 * the same as an empty text field.
 */
export function buildSmsString(config: SmsConfig): string {
  const number = normalizePhone(config.number)
  if (!number) return ''

  const message = config.message.trim()
  return message ? `SMSTO:${number}:${message}` : `SMSTO:${number}`
}
