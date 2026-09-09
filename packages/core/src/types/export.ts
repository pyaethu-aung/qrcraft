/**
 * Export-related TypeScript types for the High-Resolution Export Suite.
 *
 * @why Using Discriminated Unions for ExportAction enables exhaustive type
 * checking in the reducer and clear action handling patterns.
 */

// ============================================================================
// Format Types
// ============================================================================

export type ExportFormat = 'png' | 'svg' | 'pdf'

export interface FormatConfig {
  format: ExportFormat
  mimeType: string
  extension: string
  supportsTransparency: boolean
}

/**
 * Format configurations with metadata for each export type.
 * @why Centralizing format metadata ensures consistency across export utilities.
 */
export const FORMAT_CONFIGS: Record<ExportFormat, FormatConfig> = {
  png: {
    format: 'png',
    mimeType: 'image/png',
    extension: '.png',
    supportsTransparency: true,
  },
  svg: {
    format: 'svg',
    mimeType: 'image/svg+xml',
    extension: '.svg',
    supportsTransparency: true,
  },
  pdf: {
    format: 'pdf',
    mimeType: 'application/pdf',
    extension: '.pdf',
    supportsTransparency: false,
  },
}

// ============================================================================
// Dimension Types
// ============================================================================

export type DimensionPreset = 500 | 1000 | 2000
export type DpiPreset = 72 | 150 | 300

export interface DimensionConfig {
  value: DimensionPreset
  label: string
  description: string
}

/**
 * Preset dimension options for raster exports.
 * @why Using presets simplifies UI and prevents edge cases from custom input.
 */
export const DIMENSION_PRESETS: DimensionConfig[] = [
  { value: 500, label: '500px', description: 'Web / Social Media' },
  { value: 1000, label: '1000px', description: 'Standard' },
  { value: 2000, label: '2000px', description: 'Print / High-Res' },
]

export interface DpiConfig {
  value: DpiPreset
  label: string
  description: string
}

/**
 * DPI presets for print-quality exports.
 * @why Standard DPI values match common print and screen requirements.
 */
export const DPI_PRESETS: DpiConfig[] = [
  { value: 72, label: '72 DPI', description: 'Screen' },
  { value: 150, label: '150 DPI', description: 'Standard Print' },
  { value: 300, label: '300 DPI', description: 'High-Quality Print' },
]

// ============================================================================
// State Types
// ============================================================================

export interface ExportState {
  isOpen: boolean
  format: ExportFormat
  dimension: DimensionPreset
  dpi: DpiPreset
  isExporting: boolean
  error: string | null
  progress: number // 0-100 for progress indicator
}

/**
 * Export actions using Discriminated Unions for type-safe reducer handling.
 * @why Discriminated Unions enable exhaustive switch statements and
 * TypeScript can narrow the payload type based on the action type.
 */
export type ExportAction =
  | { type: 'OPEN_MODAL' }
  | { type: 'CLOSE_MODAL' }
  | { type: 'SET_FORMAT'; payload: ExportFormat }
  | { type: 'SET_DIMENSION'; payload: DimensionPreset }
  | { type: 'SET_DPI'; payload: DpiPreset }
  | { type: 'START_EXPORT' }
  | { type: 'EXPORT_PROGRESS'; payload: number }
  | { type: 'EXPORT_SUCCESS' }
  | { type: 'EXPORT_ERROR'; payload: string }
  | { type: 'RESET' }

/**
 * Initial state for the export reducer.
 * @why PNG is the default format as it's the most universally used.
 */
export const INITIAL_EXPORT_STATE: ExportState = {
  isOpen: false,
  format: 'png',
  dimension: 1000,
  dpi: 72,
  isExporting: false,
  error: null,
  progress: 0,
}

// ============================================================================
// Payload Types
// ============================================================================

export interface ExportPayload {
  blob: Blob
  filename: string
  format: ExportFormat
  dimensions: {
    width: number
    height: number
  }
  metadata: {
    createdAt: string
    dpi?: number
  }
}

/**
 * Configuration passed to export utilities.
 */
export interface ExportConfig {
  format: ExportFormat
  dimension: DimensionPreset
  dpi: DpiPreset
  fgColor: string
  bgColor: string
  value: string
}
