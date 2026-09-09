import { describe, it, expect } from 'vitest'
import { createLocalStorageList, type ListEntryBase } from '../localStorageList'

interface TestEntry extends ListEntryBase {
  color: string
}

function isValidEntry(e: unknown): e is TestEntry {
  if (!e || typeof e !== 'object') return false
  const entry = e as Partial<TestEntry>
  return (
    typeof entry.id === 'string' &&
    typeof entry.savedAt === 'number' &&
    typeof entry.label === 'string' &&
    typeof entry.value === 'string' &&
    typeof entry.color === 'string'
  )
}

function makeList(maxEntries = 3) {
  return createLocalStorageList<TestEntry>({
    storageKey: 'test:list',
    maxEntries,
    labelMax: 10,
    isValidEntry,
  })
}

describe('createLocalStorageList', () => {
  it('returns an empty array when nothing is stored', () => {
    expect(makeList().load()).toEqual([])
  })

  it('saves an entry with a generated id, savedAt, and truncated label', () => {
    const list = makeList()
    const updated = list.save({ value: 'a very long value that exceeds the label max', color: 'red' })

    expect(updated).toHaveLength(1)
    expect(updated[0].id).toBeTruthy()
    expect(updated[0].savedAt).toBeGreaterThan(0)
    expect(updated[0].label).toBe('a very lon…')
    expect(updated[0].color).toBe('red')
    expect(list.load()).toEqual(updated)
  })

  it('dedupes by value, keeping the newest entry first', () => {
    const list = makeList()
    list.save({ value: 'x', color: 'red' })
    const updated = list.save({ value: 'x', color: 'blue' })

    expect(updated).toHaveLength(1)
    expect(updated[0].color).toBe('blue')
  })

  it('caps at maxEntries, dropping the oldest', () => {
    const list = makeList(2)
    list.save({ value: 'a', color: 'red' })
    list.save({ value: 'b', color: 'red' })
    const updated = list.save({ value: 'c', color: 'red' })

    expect(updated.map(e => e.value)).toEqual(['c', 'b'])
  })

  it('removes an entry by id', () => {
    const list = makeList()
    const [entry] = list.save({ value: 'a', color: 'red' })
    const updated = list.remove(entry.id)

    expect(updated).toEqual([])
    expect(list.load()).toEqual([])
  })

  it('clears all entries', () => {
    const list = makeList()
    list.save({ value: 'a', color: 'red' })
    list.clear()

    expect(list.load()).toEqual([])
  })

  it('filters out invalid entries on load', () => {
    localStorage.setItem('test:list', JSON.stringify([{ id: '1' }, { id: '2', savedAt: 1, label: 'l', value: 'v', color: 'red' }]))
    expect(makeList().load()).toHaveLength(1)
  })

  it('returns an empty array for malformed JSON', () => {
    localStorage.setItem('test:list', 'not json')
    expect(makeList().load()).toEqual([])
  })
})
