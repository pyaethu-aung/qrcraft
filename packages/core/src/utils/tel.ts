import type { TelConfig } from '../types/qr'
import { normalizePhone } from './phone'

// Re-exported under the tel name so the form can validate against the same shape.
export { PHONE_REGEX as TEL_PHONE_REGEX } from './phone'

/**
 * Builds a `tel:` URI (RFC 3966) that scanner apps recognize as a dial intent, offering
 * a one-tap call. The number is normalized to a leading `+` and digits only (see
 * normalizePhone), because OS dial intents choke on formatting characters. The visible
 * input keeps the user's formatting; only the encoded payload is normalized. Returns ''
 * for an empty number or obvious garbage (see normalizePhone) so callers treat it the
 * same as an empty text field.
 */
export function buildTelString(config: TelConfig): string {
  const number = normalizePhone(config.number)
  return number ? `tel:${number}` : ''
}
