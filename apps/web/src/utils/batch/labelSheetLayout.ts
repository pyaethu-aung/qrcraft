/**
 * Pure geometry for the label-sheet output: page presets and the math that places each
 * QR (and its optional caption) into an even Avery-style grid. Kept free of jsPDF and the
 * canvas so it can be unit-tested directly; {@link buildLabelSheetPdf} consumes it.
 *
 * All measurements are PostScript points (1pt = 1/72 inch) so they hand straight to jsPDF
 * with `unit: 'pt'`. The origin is the page's top-left, y growing downward (jsPDF's frame).
 */

/** Portrait page sizes in points. A4 is 210x297mm; Letter is 8.5x11in. */
const PAGE_SIZES_PT = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
} as const

export type LabelPageFormat = keyof typeof PAGE_SIZES_PT
export type LabelPresetId = 'a4-3x7' | 'a4-2x4' | 'letter-3x6'

export interface LabelSheetPreset {
  id: LabelPresetId
  /**
   * Symbolic identifier shown on the pill (page name + grid dimensions). Not localized,
   * for the same reason the PNG/SVG/PDF format pills aren't: "A4" and "3x7" read the same
   * in every locale.
   */
  label: string
  page: LabelPageFormat
  columns: number
  rows: number
}

export const LABEL_SHEET_PRESETS: readonly LabelSheetPreset[] = [
  { id: 'a4-3x7', label: 'A4 · 3×7', page: 'a4', columns: 3, rows: 7 },
  { id: 'a4-2x4', label: 'A4 · 2×4', page: 'a4', columns: 2, rows: 4 },
  { id: 'letter-3x6', label: 'Letter · 3×6', page: 'letter', columns: 3, rows: 6 },
]

export const DEFAULT_LABEL_PRESET_ID: LabelPresetId = 'a4-3x7'

export function getLabelPreset(id: LabelPresetId): LabelSheetPreset {
  return LABEL_SHEET_PRESETS.find((preset) => preset.id === id) ?? LABEL_SHEET_PRESETS[0]
}

// Layout constants in points.
const PAGE_MARGIN = 36 // 0.5in printable margin
const CELL_GUTTER = 10 // space between adjacent cells
const CELL_PADDING = 8 // breathing room inside each cell
const CAPTION_HEIGHT = 9 // band reserved for the caption line
const CAPTION_GAP = 4 // gap between the QR and its caption
const CAPTION_FONT_SIZE = 7

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface SheetGeometry {
  preset: LabelSheetPreset
  pageWidth: number
  pageHeight: number
  columns: number
  rows: number
  /** Cells per page (columns x rows) — the pagination stride. */
  perPage: number
  margin: number
  gutter: number
  cellWidth: number
  cellHeight: number
}

/** Resolve a preset to concrete page and cell dimensions. */
export function computeSheetGeometry(preset: LabelSheetPreset): SheetGeometry {
  const { width: pageWidth, height: pageHeight } = PAGE_SIZES_PT[preset.page]
  const { columns, rows } = preset
  const cellWidth = (pageWidth - 2 * PAGE_MARGIN - (columns - 1) * CELL_GUTTER) / columns
  const cellHeight = (pageHeight - 2 * PAGE_MARGIN - (rows - 1) * CELL_GUTTER) / rows
  return {
    preset,
    pageWidth,
    pageHeight,
    columns,
    rows,
    perPage: columns * rows,
    margin: PAGE_MARGIN,
    gutter: CELL_GUTTER,
    cellWidth,
    cellHeight,
  }
}

/** The rect of the cell at 0-based `slot` within a page (row-major, left to right). */
export function cellRect(geometry: SheetGeometry, slot: number): Rect {
  const col = slot % geometry.columns
  const row = Math.floor(slot / geometry.columns)
  return {
    x: geometry.margin + col * (geometry.cellWidth + geometry.gutter),
    y: geometry.margin + row * (geometry.cellHeight + geometry.gutter),
    width: geometry.cellWidth,
    height: geometry.cellHeight,
  }
}

export interface CaptionPlacement {
  /** Horizontal center anchor (the caption is drawn centered). */
  x: number
  /** Text baseline. */
  y: number
  /** Usable width — the builder truncates the value to fit this. */
  width: number
  fontSize: number
}

export interface CellContent {
  /** Square QR placement, centered horizontally and aligned to the cell top. */
  qr: Rect
  /** Caption placement, or null when captions are off. */
  caption: CaptionPlacement | null
}

/**
 * Place a square QR (and optional caption) inside a cell. The QR fills the padded cell,
 * shrinking to leave room for the caption band when captions are on, and stays centered.
 */
export function placeCellContent(cell: Rect, captions: boolean): CellContent {
  const innerX = cell.x + CELL_PADDING
  const innerY = cell.y + CELL_PADDING
  const innerWidth = cell.width - 2 * CELL_PADDING
  const innerHeight = cell.height - 2 * CELL_PADDING

  const captionBand = captions ? CAPTION_HEIGHT + CAPTION_GAP : 0
  const qrSize = Math.max(0, Math.min(innerWidth, innerHeight - captionBand))
  const qrX = innerX + (innerWidth - qrSize) / 2

  const content: CellContent = {
    qr: { x: qrX, y: innerY, width: qrSize, height: qrSize },
    caption: null,
  }

  if (captions) {
    content.caption = {
      x: cell.x + cell.width / 2,
      y: innerY + qrSize + CAPTION_GAP + CAPTION_FONT_SIZE,
      width: innerWidth,
      fontSize: CAPTION_FONT_SIZE,
    }
  }

  return content
}
