/**
 * State for the Batch tab: the pasted input, the chosen format, and the run lifecycle
 * (idle → generating → success | error) with per-code progress. On generate it reads the
 * user's current persisted design (appearance + design + frame) so every code matches the
 * single-QR preview, builds one ZIP, and triggers the download.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { downloadBlob } from '../utils/download'
import { parseBatchInput, dedupeAndCap, BATCH_MAX_LINES } from '../utils/batch/parseBatchInput'
import { buildBatchZip, type BatchFormat, type BatchDesign } from '../utils/batch/buildBatchZip'
import { buildLabelSheetPdf } from '../utils/batch/buildLabelSheetPdf'
import {
  DEFAULT_LABEL_PRESET_ID,
  type LabelPresetId,
} from '../utils/batch/labelSheetLayout'
import { loadPersistedAppearance } from '../utils/persistedAppearance'
import { loadDesignConfig, loadFrameConfig } from '../utils/persistedDesign'
import { readRaw, writeRaw } from '../utils/safeLocalStorage'

// The tab mounts on demand (so it re-reads the latest design each time it opens), which
// would otherwise drop a long pasted list on a tab switch. Persist the input so it survives.
const BATCH_INPUT_KEY = 'qr-generator:batch:input'

export type BatchStatus = 'idle' | 'generating' | 'success' | 'error'
export type BatchErrorCode = 'empty' | 'render-failed'

/** The chosen output: a ZIP of files (png/svg/pdf) or a single label-sheet PDF. */
export type BatchOutput = BatchFormat | 'labels'

export interface BatchProgress {
  completed: number
  total: number
}

export interface UseBatchGeneratorReturn {
  input: string
  setInput: (value: string) => void
  format: BatchOutput
  setFormat: (format: BatchOutput) => void
  /** Label-sheet layout, only meaningful when `format` is `'labels'`. */
  labelPreset: LabelPresetId
  setLabelPreset: (preset: LabelPresetId) => void
  /** Whether label cells print the value caption; only meaningful for `'labels'`. */
  captions: boolean
  setCaptions: (captions: boolean) => void
  /**
   * Per-value filename overrides from a mapped CSV filename column, or `null` when no
   * mapping is active. Only applied to the ZIP formats (the Labels output is one file).
   */
  filenameOverrides: Record<string, string> | null
  setFilenameOverrides: (overrides: Record<string, string> | null) => void
  /**
   * Per-value Labels-sheet caption overrides from CSV content-type mapping (a Wi-Fi code
   * captioned by its SSID, a contact by its name), or `null` to caption with the value.
   */
  captionOverrides: Record<string, string> | null
  setCaptionOverrides: (overrides: Record<string, string> | null) => void
  /**
   * Pre-built payloads from CSV column mapping, or `null` for the plain textarea path.
   * When set, this (not `input`) is the source of truth for the values, so a payload that
   * legitimately contains newlines (vCard, iCalendar) is never split on its own lines.
   */
  preparedValues: string[] | null
  setPreparedValues: (values: string[] | null) => void
  /** Unique, capped values that will be rendered. */
  values: string[]
  /** Unique non-empty line count before the cap. */
  total: number
  /** True when input exceeded the cap and was truncated. */
  truncated: boolean
  status: BatchStatus
  progress: BatchProgress
  errorCode: BatchErrorCode | null
  generate: () => Promise<void>
  maxLines: number
}

