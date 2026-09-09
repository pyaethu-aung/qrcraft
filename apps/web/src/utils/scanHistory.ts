import type { DecodedContentType } from './qrClassify'
import { createLocalStorageList } from './localStorageList'

/**
 * One decoded QR code remembered from the Scan view. Mirrors the generate-side
 * {@link import('./history').HistoryEntry} but holds no thumbnail or design: a scan only ever
 * yields a string, so an entry carries the decoded `value`, its classified `type` (for the
 * badge), and the usual id/savedAt/label bookkeeping.
 */
export interface ScanHistoryEntry {
  id: string
  savedAt: number
  label: string
  value: string
  type: DecodedContentType
}

export const SCAN_HISTORY_MAX_ENTRIES = 8
const CONTENT_TYPES: readonly DecodedContentType[] = [
  'url',
  'wifi',
  'vcard',
  'email',
  'sms',
  'tel',
  'geo',
  'vevent',
  'crypto',
  'text',
]

function isValidEntry(e: unknown): e is ScanHistoryEntry {
  if (!e || typeof e !== 'object') return false
  const entry = e as Partial<ScanHistoryEntry>
  return (
    typeof entry.id === 'string' &&
    typeof entry.savedAt === 'number' &&
    typeof entry.label === 'string' &&
    typeof entry.value === 'string' && entry.value.length > 0 &&
    CONTENT_TYPES.includes(entry.type as DecodedContentType)
  )
}

const scanHistoryList = createLocalStorageList<ScanHistoryEntry>({
  storageKey: 'qr-generator:scan-history',
  maxEntries: SCAN_HISTORY_MAX_ENTRIES,
  labelMax: 40,
  isValidEntry,
})

export type NewScanHistoryEntry = Omit<ScanHistoryEntry, 'id' | 'savedAt' | 'label'>

export const loadScanHistory = scanHistoryList.load
export const saveScanHistoryEntry = scanHistoryList.save
export const removeScanHistoryEntry = scanHistoryList.remove
export const clearScanHistory = scanHistoryList.clear
