import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../utils/batch/buildBatchZip', () => ({
  buildBatchZip: vi.fn(() => Promise.resolve(new Blob(['zip'], { type: 'application/zip' }))),
}))
vi.mock('../../utils/batch/buildLabelSheetPdf', () => ({
  buildLabelSheetPdf: vi.fn(() =>
    Promise.resolve(new Blob(['pdf'], { type: 'application/pdf' })),
  ),
}))
vi.mock('../../utils/download', () => ({ downloadBlob: vi.fn() }))

import { useBatchGenerator } from '../useBatchGenerator'
import { buildBatchZip } from '../../utils/batch/buildBatchZip'
import { buildLabelSheetPdf } from '../../utils/batch/buildLabelSheetPdf'
import { downloadBlob } from '../../utils/download'

describe('useBatchGenerator', () => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(buildBatchZip).mockResolvedValue(new Blob(['zip'], { type: 'application/zip' }))
  })

  it('starts idle with the png format and no codes', () => {
    const { result } = renderHook(() => useBatchGenerator())
    expect(result.current.status).toBe('idle')
    expect(result.current.format).toBe('png')
    expect(result.current.values).toEqual([])
  })

  it('restores a persisted input on mount', () => {
    localStorage.setItem('qr-generator:batch:input', 'https://restored.com')
    const { result } = renderHook(() => useBatchGenerator())
    expect(result.current.input).toBe('https://restored.com')
    expect(result.current.values).toEqual(['https://restored.com'])
  })

  it('derives unique, capped values from the input', () => {
    const { result } = renderHook(() => useBatchGenerator())
    act(() => result.current.setInput('a\na\nb\n  \nc'))
    expect(result.current.values).toEqual(['a', 'b', 'c'])
    expect(result.current.total).toBe(3)
  })

  it('reports an empty error when generating with no usable input', async () => {
    const { result } = renderHook(() => useBatchGenerator())
    act(() => result.current.setInput('   '))
    await act(async () => {
      await result.current.generate()
    })
    expect(result.current.status).toBe('error')
    expect(result.current.errorCode).toBe('empty')
    expect(buildBatchZip).not.toHaveBeenCalled()
  })

  it('builds a zip and downloads it on success', async () => {
    const { result } = renderHook(() => useBatchGenerator())
    act(() => result.current.setInput('https://a.com\nhttps://b.com'))
    await act(async () => {
      await result.current.generate()
    })
    const arg = vi.mocked(buildBatchZip).mock.calls[0][0]
    expect(arg.values).toEqual(['https://a.com', 'https://b.com'])
    expect(arg.format).toBe('png')
    expect(typeof arg.design.ecLevel).toBe('string')
    expect(typeof arg.design.fgColor).toBe('string')
    expect(typeof arg.design.bgColor).toBe('string')
    expect(downloadBlob).toHaveBeenCalledTimes(1)
    expect(vi.mocked(downloadBlob).mock.calls[0][1]).toMatch(/^qr-batch-2-.*\.zip$/)
    expect(result.current.status).toBe('success')
  })

  it('defaults filename overrides to null and passes them to buildBatchZip when set', async () => {
    const { result } = renderHook(() => useBatchGenerator())
    expect(result.current.filenameOverrides).toBeNull()

    act(() => result.current.setInput('https://a.com'))
    act(() => result.current.setFilenameOverrides({ 'https://a.com': 'TRUCK-1' }))
    await act(async () => {
      await result.current.generate()
    })
    const arg = vi.mocked(buildBatchZip).mock.calls[0][0]
    expect(arg.filenameByValue).toEqual({ 'https://a.com': 'TRUCK-1' })
  })

  it('treats preparedValues as authoritative without splitting on newlines', async () => {
    const vcard = 'BEGIN:VCARD\nVERSION:3.0\nFN:Aung\nEND:VCARD'
    const { result } = renderHook(() => useBatchGenerator())
    // The textarea text must be ignored once prepared values are set.
    act(() => result.current.setInput('ignored\nlines'))
    act(() => result.current.setPreparedValues([vcard]))
    expect(result.current.values).toEqual([vcard])
    await act(async () => {
      await result.current.generate()
    })
    expect(vi.mocked(buildBatchZip).mock.calls[0][0].values).toEqual([vcard])
  })

  it('dedupes and caps preparedValues, then falls back to input when cleared', () => {
    const { result } = renderHook(() => useBatchGenerator())
    act(() => result.current.setPreparedValues(['a', 'a', 'b', '']))
    expect(result.current.values).toEqual(['a', 'b'])
    act(() => result.current.setInput('y'))
    act(() => result.current.setPreparedValues(null))
    expect(result.current.values).toEqual(['y'])
  })

  it('builds a label sheet PDF and downloads it when the labels format is chosen', async () => {
    const { result } = renderHook(() => useBatchGenerator())
    act(() => result.current.setInput('VEH-001\nVEH-002'))
    act(() => result.current.setFormat('labels'))
    act(() => result.current.setLabelPreset('letter-3x6'))
    act(() => result.current.setCaptions(false))
    await act(async () => {
      await result.current.generate()
    })
    const arg = vi.mocked(buildLabelSheetPdf).mock.calls[0][0]
    expect(arg.values).toEqual(['VEH-001', 'VEH-002'])
    expect(arg.presetId).toBe('letter-3x6')
    expect(arg.captions).toBe(false)
    expect(buildBatchZip).not.toHaveBeenCalled()
    expect(vi.mocked(downloadBlob).mock.calls[0][1]).toMatch(/^qr-labels-2-.*\.pdf$/)
    expect(result.current.status).toBe('success')
  })

  it('passes caption overrides to the label sheet as captionByValue', async () => {
    const { result } = renderHook(() => useBatchGenerator())
    act(() => result.current.setPreparedValues(['WIFI:T:WPA;S:Net;P:pw;;']))
    act(() => result.current.setCaptionOverrides({ 'WIFI:T:WPA;S:Net;P:pw;;': 'Net' }))
    act(() => result.current.setFormat('labels'))
    await act(async () => {
      await result.current.generate()
    })
    expect(vi.mocked(buildLabelSheetPdf).mock.calls[0][0].captionByValue).toEqual({
      'WIFI:T:WPA;S:Net;P:pw;;': 'Net',
    })
  })

  it('surfaces a render error when the zip build throws', async () => {
    vi.mocked(buildBatchZip).mockRejectedValueOnce(new Error('boom'))
    const { result } = renderHook(() => useBatchGenerator())
    act(() => result.current.setInput('https://a.com'))
    await act(async () => {
      await result.current.generate()
    })
    expect(result.current.status).toBe('error')
    expect(result.current.errorCode).toBe('render-failed')
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it('resets a finished run when the format changes', async () => {
    const { result } = renderHook(() => useBatchGenerator())
    act(() => result.current.setInput('https://a.com'))
    await act(async () => {
      await result.current.generate()
    })
    expect(result.current.status).toBe('success')
    act(() => result.current.setFormat('svg'))
    expect(result.current.status).toBe('idle')
    expect(result.current.format).toBe('svg')
  })
})
