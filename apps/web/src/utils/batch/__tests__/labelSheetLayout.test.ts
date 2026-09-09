import { describe, it, expect } from 'vitest'
import {
  LABEL_SHEET_PRESETS,
  DEFAULT_LABEL_PRESET_ID,
  getLabelPreset,
  computeSheetGeometry,
  cellRect,
  placeCellContent,
  type LabelPresetId,
} from '../labelSheetLayout'

describe('getLabelPreset', () => {
  it('resolves every known preset id', () => {
    for (const preset of LABEL_SHEET_PRESETS) {
      expect(getLabelPreset(preset.id)).toBe(preset)
    }
  })

  it('falls back to the first preset for an unknown id', () => {
    expect(getLabelPreset('nope' as LabelPresetId)).toBe(LABEL_SHEET_PRESETS[0])
  })

  it('exposes the default preset id', () => {
    expect(LABEL_SHEET_PRESETS.some((p) => p.id === DEFAULT_LABEL_PRESET_ID)).toBe(true)
  })
})

describe('computeSheetGeometry', () => {
  it('derives perPage from the grid', () => {
    const geo = computeSheetGeometry(getLabelPreset('a4-3x7'))
    expect(geo.columns).toBe(3)
    expect(geo.rows).toBe(7)
    expect(geo.perPage).toBe(21)
  })

  it('fits cells within the printable area (margins + gutters)', () => {
    const geo = computeSheetGeometry(getLabelPreset('a4-3x7'))
    const usedWidth =
      geo.columns * geo.cellWidth + (geo.columns - 1) * geo.gutter + 2 * geo.margin
    const usedHeight =
      geo.rows * geo.cellHeight + (geo.rows - 1) * geo.gutter + 2 * geo.margin
    expect(usedWidth).toBeCloseTo(geo.pageWidth, 5)
    expect(usedHeight).toBeCloseTo(geo.pageHeight, 5)
    expect(geo.cellWidth).toBeGreaterThan(0)
    expect(geo.cellHeight).toBeGreaterThan(0)
  })

  it('uses Letter dimensions for a Letter preset', () => {
    const geo = computeSheetGeometry(getLabelPreset('letter-3x6'))
    expect(geo.pageWidth).toBe(612)
    expect(geo.pageHeight).toBe(792)
    expect(geo.perPage).toBe(18)
  })
})

describe('cellRect', () => {
  const geo = computeSheetGeometry(getLabelPreset('a4-3x7'))

  it('puts the first slot at the top-left margin', () => {
    const rect = cellRect(geo, 0)
    expect(rect.x).toBe(geo.margin)
    expect(rect.y).toBe(geo.margin)
    expect(rect.width).toBeCloseTo(geo.cellWidth, 5)
    expect(rect.height).toBeCloseTo(geo.cellHeight, 5)
  })

  it('lays out row-major with gutters between cells', () => {
    // slot 1 is the next column on the same row
    expect(cellRect(geo, 1).x).toBeCloseTo(geo.margin + geo.cellWidth + geo.gutter, 5)
    expect(cellRect(geo, 1).y).toBe(geo.margin)
    // slot 3 wraps to the start of the second row (3 columns)
    expect(cellRect(geo, 3).x).toBe(geo.margin)
    expect(cellRect(geo, 3).y).toBeCloseTo(geo.margin + geo.cellHeight + geo.gutter, 5)
  })
})

describe('placeCellContent', () => {
  // Height-limited cell, as the real presets are: the QR's size is set by the available
  // height, so reserving a caption band visibly shrinks it.
  const cell = { x: 100, y: 200, width: 200, height: 160 }

  it('centers a square QR and reserves a caption band when captions are on', () => {
    const withCaption = placeCellContent(cell, true)
    const withoutCaption = placeCellContent(cell, false)

    // square
    expect(withCaption.qr.width).toBe(withCaption.qr.height)
    // horizontally centered within the cell
    expect(withCaption.qr.x + withCaption.qr.width / 2).toBeCloseTo(cell.x + cell.width / 2, 5)
    // the caption band shrinks the QR vs. the no-caption layout
    expect(withCaption.qr.width).toBeLessThan(withoutCaption.qr.width)
    expect(withCaption.caption).not.toBeNull()
    expect(withCaption.caption?.x).toBeCloseTo(cell.x + cell.width / 2, 5)
  })

  it('omits the caption placement when captions are off', () => {
    expect(placeCellContent(cell, false).caption).toBeNull()
  })

  it('never produces a negative QR size for a tiny cell', () => {
    const tiny = { x: 0, y: 0, width: 6, height: 6 }
    expect(placeCellContent(tiny, true).qr.width).toBeGreaterThanOrEqual(0)
  })
})
