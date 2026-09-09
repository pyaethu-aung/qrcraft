import { useState, useCallback } from 'react'
import {
  loadHistory,
  saveHistoryEntry,
  clearHistory,
  type HistoryEntry,
  type NewHistoryEntry,
} from '../utils/history'

export type { HistoryEntry }

export interface UseQRHistoryReturn {
  history: HistoryEntry[]
  addEntry: (entry: NewHistoryEntry) => void
  clear: () => void
}

export function useQRHistory(): UseQRHistoryReturn {
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory)

  const addEntry = useCallback((entry: NewHistoryEntry) => {
    setHistory(saveHistoryEntry(entry))
  }, [])

  const clear = useCallback(() => {
    clearHistory()
    setHistory([])
  }, [])

  return { history, addEntry, clear }
}
