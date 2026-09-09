import { useState, useCallback, useRef, useEffect, useId } from 'react'
import { Bookmark, Check, X, Trash2 } from 'lucide-react'
import type { PresetEntry } from '../../../hooks/useQRPresets'
import { PRESET_NAME_MAX } from '../../../utils/presets'

interface QRPresetsProps {
  presets: PresetEntry[]
  onApply: (preset: PresetEntry) => void
  onDelete: (id: string) => void
  onSave: (name: string) => void
  maxPresets: number
  sectionLabel: string
  emptyHint: string
  saveButton: string
  savedLabel: string
  saveNamePlaceholder: string
  saveNameAriaLabel: string
  saveConfirmAriaLabel: string
  saveCancelAriaLabel: string
  deleteAriaLabel: string
  confirmDeleteAriaLabel: string
  appliedLabel: string
}

export function QRPresets({
  presets,
  onApply,
  onDelete,
  onSave,
  maxPresets,
  sectionLabel,
  emptyHint,
  saveButton,
  savedLabel,
  saveNamePlaceholder,
  saveNameAriaLabel,
  saveConfirmAriaLabel,
  saveCancelAriaLabel,
  deleteAriaLabel,
  confirmDeleteAriaLabel,
  appliedLabel,
}: QRPresetsProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [appliedId, setAppliedId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [highlightNew, setHighlightNew] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputId = useId()

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current)
  }, [])

  useEffect(() => {
    if (isSaving) inputRef.current?.focus()
  }, [isSaving])

  useEffect(() => {
    if (!pendingDeleteId) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current)
        setPendingDeleteId(null)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [pendingDeleteId])

  const handleStartSave = () => {
    setIsSaving(true)
    setNameValue('')
  }

  const handleConfirmSave = useCallback(() => {
    const name = nameValue.trim()
    if (!name) return
    onSave(name)
    setIsSaving(false)
    setNameValue('')
    setHighlightNew(true)
    setAnnouncement(savedLabel)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setAnnouncement('')
      setHighlightNew(false)
    }, 1500)
  }, [nameValue, onSave, savedLabel])

  const handleCancelSave = () => {
    setIsSaving(false)
    setNameValue('')
  }

  const handleApply = useCallback((preset: PresetEntry) => {
    onApply(preset)
    setAppliedId(preset.id)
    setPendingDeleteId(null)
    setHighlightNew(false)
    setAnnouncement(appliedLabel)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setAppliedId(null)
      setAnnouncement('')
    }, 1500)
  }, [onApply, appliedLabel])

  const handleDeleteRequest = useCallback((id: string) => {
    if (pendingDeleteId === id) {
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current)
      setPendingDeleteId(null)
      onDelete(id)
    } else {
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current)
      setPendingDeleteId(id)
      pendingTimerRef.current = setTimeout(() => setPendingDeleteId(null), 2500)
    }
  }, [pendingDeleteId, onDelete])

  const canSave = presets.length < maxPresets

  return (
    <div>
      <span className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</span>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-text-secondary">
          {sectionLabel}
        </p>
        {!isSaving && canSave && (
          <button
            type="button"
            onClick={handleStartSave}
            className="flex items-center gap-1.5 h-11 px-3 text-xs font-medium text-text-secondary rounded-lg transition-colors hover:bg-surface-inset hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
          >
            <Bookmark size={13} aria-hidden />
            {saveButton}
          </button>
        )}
      </div>

      {isSaving && (
        <div className="flex items-center gap-2 mb-3">
          <label htmlFor={inputId} className="sr-only">{saveNameAriaLabel}</label>
          <input
            id={inputId}
            ref={inputRef}
            type="text"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            placeholder={saveNamePlaceholder}
            maxLength={PRESET_NAME_MAX}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirmSave()
              if (e.key === 'Escape') handleCancelSave()
            }}
            className="h-11 flex-1 min-w-0 rounded-lg border border-border-strong bg-surface-inset px-3 text-sm text-text-primary placeholder:text-text-secondary focus:border-focus-ring focus:outline-none focus:ring-2 focus:ring-focus-ring"
          />
          <button
            type="button"
            onClick={handleConfirmSave}
            disabled={!nameValue.trim()}
            aria-label={saveConfirmAriaLabel}
            className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-action text-action-fg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check size={15} aria-hidden />
          </button>
          <button
            type="button"
            onClick={handleCancelSave}
            aria-label={saveCancelAriaLabel}
            className="flex size-11 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-inset hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
          >
            <X size={15} aria-hidden />
          </button>
        </div>
      )}

      {presets.length === 0 ? (
        <p className="text-xs text-text-secondary">{emptyHint}</p>
      ) : (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))' }}
        >
          {presets.map((preset, index) => {
            const isApplied = appliedId === preset.id
            const isPendingDelete = pendingDeleteId === preset.id
            const isJustSaved = highlightNew && index === 0
            return (
              <div key={preset.id} className="group relative">
                <button
                  type="button"
                  onClick={() => handleApply(preset)}
                  aria-label={preset.name}
                  aria-pressed={isApplied}
                  className={[
                    'w-full flex flex-col items-center gap-2 rounded-xl border p-2 text-left transition-[background-color,border-color,box-shadow] duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2',
                    isPendingDelete
                      ? 'border-error bg-surface-raised ring-2 ring-error ring-offset-2'
                      : isApplied || isJustSaved
                        ? 'border-action bg-surface-raised ring-2 ring-action ring-offset-2'
                        : 'border-border-strong bg-surface-raised hover:border-action hover:bg-surface-inset',
                  ].join(' ')}
                >
                  <div
                    className="size-[72px] shrink-0 rounded-lg flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: preset.transparentBg ? 'var(--color-surface-raised)' : preset.bgColor }}
                    aria-hidden
                  >
                    {isApplied ? (
                      <Check size={20} style={{ color: preset.fgColor }} aria-hidden />
                    ) : (
                      <div
                        className="size-8 rounded-full border border-border-subtle"
                        style={{ backgroundColor: preset.fgColor }}
                      />
                    )}
                  </div>
                  <p className="w-full break-all text-center text-[10px] leading-tight text-text-secondary line-clamp-2">
                    {preset.name}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteRequest(preset.id)}
                  aria-label={isPendingDelete
                    ? confirmDeleteAriaLabel.replace('{name}', preset.name)
                    : deleteAriaLabel.replace('{name}', preset.name)}
                  className={[
                    'absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-error text-error-fg shadow transition-[opacity,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
                    isPendingDelete
                      ? 'opacity-100 scale-125'
                      : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100',
                  ].join(' ')}
                >
                  {isPendingDelete
                    ? <Trash2 size={10} aria-hidden />
                    : <X size={10} aria-hidden />}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
