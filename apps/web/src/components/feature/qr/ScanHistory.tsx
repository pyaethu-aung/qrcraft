import { useCallback, type ComponentType } from 'react'
import {
  Trash2,
  X,
  Link as LinkIcon,
  Wifi,
  User,
  Mail,
  MessageSquare,
  Phone,
  MapPin,
  CalendarDays,
  Coins,
  FileText,
} from 'lucide-react'
import type { ScanHistoryEntry } from '../../../hooks/useScanHistory'
import type { DecodedContentType } from '../../../utils/qrClassify'
import { useTimedState } from '../../../hooks/useTimedState'

interface ScanHistoryProps {
  history: ScanHistoryEntry[]
  onRestore: (entry: ScanHistoryEntry) => void
  onRemove: (entry: ScanHistoryEntry) => void
  onClear: () => void
  sectionLabel: string
  clearAriaLabel: string
  removeAriaLabel: string
  typeLabel: (type: DecodedContentType) => string
}

const TYPE_ICON: Record<DecodedContentType, ComponentType<{ size?: number; className?: string }>> = {
  url: LinkIcon,
  wifi: Wifi,
  vcard: User,
  email: Mail,
  sms: MessageSquare,
  tel: Phone,
  geo: MapPin,
  vevent: CalendarDays,
  crypto: Coins,
  text: FileText,
}

export function ScanHistory({
  history,
  onRestore,
  onRemove,
  onClear,
  sectionLabel,
  clearAriaLabel,
  removeAriaLabel,
  typeLabel,
}: ScanHistoryProps) {
  const [restoredId, setRestoredId, setRestoredIdImmediate] = useTimedState<string | null>(null, 1500)
  const [announcement, setAnnouncement] = useTimedState('', 1500)

  const handleRestore = useCallback((entry: ScanHistoryEntry) => {
    onRestore(entry)
    setRestoredId(entry.id)
    setAnnouncement(entry.label)
  }, [onRestore, setRestoredId, setAnnouncement])

  const handleRemove = useCallback((entry: ScanHistoryEntry) => {
    if (restoredId === entry.id) setRestoredIdImmediate(null)
    onRemove(entry)
  }, [onRemove, restoredId, setRestoredIdImmediate])

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
      <ul className="space-y-2">
        {history.map((entry) => {
          const isRestored = restoredId === entry.id
          const Icon = TYPE_ICON[entry.type]
          return (
            <li
              key={entry.id}
              className={[
                'flex items-stretch gap-2 rounded-xl border transition-[background-color,border-color,box-shadow] duration-150',
                isRestored
                  ? 'border-action bg-surface-raised ring-2 ring-action ring-offset-2'
                  : 'border-border-strong bg-surface-raised hover:border-action',
              ].join(' ')}
            >
              <button
                type="button"
                onClick={() => handleRestore(entry)}
                aria-label={`${typeLabel(entry.type)}: ${entry.label}`}
                className="group flex min-w-0 flex-1 items-center gap-3 rounded-l-xl p-3 text-left transition-colors duration-150 hover:bg-surface-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-inset text-text-secondary">
                  <Icon size={16} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-text-secondary">
                    {typeLabel(entry.type)}
                  </span>
                  <span className="block truncate text-sm text-text-primary">{entry.label}</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleRemove(entry)}
                aria-label={`${removeAriaLabel}: ${entry.label}`}
                className="flex w-11 shrink-0 items-center justify-center rounded-r-xl text-text-secondary transition-colors duration-150 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset"
              >
                <X size={16} aria-hidden />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
