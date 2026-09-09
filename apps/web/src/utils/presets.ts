import type {
  QRDesignConfig,
  QRFrameConfig,
  QRErrorCorrectionLevel,
  QREyeFrameShape,
  QREyeCenterShape,
  QRPixelPattern,
  QRGradient,
  QRGradientType,
  QRGradientDirection,
  QRFrameStyle,
  QRFramePosition,
} from '../types/qr'
import { readJSON, writeJSON, removeItem } from './safeLocalStorage'

export interface PresetEntry {
  id: string
  savedAt: number
  name: string
  fgColor: string
  bgColor: string
  transparentBg: boolean
  ecLevel: QRErrorCorrectionLevel
  designConfig: QRDesignConfig
  frameConfig: QRFrameConfig
}

export type NewPresetEntry = Omit<PresetEntry, 'id' | 'savedAt'>

const PRESETS_KEY = 'qr-generator:presets'
export const PRESETS_MAX = 10
export const PRESET_NAME_MAX = 32

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
const EC_LEVELS: readonly QRErrorCorrectionLevel[] = ['L', 'M', 'Q', 'H']
const EYE_FRAME_SHAPES: readonly QREyeFrameShape[] = ['Square', 'Rounded', 'Circle', 'Leaf', 'Hexagon', 'SquareRound', 'RoundSquare', 'Diamond']
const EYE_CENTER_SHAPES: readonly QREyeCenterShape[] = ['Square', 'Rounded', 'Dot', 'Diamond', 'Star', 'Cross']
const PIXEL_PATTERNS: readonly QRPixelPattern[] = ['Square', 'Dots', 'Rounded', 'Diamond', 'Vertical', 'Classy', 'Fluid', 'Horizontal']
const GRADIENT_TYPES: readonly QRGradientType[] = ['linear', 'radial']
const GRADIENT_DIRS: readonly QRGradientDirection[] = ['to-t', 'to-tr', 'to-r', 'to-br', 'to-b', 'to-bl', 'to-l', 'to-tl']
const FRAME_STYLES: readonly QRFrameStyle[] = ['None', 'Banner', 'Card', 'Ticket', 'Label', 'Bubble', 'Ticks', 'Photo', 'Circle']
const FRAME_POSITIONS: readonly QRFramePosition[] = ['top', 'bottom']
const FRAME_TEXT_MAX = 24

function validGradient(raw: unknown): QRGradient | null {
  if (!raw || typeof raw !== 'object') return null
  const g = raw as Partial<QRGradient>
  if (!GRADIENT_TYPES.includes(g.type as QRGradientType)) return null
  if (typeof g.from !== 'string' || !HEX_RE.test(g.from)) return null
  if (typeof g.to !== 'string' || !HEX_RE.test(g.to)) return null
  return {
    type: g.type as QRGradientType,
    from: g.from,
    to: g.to,
    direction: GRADIENT_DIRS.includes(g.direction as QRGradientDirection) ? (g.direction as QRGradientDirection) : 'to-br',
  }
}

function validDesignConfig(raw: unknown): QRDesignConfig | null {
  if (!raw || typeof raw !== 'object') return null
  const d = raw as Partial<QRDesignConfig>
  if (!EYE_FRAME_SHAPES.includes(d.eyeFrameShape as QREyeFrameShape)) return null
  if (!EYE_CENTER_SHAPES.includes(d.eyeCenterShape as QREyeCenterShape)) return null
  if (!PIXEL_PATTERNS.includes(d.pixelPattern as QRPixelPattern)) return null
  return {
    eyeFrameShape: d.eyeFrameShape as QREyeFrameShape,
    eyeCenterShape: d.eyeCenterShape as QREyeCenterShape,
    eyeFrameColor: typeof d.eyeFrameColor === 'string' && HEX_RE.test(d.eyeFrameColor) ? d.eyeFrameColor : null,
    eyeCenterColor: typeof d.eyeCenterColor === 'string' && HEX_RE.test(d.eyeCenterColor) ? d.eyeCenterColor : null,
    pixelPattern: d.pixelPattern as QRPixelPattern,
    fgGradient: validGradient(d.fgGradient),
  }
}

function validFrameConfig(raw: unknown): QRFrameConfig | null {
  if (!raw || typeof raw !== 'object') return null
  const f = raw as Partial<QRFrameConfig>
  if (!FRAME_STYLES.includes(f.style as QRFrameStyle)) return null
  return {
    style: f.style as QRFrameStyle,
    text: typeof f.text === 'string' ? f.text.slice(0, FRAME_TEXT_MAX) : '',
    color: typeof f.color === 'string' && HEX_RE.test(f.color) ? f.color : '#000000',
    position: FRAME_POSITIONS.includes(f.position as QRFramePosition) ? (f.position as QRFramePosition) : 'bottom',
  }
}

function isValidPreset(e: unknown): e is PresetEntry {
  if (!e || typeof e !== 'object') return false
  const p = e as Partial<PresetEntry>
  if (typeof p.id !== 'string') return false
  if (typeof p.savedAt !== 'number') return false
  if (typeof p.name !== 'string' || p.name.length === 0) return false
  if (typeof p.fgColor !== 'string' || !HEX_RE.test(p.fgColor)) return false
  if (typeof p.bgColor !== 'string' || !HEX_RE.test(p.bgColor)) return false
  if (typeof p.transparentBg !== 'boolean') return false
  if (!EC_LEVELS.includes(p.ecLevel as QRErrorCorrectionLevel)) return false
  if (!validDesignConfig(p.designConfig)) return false
  if (!validFrameConfig(p.frameConfig)) return false
  return true
}

export function loadPresets(): PresetEntry[] {
  const parsed = readJSON<unknown>(PRESETS_KEY, [])
  if (!Array.isArray(parsed)) return []
  return parsed.filter(isValidPreset)
}

export function savePreset(entry: NewPresetEntry): PresetEntry[] {
  const name = entry.name.trim().slice(0, PRESET_NAME_MAX)
  if (!name) return loadPresets()
  const newEntry: PresetEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    savedAt: Date.now(),
    name,
    fgColor: entry.fgColor,
    bgColor: entry.bgColor,
    transparentBg: entry.transparentBg,
    ecLevel: entry.ecLevel,
    designConfig: entry.designConfig,
    frameConfig: entry.frameConfig,
  }
  const updated = [newEntry, ...loadPresets()].slice(0, PRESETS_MAX)
  writeJSON(PRESETS_KEY, updated)
  return updated
}

export function deletePreset(id: string): PresetEntry[] {
  const updated = loadPresets().filter(p => p.id !== id)
  writeJSON(PRESETS_KEY, updated)
  return updated
}

export function clearPresets(): void {
  removeItem(PRESETS_KEY)
}
