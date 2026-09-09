import { useCallback } from 'react'
import { Trash2 } from 'lucide-react'
import type { HistoryEntry } from '../../../hooks/useQRHistory'
import { useTimedState } from '../../../hooks/useTimedState'

interface QRHistoryProps {
  history: HistoryEntry[]
  onRestore: (entry: HistoryEntry) => void
  onClear: () => void
  sectionLabel: string
  clearAriaLabel: string
}

export function QRHistory({ history, onRestore, onClear, sectionLabel, clearAriaLabel }: QRHistoryProps) {
  const [restoredId, setRestoredId] = useTimedState<string | null>(null, 1500)
  const [announcement, setAnnouncement] = useTimedState('', 1500)

  const handleRestore = useCallback((entry: HistoryEntry) => {
    onRestore(entry)
    setRestoredId(entry.id)
    setAnnouncement(entry.label)
  }, [onRestore, setRestoredId, setAnnouncement])

  if (history.length === 0) return null

  return (
    <div>
      <span className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</span>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-text-secondary">
          {sectionLabel}
        </p>
        <button
          type="button"
          onClick={onClear}
          aria-label={clearAriaLabel}
          className="flex size-11 items-center justify-center rounded-lg text-text-secondary transition-colors duration-150 hover:bg-surface-inset hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
        >
          <Trash2 size={14} aria-hidden />
        </button>
      </div>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))' }}
      >
        {history.map((entry) => {
          const isRestored = restoredId === entry.id
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => handleRestore(entry)}
              aria-label={entry.label}
              className={[
                'group flex flex-col items-center gap-2 rounded-xl border p-2 text-left transition-[background-color,border-color,box-shadow] duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2',
                isRestored
                  ? 'border-action bg-surface-raised ring-2 ring-action ring-offset-2'
                  : 'border-border-strong bg-surface-raised hover:border-action hover:bg-surface-inset',
              ].join(' ')}
            >
              <div className="size-[72px] shrink-0 overflow-hidden rounded-lg">
                <img
                  src={entry.thumbnailDataUrl}
                  alt=""
                  aria-hidden
                  width={72}
                  height={72}
                  className="size-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <p className="w-full break-all text-center text-[10px] leading-tight text-text-secondary line-clamp-2">
                {entry.label}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
