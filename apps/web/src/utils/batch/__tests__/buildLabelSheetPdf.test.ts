import { describe, it, expect, vi, beforeEach } from 'vitest'

// A single jsPDF instance whose methods are spies, shared across the mock so we can assert
// exactly what the builder drew. getTextWidth charges 4pt/char so we can exercise truncation.
const pdf = vi.hoisted(() => ({
  setFont: vi.fn(),
  setDrawColor: vi.fn(),
  setLineWidth: vi.fn(),
  rect: vi.fn(),
  addImage: vi.fn(),
  setFontSize: vi.fn(),
  setTextColor: vi.fn(),
  getTextWidth: vi.fn((s: string) => s.length * 4),
  text: vi.fn(),
  addPage: vi.fn(),
  output: vi.fn(() => new Blob(['pdf-bytes'], { type: 'application/pdf' })),
}))

// A regular function so `new jsPDF(...)` constructs; returning an object makes `new` use it.
vi.mock('jspdf', () => ({
  jsPDF: vi.fn(function () {
    return pdf
  }),
}))
vi.mock('../../export/pngRenderer', () => ({
  renderQrPngBlob: vi.fn((value: string) =>
    Promise.resolve(new Blob([`png:${value}`], { type: 'image/png' })),
  ),
}))

import { buildLabelSheetPdf } from '../buildLabelSheetPdf'
import { renderQrPngBlob } from '../../export/pngRenderer'
import type { BatchDesign } from '../buildBatchZip'

const DESIGN: BatchDesign = {
  ecLevel: 'M',
  fgColor: '#000000',
  bgColor: '#ffffff',
  designConfig: {
    eyeFrameShape: 'Square',
    eyeCenterShape: 'Square',
    eyeFrameColor: null,
    eyeCenterColor: null,
    pixelPattern: 'Square',
    fgGradient: null,
  },
}

describe('buildLabelSheetPdf', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws when there are no values', async () => {
    await expect(
      buildLabelSheetPdf({ values: [], design: DESIGN, presetId: 'a4-3x7', captions: true }),
    ).rejects.toThrow()
  })

  it('renders one image per value into a single-page PDF blob', async () => {
    const blob = await buildLabelSheetPdf({
      values: ['a', 'b', 'c'],
      design: DESIGN,
      presetId: 'a4-3x7',
      captions: true,
    })
    expect(blob.type).toBe('application/pdf')
    expect(renderQrPngBlob).toHaveBeenCalledTimes(3)
    expect(pdf.addImage).toHaveBeenCalledTimes(3)
    // 3 values fit on one a4-3x7 page (21 cells), so no extra pages
    expect(pdf.addPage).not.toHaveBeenCalled()
  })

  it('adds a page each time the grid fills', async () => {
    // a4-2x4 holds 8 per page; 9 values spill onto a second page
    await buildLabelSheetPdf({
      values: Array.from({ length: 9 }, (_, i) => `v${i}`),
      design: DESIGN,
      presetId: 'a4-2x4',
      captions: false,
    })
    expect(pdf.addPage).toHaveBeenCalledTimes(1)
  })

  it('draws a caption per value when captions are on, and none when off', async () => {
    await buildLabelSheetPdf({
      values: ['x', 'y'],
      design: DESIGN,
      presetId: 'a4-3x7',
      captions: true,
    })
    expect(pdf.text).toHaveBeenCalledTimes(2)

    vi.clearAllMocks()
    await buildLabelSheetPdf({
      values: ['x', 'y'],
      design: DESIGN,
      presetId: 'a4-3x7',
      captions: false,
    })
    expect(pdf.text).not.toHaveBeenCalled()
  })

  it('truncates an over-wide caption with an ellipsis', async () => {
    const long = 'https://example.com/a-very-long-asset-url-that-will-not-fit-in-one-cell'
    await buildLabelSheetPdf({
      values: [long],
      design: DESIGN,
      presetId: 'a4-3x7',
      captions: true,
    })
    const drawn = pdf.text.mock.calls[0][0] as string
    expect(drawn).not.toBe(long)
    expect(drawn.endsWith('…')).toBe(true)
  })

  it('captions with captionByValue when present, falling back to the value', async () => {
    await buildLabelSheetPdf({
      values: ['WIFI:T:WPA;S:Yoma-Guest;P:pw;;', 'https://a.com'],
      design: DESIGN,
      presetId: 'a4-3x7',
      captions: true,
      captionByValue: { 'WIFI:T:WPA;S:Yoma-Guest;P:pw;;': 'Yoma-Guest' },
    })
    const drawn = pdf.text.mock.calls.map((c) => c[0] as string)
    // The Wi-Fi payload shows its SSID; the unmapped URL falls back to the value.
    expect(drawn).toEqual(['Yoma-Guest', 'https://a.com'])
  })

  it('reports 1-based progress for every value', async () => {
    const onProgress = vi.fn()
    await buildLabelSheetPdf({
      values: ['a', 'b'],
      design: DESIGN,
      presetId: 'a4-3x7',
      captions: true,
      onProgress,
    })
    expect(onProgress).toHaveBeenNthCalledWith(1, 1, 2)
    expect(onProgress).toHaveBeenNthCalledWith(2, 2, 2)
  })
})
