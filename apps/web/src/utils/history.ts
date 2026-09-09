import type { QRErrorCorrectionLevel } from '../types/qr'
import { createLocalStorageList } from './localStorageList'

export interface HistoryEntry {
  id: string
  savedAt: number
  label: string
  value: string
  thumbnailDataUrl: string
  fgColor: string
  bgColor: string
  ecLevel: QRErrorCorrectionLevel
}

export const HISTORY_MAX_ENTRIES = 8
const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
const EC_LEVELS: readonly QRErrorCorrectionLevel[] = ['L', 'M', 'Q', 'H']

function isValidEntry(e: unknown): e is HistoryEntry {
  if (!e || typeof e !== 'object') return false
  const entry = e as Partial<HistoryEntry>
  return (
    typeof entry.id === 'string' &&
    typeof entry.savedAt === 'number' &&
    typeof entry.label === 'string' &&
    typeof entry.value === 'string' && entry.value.length > 0 &&
    typeof entry.thumbnailDataUrl === 'string' && entry.thumbnailDataUrl.startsWith('data:') &&
    typeof entry.fgColor === 'string' && HEX_RE.test(entry.fgColor) &&
    typeof entry.bgColor === 'string' && HEX_RE.test(entry.bgColor) &&
    EC_LEVELS.includes(entry.ecLevel as QRErrorCorrectionLevel)
  )
}

const historyList = createLocalStorageList<HistoryEntry>({
  storageKey: 'qr-generator:history',
  maxEntries: HISTORY_MAX_ENTRIES,
  labelMax: 40,
  isValidEntry,
})

export type NewHistoryEntry = Omit<HistoryEntry, 'id' | 'savedAt' | 'label'>

export const loadHistory = historyList.load
export const saveHistoryEntry = historyList.save
export const clearHistory = historyList.clear
