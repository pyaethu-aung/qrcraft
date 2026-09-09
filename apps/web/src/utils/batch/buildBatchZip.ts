/**
 * Core of the Batch tab: renders every value to the chosen format using the same
 * headless exporters as the single-QR flow, then packs the results into one ZIP blob.
 * Pure of any React/DOM-modal concerns so it can be unit-tested directly; the only
 * browser surface it touches is the canvas inside the PNG/PDF exporters.
 */

import { zipSync } from 'fflate'
import type { QRDesignConfig, QRErrorCorrectionLevel, QRFrameConfig } from '../../types/qr'
import { QR_SIZE_DOWNLOAD } from '../../data/defaults'
import { exportSvg } from '../export/svgExporter'
import { renderQrPngBlob } from '../export/pngRenderer'
import { exportPdf } from '../export/pdfExporter'
import { batchFilename } from './batchFilename'
import { mapWithConcurrency } from '../concurrency'

export type BatchFormat = 'png' | 'svg' | 'pdf'

/** The appearance every QR in the batch shares — the user's current generator design. */
export interface BatchDesign {
  ecLevel: QRErrorCorrectionLevel
  fgColor: string
  bgColor: string
  designConfig: QRDesignConfig
  frameConfig?: QRFrameConfig
}

export interface BuildBatchZipOptions {
  values: string[]
  format: BatchFormat
  design: BatchDesign
  /** Reports progress after each code renders, 1-based, so the UI can show "N of total". */
  onProgress?: (completed: number, total: number) => void
  /** Edge length in px for the raster formats (PNG, and the image embedded in the PDF). */
  dimension?: number
  /**
   * Optional per-value filename overrides from a mapped CSV filename column. A value
   * present here names its file from the mapped cell; values absent fall back to the
   * default ordinal+slug name.
   */
  filenameByValue?: Record<string, string>
}

// Match the single-QR download size so a code looks identical whether downloaded alone or in a batch.
const DEFAULT_DIMENSION = QR_SIZE_DOWNLOAD
const PDF_DPI = 300
// Each render is an independent canvas/Image round-trip with no shared mutable state, so
// a bounded pool of concurrent renders cuts wall-clock time for large batches.
const RENDER_CONCURRENCY = 6

async function renderOne(
  value: string,
  format: BatchFormat,
  design: BatchDesign,
  dimension: number,
): Promise<Blob> {
  switch (format) {
    case 'svg':
      return exportSvg(value, {
        value,
        ecLevel: design.ecLevel,
        fgColor: design.fgColor,
        bgColor: design.bgColor,
        designConfig: design.designConfig,
        frameConfig: design.frameConfig,
      })
    case 'pdf':
      return exportPdf(value, {
        value,
        ecLevel: design.ecLevel,
        fgColor: design.fgColor,
        bgColor: design.bgColor,
        designConfig: design.designConfig,
        frameConfig: design.frameConfig,
        dimension,
        dpi: PDF_DPI,
      })
    case 'png':
    default:
      return renderQrPngBlob(value, {
        ecLevel: design.ecLevel,
        fgColor: design.fgColor,
        bgColor: design.bgColor,
        designConfig: design.designConfig,
        frameConfig: design.frameConfig,
        size: dimension,
      })
  }
}

/**
 * Render every value and return a single `application/zip` blob. Each render is an
 * independent canvas/Image round-trip, so they run with bounded concurrency rather than
 * one at a time; filenames are still assigned in original list order afterward so dedup
 * suffixes stay deterministic. Files are stored (level 0): PNG and PDF are already
 * compressed, and storing keeps zipping fast and deterministic.
 *
 * @throws if `values` is empty, or propagates the first render/zip error.
 */
export async function buildBatchZip(options: BuildBatchZipOptions): Promise<Blob> {
  const { values, format, design, onProgress, dimension = DEFAULT_DIMENSION, filenameByValue } = options

  if (values.length === 0) {
    throw new Error('Cannot build a batch with no values')
  }

  let completed = 0
  const bytesByValue = await mapWithConcurrency(values, RENDER_CONCURRENCY, async (value) => {
    const blob = await renderOne(value, format, design, dimension)
    const bytes = new Uint8Array(await blob.arrayBuffer())
    completed += 1
    onProgress?.(completed, values.length)
    return bytes
  })

  const used = new Set<string>()
  const files: Record<string, Uint8Array> = {}
  values.forEach((value, i) => {
    files[batchFilename(value, i, format, used, filenameByValue?.[value])] = bytesByValue[i]
  })

  const zipped = zipSync(files, { level: 0 })
  return new Blob([zipped], { type: 'application/zip' })
}
