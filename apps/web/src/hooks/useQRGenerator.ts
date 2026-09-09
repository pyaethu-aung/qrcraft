import { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import type { QRDesignConfig, QRErrorCorrectionLevel, QRFrameConfig } from '../types/qr'
import { downloadBlob } from '../utils/download'
import { exportSvg } from '../utils/export/svgExporter'
import { renderQrPngBlob } from '../utils/export/pngRenderer'
import { getHydratedAppearance } from '../utils/shareConfig'
import { loadPersistedAppearance, persistAppearance } from '../utils/persistedAppearance'
import { getCapacityStatus } from '../utils/qrCapacity'
import { readRaw, writeRaw } from '../utils/safeLocalStorage'

export const INPUT_LENGTH_LIMIT = 2000

const TEXT_DRAFT_KEY = 'qr-generator:draft:text'

/** English fallback; callers pass a localized template with a `{max}` placeholder. */
const DEFAULT_TOO_LONG_TEMPLATE = `Input too long (max {max} characters)`

function getValidationErrorStatic(
  value: string,
  tooLongTemplate: string = DEFAULT_TOO_LONG_TEMPLATE,
): string | undefined {
  if (value.length > INPUT_LENGTH_LIMIT) {
    return tooLongTemplate.replace('{max}', String(INPUT_LENGTH_LIMIT))
  }
  return undefined
}

export interface UseQRGeneratorReturn {
  liveValue: string
  inputValue: string
  setInputValue: (value: string) => void
  inputEcLevel: QRErrorCorrectionLevel
  setInputEcLevel: (level: QRErrorCorrectionLevel) => void
  inputFgColor: string
  setInputFgColor: (color: string) => void
  inputBgColor: string
  setInputBgColor: (color: string) => void
  inputTransparentBg: boolean
  setInputTransparentBg: (v: boolean) => void
  downloadPng: (designConfig: QRDesignConfig, frameConfig?: QRFrameConfig, logoDataUrl?: string | null, logoSize?: number) => Promise<void>
  downloadSvg: (designConfig: QRDesignConfig, frameConfig?: QRFrameConfig, logoDataUrl?: string | null, logoSize?: number) => Promise<void>
  inputError?: string
  canDownload: boolean
  recentDownload: 'png' | 'svg' | null
  isPending: boolean
}

export const useQRGenerator = (
  externalValue?: string,
  tooLongTemplate?: string,
): UseQRGeneratorReturn => {
  const [inputValue, setInputValueState] = useState<string>(() => readRaw(TEXT_DRAFT_KEY))
  const [inputError, setInputError] = useState<string | undefined>(() =>
    getValidationErrorStatic(inputValue, tooLongTemplate),
  )
  const [liveValue, setLiveValue] = useState<string>('')

  // Initial appearance precedence: a shared `#c=` link wins, then the last-persisted
  // appearance, then defaults. Persisting fg/bg/EC lets the Batch tab inherit the look.
  // Computed once (lazy initializer) rather than on every render.
  const [initialAppearance] = useState(() => {
    const shared = getHydratedAppearance()
    const persisted = loadPersistedAppearance()
    return {
      ecLevel: shared?.ecLevel ?? persisted.ecLevel,
      fgColor: shared?.fgColor ?? persisted.fgColor,
      bgColor: shared?.bgColor ?? persisted.bgColor,
      transparentBg: persisted.transparentBg,
    }
  })
  const [inputEcLevel, setInputEcLevel] = useState<QRErrorCorrectionLevel>(initialAppearance.ecLevel)
  const [inputFgColor, setInputFgColor] = useState<string>(initialAppearance.fgColor)
  const [inputBgColor, setInputBgColor] = useState<string>(initialAppearance.bgColor)
  const [inputTransparentBg, setInputTransparentBg] = useState<boolean>(initialAppearance.transparentBg)
  const [recentDownload, setRecentDownload] = useState<'png' | 'svg' | null>(null)
  const downloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // When externalValue is set (wifi mode), it overrides the text input value
  const effectiveInput = externalValue !== undefined ? externalValue : inputValue
  const effectiveError = externalValue !== undefined ? undefined : inputError

  // Content past the QR capacity for the active level cannot be encoded — qrcode.create
  // throws on it. Treat it like a validation failure so the preview clears to its
  // placeholder and downloads disable, instead of the generator crashing. The capacity
  // counter under the field is what tells the user the count is over the limit.
  const isOverCapacity = useMemo(
    () => getCapacityStatus(effectiveInput, inputEcLevel).isOverLimit,
    [effectiveInput, inputEcLevel],
  )
  const isBlocked = Boolean(effectiveError) || isOverCapacity
  const isUsable = Boolean(effectiveInput.trim()) && !isBlocked

  useEffect(() => {
    return () => {
      if (downloadTimerRef.current) clearTimeout(downloadTimerRef.current)
    }
  }, [])

  const setInputValue = useCallback(
    (value: string) => {
      setInputValueState(value)
      setInputError(getValidationErrorStatic(value, tooLongTemplate))
    },
    [tooLongTemplate],
  )

  // Persist the text draft so a refresh or tab discard doesn't lose it.
  useEffect(() => {
    const timer = setTimeout(() => writeRaw(TEXT_DRAFT_KEY, inputValue), 400)
    return () => clearTimeout(timer)
  }, [inputValue])

  // Persist the appearance triple (debounced) so the Batch tab inherits the current look.
  useEffect(() => {
    const timer = setTimeout(() => {
      persistAppearance({ fgColor: inputFgColor, bgColor: inputBgColor, ecLevel: inputEcLevel, transparentBg: inputTransparentBg })
    }, 400)
    return () => clearTimeout(timer)
  }, [inputFgColor, inputBgColor, inputEcLevel, inputTransparentBg])

  // Debounce the text field — 300 ms for valid input, 0 ms to clear on invalid/empty
  useEffect(() => {
    const effective = isUsable ? effectiveInput : ''
    const delay = effective ? 300 : 0
    const timer = setTimeout(() => setLiveValue(effective), delay)
    return () => clearTimeout(timer)
  }, [effectiveInput, isUsable])

  const canDownload = isUsable

  const isPending = isUsable && liveValue !== effectiveInput.trim()

  const downloadRendered = useCallback(async (
    format: 'png' | 'svg',
    renderBlob: (opts: {
      ecLevel: QRErrorCorrectionLevel
      fgColor: string
      bgColor: string
      designConfig: QRDesignConfig
      frameConfig?: QRFrameConfig
      logoDataUrl?: string | null
      logoSize: number
      transparentBg: boolean
    }) => Promise<Blob>,
    designConfig: QRDesignConfig,
    frameConfig?: QRFrameConfig,
    logoDataUrl?: string | null,
    logoSize = 20,
  ) => {
    if (!effectiveInput.trim()) return

    try {
      const blob = await renderBlob({
        ecLevel: inputEcLevel,
        fgColor: inputFgColor,
        bgColor: inputBgColor,
        designConfig,
        frameConfig,
        logoDataUrl,
        logoSize,
        transparentBg: inputTransparentBg,
      })

      downloadBlob(blob, `qr-code-${Date.now()}.${format}`)
      if (downloadTimerRef.current) clearTimeout(downloadTimerRef.current)
      setRecentDownload(format)
      downloadTimerRef.current = setTimeout(() => setRecentDownload(null), 1500)
    } catch (err) {
      console.error(`Failed to generate ${format.toUpperCase()}`, err)
    }
  }, [effectiveInput, inputEcLevel, inputFgColor, inputBgColor, inputTransparentBg])

  const downloadPng = useCallback((
    designConfig: QRDesignConfig,
    frameConfig?: QRFrameConfig,
    logoDataUrl?: string | null,
    logoSize?: number,
  ) => downloadRendered(
    'png',
    opts => renderQrPngBlob(effectiveInput, opts),
    designConfig,
    frameConfig,
    logoDataUrl,
    logoSize,
  ), [downloadRendered, effectiveInput])

  const downloadSvg = useCallback((
    designConfig: QRDesignConfig,
    frameConfig?: QRFrameConfig,
    logoDataUrl?: string | null,
    logoSize?: number,
  ) => downloadRendered(
    'svg',
    opts => exportSvg(effectiveInput, { value: effectiveInput, ...opts }),
    designConfig,
    frameConfig,
    logoDataUrl,
    logoSize,
  ), [downloadRendered, effectiveInput])

  return {
    liveValue,
    inputValue,
    setInputValue,
    inputEcLevel,
    setInputEcLevel,
    inputFgColor,
    setInputFgColor,
    inputBgColor,
    setInputBgColor,
    inputTransparentBg,
    setInputTransparentBg,
    downloadPng,
    downloadSvg,
    inputError,
    canDownload,
    isPending,
    recentDownload,
  }
}
