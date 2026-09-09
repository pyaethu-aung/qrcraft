import { truncateWithEllipsis } from './textFormat'
import { readJSON, writeJSON, removeItem } from './safeLocalStorage'

export interface ListEntryBase {
  id: string
  savedAt: number
  label: string
  value: string
}

interface LocalStorageListOptions<T extends ListEntryBase> {
  storageKey: string
  maxEntries: number
  labelMax: number
  isValidEntry: (entry: unknown) => entry is T
}

/**
 * Generic "recent items" list persisted to localStorage: a capped, deduped-by-value
 * array of entries, each with a generated id/savedAt/label. Shared by the generate-side
 * history and scan-side history, which otherwise hand-roll identical load/save/remove/clear
 * and dedupe-and-cap logic.
 */
export function createLocalStorageList<T extends ListEntryBase>({
  storageKey,
  maxEntries,
  labelMax,
  isValidEntry,
}: LocalStorageListOptions<T>) {
  function load(): T[] {
    const parsed = readJSON<unknown>(storageKey, [])
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidEntry)
  }

  function persist(entries: T[]): T[] {
    writeJSON(storageKey, entries)
    return entries
  }

  function save(entry: Omit<T, 'id' | 'savedAt' | 'label'>): T[] {
    const newEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      savedAt: Date.now(),
      label: truncateWithEllipsis(entry.value.trim(), labelMax),
      ...entry,
    } as T
    const deduped = load().filter(e => e.value !== entry.value)
    return persist([newEntry, ...deduped].slice(0, maxEntries))
  }

  function remove(id: string): T[] {
    return persist(load().filter(e => e.id !== id))
  }

  function clear(): void {
    removeItem(storageKey)
  }

  return { load, save, remove, clear }
}