export function useBatchGenerator(): UseBatchGeneratorReturn {
  const [input, setInputState] = useState(() => readRaw(BATCH_INPUT_KEY))
  const [format, setFormatState] = useState<BatchOutput>('png')
  const [labelPreset, setLabelPresetState] = useState<LabelPresetId>(DEFAULT_LABEL_PRESET_ID)
  const [captions, setCaptionsState] = useState(true)
  const [filenameOverrides, setFilenameOverrides] = useState<Record<string, string> | null>(null)
  const [captionOverrides, setCaptionOverrides] = useState<Record<string, string> | null>(null)
  const [preparedValues, setPreparedValues] = useState<string[] | null>(null)
  const [status, setStatus] = useState<BatchStatus>('idle')
  const [progress, setProgress] = useState<BatchProgress>({ completed: 0, total: 0 })
  const [errorCode, setErrorCode] = useState<BatchErrorCode | null>(null)

  const { values, total, truncated } = useMemo(
    () => (preparedValues !== null ? dedupeAndCap(preparedValues) : parseBatchInput(input)),
    [preparedValues, input],
  )

  // Persist the pasted list (debounced) so switching tabs and back doesn't lose it.
  useEffect(() => {
    const timer = setTimeout(() => writeRaw(BATCH_INPUT_KEY, input), 400)
    return () => clearTimeout(timer)
  }, [input])

  // Editing input or switching format clears a finished run's success/error state.
  const setInput = useCallback((value: string) => {
    setInputState(value)
    setStatus((prev) => (prev === 'generating' ? prev : 'idle'))
    setErrorCode(null)
  }, [])

  // Changing any output option clears a finished run's success/error state, so the button
  // reads as ready again, mirroring setInput.
  const clearFinished = useCallback(() => {
    setStatus((prev) => (prev === 'generating' ? prev : 'idle'))
    setErrorCode(null)
  }, [])

  const setFormat = useCallback(
    (next: BatchOutput) => {
      setFormatState(next)
      clearFinished()
    },
    [clearFinished],
  )

  const setLabelPreset = useCallback(
    (next: LabelPresetId) => {
      setLabelPresetState(next)
      clearFinished()
    },
    [clearFinished],
  )

  const setCaptions = useCallback(
    (next: boolean) => {
      setCaptionsState(next)
      clearFinished()
    },
    [clearFinished],
  )

  const generate = useCallback(async () => {
    const { values: toRender } =
      preparedValues !== null ? dedupeAndCap(preparedValues) : parseBatchInput(input)
    if (toRender.length === 0) {
      setStatus('error')
      setErrorCode('empty')
      return
    }

    setStatus('generating')
    setErrorCode(null)
    setProgress({ completed: 0, total: toRender.length })

    try {
      const appearance = loadPersistedAppearance()
      const design: BatchDesign = {
        ecLevel: appearance.ecLevel,
        fgColor: appearance.fgColor,
        bgColor: appearance.bgColor,
        designConfig: loadDesignConfig(),
        frameConfig: loadFrameConfig(),
      }

      const onProgress = (completed: number, totalCount: number) =>
        setProgress({ completed, total: totalCount })
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)

      if (format === 'labels') {
        const blob = await buildLabelSheetPdf({
          values: toRender,
          design,
          presetId: labelPreset,
          captions,
          captionByValue: captionOverrides ?? undefined,
          onProgress,
        })
        downloadBlob(blob, `qr-labels-${toRender.length}-${stamp}.pdf`)
      } else {
        const blob = await buildBatchZip({
          values: toRender,
          format,
          design,
          onProgress,
          filenameByValue: filenameOverrides ?? undefined,
        })
        downloadBlob(blob, `qr-batch-${toRender.length}-${stamp}.zip`)
      }
      setStatus('success')
    } catch (err) {
      console.error('Batch generation failed', err)
      setStatus('error')
      setErrorCode('render-failed')
    }
  }, [input, preparedValues, format, labelPreset, captions, filenameOverrides, captionOverrides])

  return {
    input,
    setInput,
    format,
    setFormat,
    labelPreset,
    setLabelPreset,
    captions,
    setCaptions,
    filenameOverrides,
    setFilenameOverrides,
    captionOverrides,
    setCaptionOverrides,
    preparedValues,
    setPreparedValues,
    values,
    total,
    truncated,
    status,
    progress,
    errorCode,
    generate,
    maxLines: BATCH_MAX_LINES,
  }
}
