import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  loadHistory,
  saveHistoryEntry,
  clearHistory,
  HISTORY_MAX_ENTRIES,
  type HistoryEntry,
  type NewHistoryEntry,
} from '../history.js'

const makeEntry = (overrides: Partial<NewHistoryEntry> = {}): NewHistoryEntry => ({
  value: 'https://example.com',
  thumbnailDataUrl: 'data:image/png;base64,abc',
  fgColor: '#000000',
  bgColor: '#ffffff',
  ecLevel: 'M',
  ...overrides,
})

describe('loadHistory', () => {
  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('returns empty array when nothing stored', () => {
    expect(loadHistory()).toEqual([])
  })

  it('returns empty array when stored value is not JSON', () => {
    localStorage.setItem('qr-generator:history', 'not-json')
    expect(loadHistory()).toEqual([])
  })

  it('returns empty array when stored value is not an array', () => {
    localStorage.setItem('qr-generator:history', JSON.stringify({ id: '1' }))
    expect(loadHistory()).toEqual([])
  })

  it('filters out invalid entries', () => {
    const valid: HistoryEntry = {
      id: '1',
      savedAt: Date.now(),
      label: 'test',
      value: 'hello',
      thumbnailDataUrl: 'data:image/png;base64,abc',
      fgColor: '#000000',
      bgColor: '#ffffff',
      ecLevel: 'M',
    }
    const invalid = { id: 2, savedAt: 'nope', value: '' }
    localStorage.setItem('qr-generator:history', JSON.stringify([valid, invalid]))
    expect(loadHistory()).toEqual([valid])
  })

  it('rejects entries with invalid hex colors', () => {
    const entry: HistoryEntry = {
      id: '1', savedAt: Date.now(), label: 'x', value: 'x',
      thumbnailDataUrl: 'data:image/png;base64,abc',
      fgColor: 'notahex', bgColor: '#fff', ecLevel: 'L',
    }
    localStorage.setItem('qr-generator:history', JSON.stringify([entry]))
    expect(loadHistory()).toEqual([])
  })

  it('rejects entries with invalid ecLevel', () => {
    const entry: HistoryEntry = {
      id: '1', savedAt: Date.now(), label: 'x', value: 'x',
      thumbnailDataUrl: 'data:image/png;base64,abc',
      fgColor: '#000', bgColor: '#fff', ecLevel: 'X' as never,
    }
    localStorage.setItem('qr-generator:history', JSON.stringify([entry]))
    expect(loadHistory()).toEqual([])
  })

  it('handles localStorage.getItem throwing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('quota') })
    expect(loadHistory()).toEqual([])
  })
})

describe('saveHistoryEntry', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => { localStorage.clear(); vi.restoreAllMocks() })

  it('returns a list with the new entry prepended', () => {
    const result = saveHistoryEntry(makeEntry())
    expect(result).toHaveLength(1)
    expect(result[0].value).toBe('https://example.com')
  })

  it('sets id, savedAt, and label automatically', () => {
    const result = saveHistoryEntry(makeEntry({ value: 'hello world' }))
    expect(typeof result[0].id).toBe('string')
    expect(typeof result[0].savedAt).toBe('number')
    expect(result[0].label).toBe('hello world')
  })

  it('truncates labels longer than 40 chars', () => {
    const long = 'a'.repeat(50)
    const result = saveHistoryEntry(makeEntry({ value: long }))
    expect(result[0].label.length).toBeLessThanOrEqual(42) // 40 + ellipsis char
    expect(result[0].label.endsWith('…')).toBe(true)
  })

  it('deduplicates: same value replaces the existing entry', () => {
    saveHistoryEntry(makeEntry({ value: 'same' }))
    const result = saveHistoryEntry(makeEntry({ value: 'same' }))
    expect(result.filter(e => e.value === 'same')).toHaveLength(1)
  })

  it('prepends new entries so most-recent is first', () => {
    saveHistoryEntry(makeEntry({ value: 'first' }))
    const result = saveHistoryEntry(makeEntry({ value: 'second' }))
    expect(result[0].value).toBe('second')
    expect(result[1].value).toBe('first')
  })

  it(`caps at ${HISTORY_MAX_ENTRIES} entries`, () => {
    for (let i = 0; i < HISTORY_MAX_ENTRIES + 3; i++) {
      saveHistoryEntry(makeEntry({ value: `val-${i}` }))
    }
    expect(loadHistory()).toHaveLength(HISTORY_MAX_ENTRIES)
  })

  it('persists to localStorage', () => {
    saveHistoryEntry(makeEntry())
    const stored = localStorage.getItem('qr-generator:history')
    expect(stored).not.toBeNull()
    expect(JSON.parse(stored!)).toHaveLength(1)
  })

  it('handles localStorage.setItem throwing without crashing', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    expect(() => saveHistoryEntry(makeEntry())).not.toThrow()
  })
})

describe('clearHistory', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => { localStorage.clear(); vi.restoreAllMocks() })

  it('removes the history key', () => {
    saveHistoryEntry(makeEntry())
    clearHistory()
    expect(loadHistory()).toEqual([])
    expect(localStorage.getItem('qr-generator:history')).toBeNull()
  })

  it('handles localStorage.removeItem throwing without crashing', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error() })
    expect(() => clearHistory()).not.toThrow()
  })
})
