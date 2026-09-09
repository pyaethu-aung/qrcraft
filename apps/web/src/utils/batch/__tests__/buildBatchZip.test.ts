import { describe, it, expect, vi, beforeEach } from 'vitest'
import { unzipSync, strFromU8 } from 'fflate'

vi.mock('../../export/pngRenderer', () => ({
  renderQrPngBlob: vi.fn((value: string) => Promise.resolve(new Blob([`png:${value}`], { type: 'image/png' }))),
}))
vi.mock('../../export/svgExporter', () => ({
  exportSvg: vi.fn((value: string) => Promise.resolve(new Blob([`svg:${value}`], { type: 'image/svg+xml' }))),
}))
vi.mock('../../export/pdfExporter', () => ({
  exportPdf: vi.fn((value: string) => Promise.resolve(new Blob([`pdf:${value}`], { type: 'application/pdf' }))),
}))

import { buildBatchZip, type BatchDesign } from '../buildBatchZip'
import { renderQrPngBlob } from '../../export/pngRenderer'
import { exportSvg } from '../../export/svgExporter'
import { exportPdf } from '../../export/pdfExporter'

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

async function entriesOf(blob: Blob): Promise<Record<string, string>> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  const unzipped: Record<string, Uint8Array> = unzipSync(bytes)
  const out: Record<string, string> = {}
  for (const name of Object.keys(unzipped)) out[name] = strFromU8(unzipped[name])
  return out
}

describe('buildBatchZip', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws when there are no values', async () => {
    await expect(buildBatchZip({ values: [], format: 'png', design: DESIGN })).rejects.toThrow()
  })

  it('renders each PNG value into an ordered, named zip', async () => {
    const blob = await buildBatchZip({
      values: ['https://a.com', 'https://b.com'],
      format: 'png',
      design: DESIGN,
    })
    expect(blob.type).toBe('application/zip')
    const entries = await entriesOf(blob)
    expect(Object.keys(entries).sort()).toEqual(['001-a-com.png', '002-b-com.png'])
    expect(entries['001-a-com.png']).toBe('png:https://a.com')
    expect(renderQrPngBlob).toHaveBeenCalledTimes(2)
  })

  it('reports monotonic progress for every value', async () => {
    const onProgress = vi.fn()
    await buildBatchZip({
      values: ['a', 'b', 'c'],
      format: 'png',
      design: DESIGN,
      onProgress,
    })
    expect(onProgress.mock.calls).toEqual([
      [1, 3],
      [2, 3],
      [3, 3],
    ])
  })

  it('names files from a per-value filename map, falling back to the slug when unmapped', async () => {
    const blob = await buildBatchZip({
      values: ['https://a.com', 'https://b.com'],
      format: 'png',
      design: DESIGN,
      filenameByValue: { 'https://a.com': 'TRUCK-1' },
    })
    const entries = await entriesOf(blob)
    // First value uses the mapped name (no ordinal); the unmapped value keeps the default.
    expect(Object.keys(entries).sort()).toEqual(['002-b-com.png', 'truck-1.png'])
    expect(entries['truck-1.png']).toBe('png:https://a.com')
  })

  it('routes svg format through the svg exporter', async () => {
    const blob = await buildBatchZip({ values: ['x'], format: 'svg', design: DESIGN })
    const entries = await entriesOf(blob)
    expect(Object.keys(entries)).toEqual(['001-x.svg'])
    expect(exportSvg).toHaveBeenCalledTimes(1)
    expect(renderQrPngBlob).not.toHaveBeenCalled()
  })

  it('routes pdf format through the pdf exporter with a dimension and dpi', async () => {
    const blob = await buildBatchZip({ values: ['x'], format: 'pdf', design: DESIGN, dimension: 1200 })
    const entries = await entriesOf(blob)
    expect(Object.keys(entries)).toEqual(['001-x.pdf'])
    const [value, pdfConfig] = vi.mocked(exportPdf).mock.calls[0]
    expect(value).toBe('x')
    expect(pdfConfig.dimension).toBe(1200)
    expect(typeof pdfConfig.dpi).toBe('number')
  })
})
