/**
 * Readers for the persisted design and frame configs (localStorage). Extracted from
 * useQRDesign so both the single-QR generator and the Batch tab hydrate from one source
 * of truth: a code generated in batch matches what the generator preview showed.
 */

import type {
  QRDesignConfig,
  QREyeShape,
  QREyeFrameShape,
  QREyeCenterShape,
  QRGradient,
  QRGradientType,
  QRGradientDirection,
  QRFrameConfig,
  QRFrameStyle,
} from '../types/qr'
import { DEFAULT_FRAME_COLOR } from '../data/defaults'
import { readJSON } from './safeLocalStorage'

export const DESIGN_STORAGE_KEY = 'qr-generator-design-config'
export const FRAME_STORAGE_KEY = 'qr-generator-frame-config'
export const FRAME_TEXT_LIMIT = 24

const FRAME_STYLES: QRFrameStyle[] = ['None', 'Banner', 'Card', 'Ticket', 'Label', 'Bubble', 'Ticks', 'Photo', 'Circle']
const GRADIENT_TYPES: QRGradientType[] = ['linear', 'radial']
const GRADIENT_DIRECTIONS: QRGradientDirection[] = ['to-t', 'to-tr', 'to-r', 'to-br', 'to-b', 'to-bl', 'to-l', 'to-tl']
const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export const DEFAULT_DESIGN_CONFIG: QRDesignConfig = {
  eyeFrameShape: 'Square',
  eyeCenterShape: 'Square',
  eyeFrameColor: null,
  eyeCenterColor: null,
  pixelPattern: 'Square',
  fgGradient: null,
}

export const DEFAULT_FRAME_CONFIG: QRFrameConfig = {
  style: 'None',
  text: 'SCAN ME',
  color: DEFAULT_FRAME_COLOR,
  position: 'bottom',
}

// Maps the legacy single `eyeShape` to the split frame/center shapes.
const LEGACY_EYE_SHAPE_MAP: Record<QREyeShape, { frame: QREyeFrameShape; center: QREyeCenterShape }> = {
  Square: { frame: 'Square', center: 'Square' },
  Rounded: { frame: 'Rounded', center: 'Rounded' },
  Leaf: { frame: 'Leaf', center: 'Square' },
  Hexagon: { frame: 'Hexagon', center: 'Square' },
  Diamond: { frame: 'Square', center: 'Diamond' },
}

/** Validates a persisted gradient, returning null (solid foreground) for anything malformed. */
function loadGradient(raw: unknown): QRGradient | null {
  if (!raw || typeof raw !== 'object') return null
  const g = raw as Partial<QRGradient>
  if (!GRADIENT_TYPES.includes(g.type as QRGradientType)) return null
  if (typeof g.from !== 'string' || !HEX_COLOR_RE.test(g.from)) return null
  if (typeof g.to !== 'string' || !HEX_COLOR_RE.test(g.to)) return null
  return {
    type: g.type as QRGradientType,
    from: g.from,
    to: g.to,
    direction: GRADIENT_DIRECTIONS.includes(g.direction as QRGradientDirection) ? (g.direction as QRGradientDirection) : 'to-br',
  }
}

/**
 * Reads the stored design config, migrating the pre-split `{ eyeShape }` shape into the
 * new `{ eyeFrameShape, eyeCenterShape, eyeFrameColor, eyeCenterColor }` model. Returns
 * the default config when nothing valid is stored.
 */
export function loadDesignConfig(): QRDesignConfig {
  const parsed = readJSON<(Partial<QRDesignConfig> & { eyeShape?: QREyeShape }) | null>(DESIGN_STORAGE_KEY, null)
  if (!parsed) return DEFAULT_DESIGN_CONFIG

  // Legacy shape present and not yet migrated → split it.
  if (parsed.eyeShape && !parsed.eyeFrameShape) {
    const mapped = LEGACY_EYE_SHAPE_MAP[parsed.eyeShape] ?? LEGACY_EYE_SHAPE_MAP.Square
    return {
      eyeFrameShape: mapped.frame,
      eyeCenterShape: mapped.center,
      eyeFrameColor: null,
      eyeCenterColor: null,
      pixelPattern: parsed.pixelPattern ?? 'Square',
      fgGradient: loadGradient(parsed.fgGradient),
    }
  }

  return {
    eyeFrameShape: parsed.eyeFrameShape ?? DEFAULT_DESIGN_CONFIG.eyeFrameShape,
    eyeCenterShape: parsed.eyeCenterShape ?? DEFAULT_DESIGN_CONFIG.eyeCenterShape,
    eyeFrameColor: parsed.eyeFrameColor ?? null,
    eyeCenterColor: parsed.eyeCenterColor ?? null,
    pixelPattern: parsed.pixelPattern ?? DEFAULT_DESIGN_CONFIG.pixelPattern,
    fgGradient: loadGradient(parsed.fgGradient),
  }
}

export function loadFrameConfig(): QRFrameConfig {
  const parsed = readJSON<Partial<QRFrameConfig> | null>(FRAME_STORAGE_KEY, null)
  if (!parsed) return DEFAULT_FRAME_CONFIG
  return {
    style: FRAME_STYLES.includes(parsed.style as QRFrameStyle) ? (parsed.style as QRFrameStyle) : DEFAULT_FRAME_CONFIG.style,
    text: typeof parsed.text === 'string' ? parsed.text.slice(0, FRAME_TEXT_LIMIT) : DEFAULT_FRAME_CONFIG.text,
    color: typeof parsed.color === 'string' ? parsed.color : DEFAULT_FRAME_CONFIG.color,
    position: parsed.position === 'top' ? 'top' : 'bottom',
  }
}
