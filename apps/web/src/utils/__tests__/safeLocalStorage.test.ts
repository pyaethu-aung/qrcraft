import { describe, it, expect, vi, afterEach } from 'vitest'
import { readJSON, readRaw, writeJSON, writeRaw, removeItem } from '../safeLocalStorage'

describe('safeLocalStorage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('readJSON', () => {
    it('returns the fallback when nothing is stored', () => {
      expect(readJSON('missing-key', { a: 1 })).toEqual({ a: 1 })
    })

    it('parses and returns stored JSON', () => {
      localStorage.setItem('k', JSON.stringify({ a: 2 }))
      expect(readJSON('k', { a: 1 })).toEqual({ a: 2 })
    })

    it('returns the fallback for malformed JSON', () => {
      localStorage.setItem('k', 'not json')
      expect(readJSON('k', { a: 1 })).toEqual({ a: 1 })
    })

    it('returns the fallback when localStorage.getItem throws', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('unavailable')
      })
      expect(readJSON('k', 'fallback')).toBe('fallback')
    })
  })

  describe('readRaw', () => {
    it('returns the default when nothing is stored', () => {
      expect(readRaw('missing-key')).toBe('')
      expect(readRaw('missing-key', 'default')).toBe('default')
    })

    it('returns the stored string as-is', () => {
      localStorage.setItem('k', 'hello')
      expect(readRaw('k')).toBe('hello')
    })

    it('returns the default when localStorage.getItem throws', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('unavailable')
      })
      expect(readRaw('k', 'fallback')).toBe('fallback')
    })
  })

  describe('writeJSON', () => {
    it('stores a JSON-serialized value', () => {
      writeJSON('k', { a: 1 })
      expect(localStorage.getItem('k')).toBe(JSON.stringify({ a: 1 }))
    })

    it('does not throw when localStorage.setItem throws', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota exceeded')
      })
      expect(() => writeJSON('k', { a: 1 })).not.toThrow()
    })
  })

  describe('writeRaw', () => {
    it('stores the raw string', () => {
      writeRaw('k', 'hello')
      expect(localStorage.getItem('k')).toBe('hello')
    })

    it('does not throw when localStorage.setItem throws', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota exceeded')
      })
      expect(() => writeRaw('k', 'hello')).not.toThrow()
    })
  })

  describe('removeItem', () => {
    it('removes the stored key', () => {
      localStorage.setItem('k', 'hello')
      removeItem('k')
      expect(localStorage.getItem('k')).toBeNull()
    })

    it('does not throw when localStorage.removeItem throws', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('unavailable')
      })
      expect(() => removeItem('k')).not.toThrow()
    })
  })
})
