import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { useTheme } from '../useTheme'

describe('useTheme (Restored Dynamic Theme)', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.clearAllMocks()

    // Default matchMedia mock (light mode)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  it('initializes with light theme when no storage and OS is light', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
    expect(result.current.isDark).toBe(false)
  })

  it('initializes with dark theme when no storage and OS is dark', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })

    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
    expect(result.current.isDark).toBe(true)
  })

  it('initializes with light theme when storage says light even if OS is dark', () => {
    window.localStorage.setItem('qr-generator:theme-preference', 'light')

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })

    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
  })

  it('initializes with dark theme when storage says dark', () => {
    window.localStorage.setItem('qr-generator:theme-preference', 'dark')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
  })

  it('toggleTheme changes the theme and persists', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')

    act(() => {
      result.current.toggleTheme()
    })

    expect(result.current.theme).toBe('dark')
    expect(result.current.isDark).toBe(true)
    expect(window.localStorage.getItem('qr-generator:theme-preference')).toBe('dark')

    act(() => {
      result.current.toggleTheme()
    })

    expect(result.current.theme).toBe('light')
    expect(result.current.isDark).toBe(false)
    expect(window.localStorage.getItem('qr-generator:theme-preference')).toBe('light')
  })

  it('setTheme changes the theme and persists', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('dark')
    })

    expect(result.current.theme).toBe('dark')
    expect(window.localStorage.getItem('qr-generator:theme-preference')).toBe('dark')
  })

  it('responds to system preference changes when no storage exists', () => {
    let changeHandler: ((e: MediaQueryListEvent) => void) | null = null
    const addListenerMock = vi.fn().mockImplementation((_event: string, handler: (e: MediaQueryListEvent) => void) => {
      changeHandler = handler
    })

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false, // initial light
        media: query,
        addEventListener: addListenerMock,
        removeEventListener: vi.fn(),
      })),
    })

    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')

    act(() => {
      if (changeHandler) {
        changeHandler({ matches: true } as MediaQueryListEvent)
      }
    })

    expect(result.current.theme).toBe('dark')
  })

  it('ignores system preference changes when storage exists', () => {
    window.localStorage.setItem('qr-generator:theme-preference', 'light')

    let changeHandler: ((e: MediaQueryListEvent) => void) | null = null
    const addListenerMock = vi.fn().mockImplementation((_event: string, handler: (e: MediaQueryListEvent) => void) => {
      changeHandler = handler
    })

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false, // initial light
        media: query,
        addEventListener: addListenerMock,
        removeEventListener: vi.fn(),
      })),
    })

    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')

    act(() => {
      if (changeHandler) {
        changeHandler({ matches: true } as MediaQueryListEvent)
      }
    })

    expect(result.current.theme).toBe('light') // Still light
  })
})
