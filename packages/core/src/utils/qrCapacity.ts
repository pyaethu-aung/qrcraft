import type { QRErrorCorrectionLevel } from '../types/qr'

/**
 * Maximum byte-mode payload a single QR code holds at version 40 (the largest
 * symbol), per error-correction level. Byte mode is what the generator uses for
 * free text and URLs, so these are the binding limits the content field counts
 * against. Higher correction levels reserve more of the symbol for recovery
 * data, leaving less room for content — hence the descending capacities.
 */
export const QR_BYTE_CAPACITY: Record<QRErrorCorrectionLevel, number> = {
  L: 2953,
  M: 2331,
  Q: 1663,
  H: 1273,
}

/** At or above this fraction of capacity the counter warns (amber) before the hard limit. */
export const CAPACITY_NEAR_LIMIT_RATIO = 0.9

export interface CapacityStatus {
  /** UTF-8 byte length of the content — what the QR symbol actually has to encode. */
  used: number
  /** Byte-mode capacity for the active error-correction level. */
  max: number
  /** used / max, unclamped (exceeds 1 once over capacity). */
  ratio: number
  /** Within the warning band but still encodable. */
  isNearLimit: boolean
  /** Past capacity — a QR code can no longer be generated until content is trimmed. */
  isOverLimit: boolean
}

const textEncoder = new TextEncoder()

/**
 * Bytes the content occupies in a QR byte-mode payload. A single character can
 * cost several bytes (emoji, accented letters), so this is measured in UTF-8
 * bytes rather than JS string length — the count the capacity limit is about.
 */
export function contentByteLength(value: string): number {
  return textEncoder.encode(value).length
}

/** Counter state for `value` at the given error-correction level. */
export function getCapacityStatus(
  value: string,
  ecLevel: QRErrorCorrectionLevel,
): CapacityStatus {
  const used = contentByteLength(value)
  const max = QR_BYTE_CAPACITY[ecLevel]
  const ratio = max === 0 ? 0 : used / max
  return {
    used,
    max,
    ratio,
    isNearLimit: ratio >= CAPACITY_NEAR_LIMIT_RATIO && used <= max,
    isOverLimit: used > max,
  }
}
