import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Upload, Camera, Copy, Check, ExternalLink, PencilLine, RotateCcw, X } from 'lucide-react'

import { PillGroup } from '../../common/PillGroup'
import { Callout } from '../../common/Callout'
import { ScanHistory } from './ScanHistory'
import { useQrScanner, type ScanErrorCode } from '../../../hooks/useQrScanner'
import { useScanHistory, type ScanHistoryEntry } from '../../../hooks/useScanHistory'
import { useLocaleContext } from '../../../hooks/LocaleProvider'
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard'
import { useFileDrop } from '../../../hooks/useFileDrop'
import { classifyDecoded, getOpenableUrl, type DecodedContentType } from '../../../utils/qrClassify'
import type { TranslationKey } from '../../../types/i18n'

export interface QRScannerProps {
  /** Round-trips a decoded value into the generator's Text mode and switches back to it. */
  onEditInGenerator: (value: string) => void
}

type InputMethod = 'upload' | 'camera'

const ERROR_KEY: Record<ScanErrorCode, TranslationKey> = {
  'no-code': 'scan.errorNoCode',
  'unsupported-file': 'scan.errorUnsupportedFile',
  'file-too-large': 'scan.errorFileTooLarge',
  'camera-denied': 'scan.errorCameraDenied',
  'camera-unsupported': 'scan.errorCameraUnsupported',
  'decode-failed': 'scan.errorDecodeFailed',
}

const TYPE_KEY: Record<DecodedContentType, TranslationKey> = {
  url: 'scan.typeUrl',
  wifi: 'scan.typeWifi',
  vcard: 'scan.typeVcard',
  email: 'scan.typeEmail',
  sms: 'scan.typeSms',
  tel: 'scan.typeTel',
  geo: 'scan.typeGeo',
  vevent: 'scan.typeVevent',
  crypto: 'scan.typeCrypto',
  text: 'scan.typeText',
}

const ACTION_BUTTON =
  'flex h-11 items-center justify-center gap-1.5 rounded-xl border border-border-strong bg-surface-raised px-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2'

