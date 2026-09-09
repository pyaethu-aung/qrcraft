import '@testing-library/jest-dom/vitest'
import { beforeEach, vi } from 'vitest'

// Content drafts persist to localStorage, so isolate every test from the
// previous one's storage writes.
beforeEach(() => {
  window.localStorage.clear()
})

// Mock localStorage for jsdom if it's not correctly initialized
if (
  typeof window !== 'undefined' &&
  (!window.localStorage || typeof window.localStorage.clear !== 'function')
) {
  const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value.toString()
      }),
      clear: vi.fn(() => {
        store = {}
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key]
      }),
      length: 0,
      key: vi.fn((index: number) => Object.keys(store)[index] || null),
    }
  })()

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  })
}
