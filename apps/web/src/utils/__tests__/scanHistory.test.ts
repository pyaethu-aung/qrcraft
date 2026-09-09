import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  loadScanHistory,
  saveScanHistoryEntry,
  removeScanHistoryEntry,
  clearScanHistory,
  SCAN_HISTORY_MAX_ENTRIES,
  type ScanHistoryEntry,
  type NewScanHistoryEntry,
} from '../scanHistory.js'

const makeEntry = (overrides: Partial<NewScanHistoryEntry> = {}): NewScanHistoryEntry => ({
  value: 'https://example.com',
  type: 'url',
  ...overrides,
})

describe('loadScanHistory', () => {
  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('returns empty array when nothing stored', () => {
    expect(loadScanHistory()).toEqual([])
  })

  it('returns empty array when stored value is not JSON', () => {
    localStorage.setItem('qr-generator:scan-history', 'not-json')
    expect(loadScanHistory()).toEqual([])
  })

  it('returns empty array when stored value is not an array', () => {
    localStorage.setItem('qr-generator:scan-history', JSON.stringify({ id: '1' }))
    expect(loadScanHistory()).toEqual([])
  })

  it('filters out invalid entries', () => {
    const valid: ScanHistoryEntry = {
      id: '1',
      savedAt: Date.now(),
      label: 'test',
      value: 'hello',
      type: 'text',
    }
    const invalid = { id: 2, savedAt: 'nope', value: '' }
    localStorage.setItem('qr-generator:scan-history', JSON.stringify([valid, invalid]))
    expect(loadScanHistory()).toEqual([valid])
  })

  it('rejects entries with an unknown content type', () => {
    const entry = {
      id: '1', savedAt: Date.now(), label: 'x', value: 'x', type: 'bogus',
    }
    localStorage.setItem('qr-generator:scan-history', JSON.stringify([entry]))
    expect(loadScanHistory()).toEqual([])
  })

  it('rejects entries with an empty value', () => {
    const entry = {
      id: '1', savedAt: Date.now(), label: 'x', value: '', type: 'text',
    }
    localStorage.setItem('qr-generator:scan-history', JSON.stringify([entry]))
    expect(loadScanHistory()).toEqual([])
  })

  it('handles localStorage.getItem throwing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('quota') })
    expect(loadScanHistory()).toEqual([])
  })
})

describe('saveScanHistoryEntry', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => { localStorage.clear(); vi.restoreAllMocks() })

  it('returns a list with the new entry prepended', () => {
    const result = saveScanHistoryEntry(makeEntry())
    expect(result).toHaveLength(1)
    expect(result[0].value).toBe('https://example.com')
    expect(result[0].type).toBe('url')
  })

  it('sets id, savedAt, and label automatically', () => {
    const result = saveScanHistoryEntry(makeEntry({ value: 'hello world', type: 'text' }))
    expect(typeof result[0].id).toBe('string')
    expect(typeof result[0].savedAt).toBe('number')
    expect(result[0].label).toBe('hello world')
  })

  it('truncates labels longer than 40 chars', () => {
    const long = 'a'.repeat(50)
    const result = saveScanHistoryEntry(makeEntry({ value: long }))
    expect(result[0].label.length).toBeLessThanOrEqual(42) // 40 + ellipsis char
    expect(result[0].label.endsWith('…')).toBe(true)
  })

  it('deduplicates: same value replaces the existing entry', () => {
    saveScanHistoryEntry(makeEntry({ value: 'same' }))
    const result = saveScanHistoryEntry(makeEntry({ value: 'same' }))
    expect(result.filter(e => e.value === 'same')).toHaveLength(1)
  })

  it('prepends new entries so most-recent is first', () => {
    saveScanHistoryEntry(makeEntry({ value: 'first' }))
    const result = saveScanHistoryEntry(makeEntry({ value: 'second' }))
    expect(result[0].value).toBe('second')
    expect(result[1].value).toBe('first')
  })

  it(`caps at ${SCAN_HISTORY_MAX_ENTRIES} entries`, () => {
    for (let i = 0; i < SCAN_HISTORY_MAX_ENTRIES + 3; i++) {
      saveScanHistoryEntry(makeEntry({ value: `val-${i}` }))
    }
    expect(loadScanHistory()).toHaveLength(SCAN_HISTORY_MAX_ENTRIES)
  })

  it('persists to localStorage', () => {
    saveScanHistoryEntry(makeEntry())
    const stored = localStorage.getItem('qr-generator:scan-history')
    expect(stored).not.toBeNull()
    expect(JSON.parse(stored!)).toHaveLength(1)
  })

  it('handles localStorage.setItem throwing without crashing', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    expect(() => saveScanHistoryEntry(makeEntry())).not.toThrow()
  })
})

describe('removeScanHistoryEntry', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => { localStorage.clear(); vi.restoreAllMocks() })

  it('removes only the entry with the matching id', () => {
    saveScanHistoryEntry(makeEntry({ value: 'keep' }))
    const afterAdd = saveScanHistoryEntry(makeEntry({ value: 'drop' }))
    const target = afterAdd.find(e => e.value === 'drop')!
    const result = removeScanHistoryEntry(target.id)
    expect(result).toHaveLength(1)
    expect(result[0].value).toBe('keep')
  })

  it('persists the removal to localStorage', () => {
    const [entry] = saveScanHistoryEntry(makeEntry())
    removeScanHistoryEntry(entry.id)
    expect(loadScanHistory()).toEqual([])
  })

  it('returns the list unchanged when the id is unknown', () => {
    saveScanHistoryEntry(makeEntry({ value: 'stay' }))
    const result = removeScanHistoryEntry('no-such-id')
    expect(result).toHaveLength(1)
    expect(result[0].value).toBe('stay')
  })

  it('handles localStorage.setItem throwing without crashing', () => {
    const [entry] = saveScanHistoryEntry(makeEntry())
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    expect(() => removeScanHistoryEntry(entry.id)).not.toThrow()
  })
})

describe('clearScanHistory', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => { localStorage.clear(); vi.restoreAllMocks() })

  it('removes the scan-history key', () => {
    saveScanHistoryEntry(makeEntry())
    clearScanHistory()
    expect(loadScanHistory()).toEqual([])
    expect(localStorage.getItem('qr-generator:scan-history')).toBeNull()
  })

  it('handles localStorage.removeItem throwing without crashing', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error() })
    expect(() => clearScanHistory()).not.toThrow()
  })
})