export function QRScanner({ onEditInGenerator }: QRScannerProps) {
  const { translate } = useLocaleContext()
  const { decoded, error, isDecoding, isCameraActive, videoRef, scanFile, cancelScan, startCamera, stopCamera, showResult, reset } =
    useQrScanner()
  const { history, addEntry, remove: removeHistoryEntry, clear: clearHistory } = useScanHistory()

  const [method, setMethodState] = useState<InputMethod>('upload')
  const [copyState, copyToClipboard, setCopyState] = useCopyToClipboard()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const resultHeadingId = useId()

  const setMethod = useCallback(
    (next: InputMethod) => {
      if (next === 'upload') stopCamera()
      setMethodState(next)
    },
    [stopCamera],
  )

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0]
      if (file) void scanFile(file)
    },
    [scanFile],
  )

  const { isDragging, onDragOver, onDragLeave, onDrop } = useFileDrop<HTMLButtonElement>(
    useCallback(file => void scanFile(file), [scanFile]),
  )

  const handleCopy = useCallback(async () => {
    if (!decoded) return
    await copyToClipboard(decoded)
  }, [decoded, copyToClipboard])

  const handleScanAnother = useCallback(() => {
    reset()
    setCopyState('idle')
  }, [reset, setCopyState])

  // Remember every decoded value the moment it appears. The ref guards against re-recording
  // the same result on a re-render (and against a restored entry being saved as if freshly
  // scanned), so dedup/reordering only happens on a genuinely new decode.
  const recordedRef = useRef<string | null>(null)
  useEffect(() => {
    if (decoded && decoded !== recordedRef.current) {
      recordedRef.current = decoded
      addEntry({ value: decoded, type: classifyDecoded(decoded) })
    }
  }, [decoded, addEntry])

  const handleRestore = useCallback(
    (entry: ScanHistoryEntry) => {
      recordedRef.current = entry.value
      showResult(entry.value)
      setCopyState('idle')
    },
    [showResult, setCopyState],
  )

  const handleRemove = useCallback(
    (entry: ScanHistoryEntry) => removeHistoryEntry(entry.id),
    [removeHistoryEntry],
  )

  const typeLabel = useCallback(
    (type: DecodedContentType) => translate(TYPE_KEY[type]),
    [translate],
  )

  const contentType = decoded ? classifyDecoded(decoded) : null
  const openUrl = decoded ? getOpenableUrl(decoded) : null

  return (
    <section className="relative isolate overflow-x-hidden px-2 pb-12 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-xl space-y-3">
        <div className="text-center pt-10 pb-4 px-6 sm:px-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-text-secondary">
            {translate('scan.sectionLabel')}
          </p>
          <h2 className="mt-1.5 text-2xl font-bold text-text-primary sm:text-4xl">
            {translate('scan.title')}
          </h2>
          <p className="mt-2 text-sm text-text-secondary">{translate('scan.subtitle')}</p>
        </div>

        <div className="rounded-xl border border-border-strong bg-surface-overlay p-6 sm:p-8 shadow-lg">
          {decoded ? (
            <div className="space-y-5" role="region" aria-labelledby={resultHeadingId}>
              <div className="flex items-center justify-between gap-3">
                <h3 id={resultHeadingId} className="text-lg font-bold text-text-primary">
                  {translate('scan.resultTitle')}
                </h3>
                {contentType && (
                  <span className="rounded-full bg-surface-inset px-2.5 py-1 text-xs font-medium text-text-primary">
                    {translate(TYPE_KEY[contentType])}
                  </span>
                )}
              </div>

              <div className="rounded-lg border border-border-subtle bg-surface-inset p-4">
                <p className="sr-only">{translate('scan.resultValueLabel')}</p>
                <p className="break-words text-sm text-text-primary whitespace-pre-wrap">{decoded}</p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => onEditInGenerator(decoded)}
                  className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-action px-3 text-sm font-semibold text-action-fg shadow-sm transition-colors hover:bg-action/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
                >
                  <PencilLine size={15} aria-hidden className="shrink-0" />
                  <span className="truncate">{translate('scan.editInGenerator')}</span>
                </button>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <button type="button" onClick={() => void handleCopy()} className={ACTION_BUTTON}>
                    {copyState === 'copied' ? (
                      <Check size={15} aria-hidden className="text-action shrink-0" />
                    ) : (
                      <Copy size={15} aria-hidden className="shrink-0" />
                    )}
                    <span className="truncate">
                      {copyState === 'copied' ? translate('scan.copied') : translate('scan.copy')}
                    </span>
                  </button>
                  {openUrl && (
                    <a
                      href={openUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={ACTION_BUTTON}
                    >
                      <ExternalLink size={15} aria-hidden className="shrink-0" />
                      <span className="truncate">{translate('scan.open')}</span>
                    </a>
                  )}
                  <button type="button" onClick={handleScanAnother} className={ACTION_BUTTON}>
                    <RotateCcw size={15} aria-hidden className="shrink-0" />
                    <span className="truncate">{translate('scan.scanAnother')}</span>
                  </button>
                </div>
              </div>
              {copyState === 'error' && (
                <p role="status" className="text-sm text-text-secondary">
                  {translate('scan.copyError')}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <PillGroup<InputMethod>
                aria-label={translate('scan.inputMethodLabel')}
                value={method}
                onChange={setMethod}
                size="sm"
                containerClassName="mx-auto flex w-fit gap-1 rounded-full bg-surface-inset p-1"
                itemClassName="grow-0"
                options={[
                  { value: 'upload', label: translate('scan.inputUpload'), icon: <Upload size={15} aria-hidden /> },
                  { value: 'camera', label: translate('scan.inputCamera'), icon: <Camera size={15} aria-hidden /> },
                ]}
              />

              {method === 'upload' ? (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={`flex min-h-48 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 ${
                      isDragging
                        ? 'border-action bg-surface-inset'
                        : 'border-border-strong bg-surface-raised hover:bg-surface-inset'
                    }`}
                  >
                    <Upload size={28} aria-hidden className="text-text-secondary" />
                    <span className="text-sm font-medium text-text-primary">
                      {isDragging ? translate('scan.dropzoneActive') : translate('scan.dropzoneTitle')}
                    </span>
                    <span className="text-xs text-text-secondary">{translate('scan.dropzoneHint')}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    aria-hidden
                    tabIndex={-1}
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                </>
              ) : (
                <div className="space-y-3">
                  <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-xl border border-border-strong bg-surface-inset">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="aspect-square w-full object-cover"
                    />
                    {isCameraActive ? (
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 flex items-center justify-center"
                      >
                        <div className="aspect-square w-3/5 rounded-2xl border-2 border-viewfinder shadow-[0_0_0_9999px_var(--color-scrim)]" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm text-text-secondary">{translate('scan.cameraHint')}</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => (isCameraActive ? stopCamera() : void startCamera())}
                    className={`${ACTION_BUTTON} w-full`}
                  >
                    <Camera size={15} aria-hidden className="shrink-0" />
                    <span className="truncate">
                      {isCameraActive ? translate('scan.cameraStop') : translate('scan.cameraStart')}
                    </span>
                  </button>
                  {isCameraActive && (
                    <p role="status" aria-live="polite" className="text-center text-sm text-text-secondary">
                      {translate('scan.cameraScanning')}
                    </p>
                  )}
                </div>
              )}

              {isDecoding && (
                <div className="space-y-2">
                  <p role="status" aria-live="polite" className="text-center text-sm text-text-secondary">
                    {translate('scan.decoding')}
                  </p>
                  <button type="button" onClick={cancelScan} className={`${ACTION_BUTTON} w-full`}>
                    <X size={15} aria-hidden className="shrink-0" />
                    <span className="truncate">{translate('scan.cancel')}</span>
                  </button>
                </div>
              )}
              {error && (
                // A blocked camera or an unsupported browser is a dead end, not
                // a status update: announce it assertively. Soft outcomes like
                // "no code found" stay polite.
                <Callout
                  role={
                    error === 'camera-denied' || error === 'camera-unsupported'
                      ? 'alert'
                      : 'status'
                  }
                >
                  {translate(ERROR_KEY[error])}
                </Callout>
              )}
            </div>
          )}
        </div>

        <ScanHistory
          history={history}
          onRestore={handleRestore}
          onRemove={handleRemove}
          onClear={clearHistory}
          sectionLabel={translate('scanHistory.sectionLabel')}
          clearAriaLabel={translate('scanHistory.clearAriaLabel')}
          removeAriaLabel={translate('scanHistory.removeAriaLabel')}
          typeLabel={typeLabel}
        />
      </div>
    </section>
  )
}

export default QRScanner
