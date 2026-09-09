import { useState, useCallback } from 'react'
import {
  loadScanHistory,
  saveScanHistoryEntry,
  removeScanHistoryEntry,
  clearScanHistory,
  type ScanHistoryEntry,
  type NewScanHistoryEntry,
} from '../utils/scanHistory'

export type { ScanHistoryEntry }

export interface UseScanHistoryReturn {
  history: ScanHistoryEntry[]
  addEntry: (entry: NewScanHistoryEntry) => void
  remove: (id: string) => void
  clear: () => void
}

export function useScanHistory(): UseScanHistoryReturn {
  const [history, setHistory] = useState<ScanHistoryEntry[]>(loadScanHistory)

  const addEntry = useCallback((entry: NewScanHistoryEntry) => {
    setHistory(saveScanHistoryEntry(entry))
  }, [])

  const remove = useCallback((id: string) => {
    setHistory(removeScanHistoryEntry(id))
  }, [])

  const clear = useCallback(() => {
    clearScanHistory()
    setHistory([])
  }, [])

  return { history, addEntry, remove, clear }
}
