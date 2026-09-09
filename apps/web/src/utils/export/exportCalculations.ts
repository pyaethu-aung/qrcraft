/**
 * Pure utility functions for export calculations.
 *
 * @why Pure functions enable comprehensive unit testing and are easily
 * reusable across different export format implementations.
 */

import type { DimensionPreset, DpiPreset, ExportFormat } from '../../types/export'
import { FORMAT_CONFIGS } from '../../types/export'

/**
 * Calculate canvas scale factor for target dimension.
 *
 * @why Uses integer scaling to avoid sub-pixel artifacts in exported images.
 * @param sourceSize - Current canvas size in pixels
 * @param targetDimension - Target export dimension in pixels
 * @returns Integer scale factor (minimum 1)
 */
export function calculateScaleFactor(
  sourceSize: number,
  targetDimension: DimensionPreset,
): number {
  if (sourceSize <= 0) {
    return 1
  }
  return Math.max(1, Math.ceil(targetDimension / sourceSize))
}

/**
 * Convert dimension and DPI to PDF page size in points.
 *
 * @why PDF uses points (1/72 inch) as the unit. DPI affects physical print size.
 * A 1000px image at 300 DPI = 1000/300 = 3.33 inches = 240 points.
 * @param dimension - Pixel dimension of the QR code
 * @param dpi - Dots per inch for print quality
 * @returns Page size in points (1 point = 1/72 inch)
 */
export function dpiToPageSize(dimension: DimensionPreset, dpi: DpiPreset): number {
  const inches = dimension / dpi
  const points = inches * 72
  return Math.round(points * 100) / 100 // Round to 2 decimal places
}

/**
 * Generate a filename for the exported QR code.
 *
 * @why Consistent naming convention with timestamp, dimension, and DPI ensures unique filenames
 * and makes it clear what format and quality the file is.
 * @param format - Export format (png, svg, pdf)
 * @param prefix - Optional prefix for the filename (default: 'qrcode')
 * @param dimension - Optional dimension in pixels (included for PNG/PDF)
 * @param dpi - Optional DPI setting (included for PDF only)
 * @returns Filename with appropriate extension and metadata
 * 
 * @example
 * generateFilename('png', 'qrcode', 1000)        // qrcode-1000px_2024-02-07T12-30-45.png
 * generateFilename('svg', 'qrcode')              // qrcode_2024-02-07T12-30-45.svg
 * generateFilename('pdf', 'qrcode', 2000, 300)   // qrcode-2000px-300dpi_2024-02-07T12-30-45.pdf
 */
export function generateFilename(
  format: ExportFormat,
  prefix: string = 'qrcode',
  dimension?: number,
  dpi?: number,
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const extension = FORMAT_CONFIGS[format].extension

  // Build filename with dimension and DPI metadata
  let filename = prefix

  // Add dimension for PNG and PDF (SVG is resolution-independent)
  if (dimension && (format === 'png' || format === 'pdf')) {
    filename += `-${dimension}px`
  }

  // Add DPI for PDF only
  if (dpi && format === 'pdf') {
    filename += `-${dpi}dpi`
  }

  return `${filename}_${timestamp}${extension}`
}

/**
 * Validate that a dimension is within acceptable range.
 *
 * @why Prevents memory issues from extremely large exports. Max 4000px per spec.
 * @param dimension - Dimension to validate
 * @returns true if dimension is valid (between 100 and 4000)
 */
export function isValidDimension(dimension: number): boolean {
  return dimension >= 100 && dimension <= 4000
}

/**
 * Calculate the actual export dimensions based on format and config.
 *
 * @why SVG dimensions are specified in the viewBox, PNG uses pixel dimensions,
 * and PDF uses points calculated from DPI.
 * @param format - Export format
 * @param dimension -Base dimension in pixels
 * @param dpi - DPI setting (only affects PDF)
 * @returns Object with width and height in appropriate units
 */
export function calculateExportDimensions(
  format: ExportFormat,
  dimension: DimensionPreset,
  dpi: DpiPreset,
): { width: number; height: number; unit: string } {
  switch (format) {
    case 'png':
      return { width: dimension, height: dimension, unit: 'px' }
    case 'svg':
      return { width: dimension, height: dimension, unit: 'px' }
    case 'pdf': {
      const pageSize = dpiToPageSize(dimension, dpi)
      return { width: pageSize, height: pageSize, unit: 'pt' }
    }
    default:
      return { width: dimension, height: dimension, unit: 'px' }
  }
}
