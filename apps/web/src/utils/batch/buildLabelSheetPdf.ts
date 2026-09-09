/**
 * Lays a batch of QR codes onto an Avery-style label grid and returns one multi-page PDF
 * blob, the print-ready alternative to {@link buildBatchZip}'s ZIP of separate files.
 *
 * Each code renders through the same headless `renderQrPngBlob` as every other path, so a
 * label matches the single-QR preview exactly. Geometry comes from the pure
 * {@link computeSheetGeometry} module; this file only orchestrates jsPDF. jsPDF is
 * lazy-loaded (it's the heaviest export dependency) so the Batch tab stays light until a
 * sheet is actually generated.
 */

import type { BatchDesign } from './buildBatchZip'
import { renderQrPngBlob } from '../export/pngRenderer'
import {
  computeSheetGeometry,
  cellRect,
  placeCellContent,
  getLabelPreset,
  type LabelPresetId,
} from './labelSheetLayout'
import { mapWithConcurrency } from '../concurrency'

// Each render is an independent canvas/Image round-trip with no shared mutable state, so
// a bounded pool of concurrent renders cuts wall-clock time for large sheets.
const RENDER_CONCURRENCY = 6

export interface BuildLabelSheetOptions {
  values: string[]
  design: BatchDesign
  presetId: LabelPresetId
  /** Print the value beneath each code (the asset-tag caption). */
  captions: boolean
  /**
   * Optional per-value caption text (from CSV content-type mapping): a Wi-Fi label shows
   * its SSID, a contact shows the name, etc. A value absent here falls back to the value
   * itself, so the plain list and Text mode are unchanged.
   */
  captionByValue?: Record<string, string>
  /** Reports progress after each code renders, 1-based, so the UI can show "N of total". */
  onProgress?: (completed: number, total: number) => void
  /** Raster resolution per QR in px (square). Generous so labels stay crisp when printed. */
  cellPx?: number
}

// A 512px raster prints crisply at label sizes while keeping each addImage cheap.
const DEFAULT_CELL_PX = 512
// Print-artifact colors (0-255 gray), independent of the QR's own palette: a faint cut
// guide and a neutral caption that stays legible regardless of the chosen foreground.
const GUIDE_GRAY = 205
const CAPTION_GRAY = 90
const GUIDE_LINE_WIDTH = 0.5
const ELLIPSIS = '…'

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read blob'))
    reader.readAsDataURL(blob)
  })
}

/** Trim `text` with a trailing ellipsis until it fits `maxWidth` at the current font. */
function truncateToWidth(pdf: import('jspdf').jsPDF, text: string, maxWidth: number): string {
  if (pdf.getTextWidth(text) <= maxWidth) return text
  let truncated = text
  while (truncated.length > 1 && pdf.getTextWidth(truncated + ELLIPSIS) > maxWidth) {
    truncated = truncated.slice(0, -1)
  }
  return truncated + ELLIPSIS
}

/**
 * Render every value into a label-sheet PDF and return it as an `application/pdf` blob.
 * Rendering is sequential so progress stays monotonic and the shared canvas is reused
 * predictably. New pages are added each time a page fills.
 *
 * @throws if `values` is empty, or propagates the first render error.
 */
export async function buildLabelSheetPdf(options: BuildLabelSheetOptions): Promise<Blob> {
  const {
    values,
    design,
    presetId,
    captions,
    captionByValue,
    onProgress,
    cellPx = DEFAULT_CELL_PX,
  } = options

  if (values.length === 0) {
    throw new Error('Cannot build a label sheet with no values')
  }

  const { jsPDF } = await import('jspdf')
  const preset = getLabelPreset(presetId)
  const geometry = computeSheetGeometry(preset)

  // The QR render (canvas/Image round-trip) for each value is independent, so it runs
  // with bounded concurrency; the jsPDF document itself is a single mutable, page-order-
  // dependent object, so drawing into it stays a sequential pass afterward.
  let completed = 0
  const dataUrls = await mapWithConcurrency(values, RENDER_CONCURRENCY, async (value) => {
    const pngBlob = await renderQrPngBlob(value, {
      ecLevel: design.ecLevel,
      fgColor: design.fgColor,
      bgColor: design.bgColor,
      designConfig: design.designConfig,
      frameConfig: design.frameConfig,
      size: cellPx,
    })
    const dataUrl = await blobToDataUrl(pngBlob)
    completed += 1
    onProgress?.(completed, values.length)
    return dataUrl
  })

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: preset.page })
  // TODO(i18n): Helvetica has no Burmese glyphs, so a Burmese caption (e.g. a contact
  // name or event title from a CSV) prints as missing glyphs. The QR payload and the
  // on-screen UI are unaffected. Fix by embedding a Unicode font (e.g. Noto Sans Myanmar)
  // via pdf.addFont and selecting it for captions. Pre-existing; not specific to mapping.
  pdf.setFont('helvetica', 'normal')

  for (let i = 0; i < values.length; i += 1) {
    const slot = i % geometry.perPage
    if (i > 0 && slot === 0) {
      pdf.addPage(preset.page, 'portrait')
    }

    const cell = cellRect(geometry, slot)
    const content = placeCellContent(cell, captions)

    // Faint hairline guide so codes can be cut/aligned on plain paper.
    pdf.setDrawColor(GUIDE_GRAY)
    pdf.setLineWidth(GUIDE_LINE_WIDTH)
    pdf.rect(cell.x, cell.y, cell.width, cell.height)

    const value = values[i]
    if (content.qr.width > 0) {
      pdf.addImage(dataUrls[i], 'PNG', content.qr.x, content.qr.y, content.qr.width, content.qr.height)
    }

    if (content.caption) {
      pdf.setFontSize(content.caption.fontSize)
      pdf.setTextColor(CAPTION_GRAY)
      const captionText = captionByValue?.[value] ?? value
      const text = truncateToWidth(pdf, captionText, content.caption.width)
      pdf.text(text, content.caption.x, content.caption.y, { align: 'center' })
    }
  }

  return pdf.output('blob')
}
