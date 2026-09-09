/**
 * Lightweight persistence for the QR appearance triple (foreground, background, error
 * correction) that isn't covered by the design/frame config stores. The single-QR
 * generator writes it as the user edits; the Batch tab reads it so every code it
 * produces inherits the look the user last configured.
 */

import type { QRErrorCorrectionLevel } from '../types/qr'
import { DEFAULT_QR_CONFIG } from '../data/defaults'
import { readJSON, writeJSON } from './safeLocalStorage'

export interface PersistedAppearance {
  fgColor: string
  bgColor: string
  ecLevel: QRErrorCorrectionLevel
  transparentBg: boolean
}

const APPEARANCE_STORAGE_KEY = 'qr-generator:appearance'
const EC_LEVELS: QRErrorCorrectionLevel[] = ['L', 'M', 'Q', 'H']
const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export function defaultAppearance(): PersistedAppearance {
  return {
    fgColor: DEFAULT_QR_CONFIG.fgColor,
    bgColor: DEFAULT_QR_CONFIG.bgColor,
    ecLevel: DEFAULT_QR_CONFIG.ecLevel,
    transparentBg: false,
  }
}

/**
 * Reads the stored appearance, validating each field against the defaults so a stale
 * or hand-edited entry can never poison state. Returns defaults when nothing valid
 * is stored.
 */
export function loadPersistedAppearance(): PersistedAppearance {
  const fallback = defaultAppearance()
  const parsed = readJSON<Partial<PersistedAppearance>>(APPEARANCE_STORAGE_KEY, {})
  return {
    fgColor:
      typeof parsed.fgColor === 'string' && HEX_COLOR_RE.test(parsed.fgColor)
        ? parsed.fgColor
        : fallback.fgColor,
    bgColor:
      typeof parsed.bgColor === 'string' && HEX_COLOR_RE.test(parsed.bgColor)
        ? parsed.bgColor
        : fallback.bgColor,
    ecLevel: EC_LEVELS.includes(parsed.ecLevel as QRErrorCorrectionLevel)
      ? (parsed.ecLevel as QRErrorCorrectionLevel)
      : fallback.ecLevel,
    transparentBg: typeof parsed.transparentBg === 'boolean' ? parsed.transparentBg : fallback.transparentBg,
  }
}

export function persistAppearance(appearance: PersistedAppearance): void {
  writeJSON(APPEARANCE_STORAGE_KEY, appearance)
}
