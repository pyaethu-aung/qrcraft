import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { useLocale } from '../useLocale'
import { defaultLocale } from '../../data/i18n'

describe('useLocale', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.clearAllMocks()
  })

  it('initializes with default locale if no preference is stored', () => {
    const { result } = renderHook(() => useLocale())
    expect(result.current.locale).toBe(defaultLocale)
  })

  it('initializes with stored preference if available', () => {
    window.localStorage.setItem('qr-generator:locale-preference', 'es')
    const { result } = renderHook(() => useLocale())
    expect(result.current.locale).toBe('es')
  })

  it('falls back to default if stored preference is invalid', () => {
    window.localStorage.setItem('qr-generator:locale-preference', 'invalid-code')
    const { result } = renderHook(() => useLocale())
    expect(result.current.locale).toBe(defaultLocale)
  })

  it('persists locale change to localStorage', () => {
    const { result } = renderHook(() => useLocale())

    act(() => {
      result.current.setLocale('es')
    })

    expect(result.current.locale).toBe('es')
    expect(window.localStorage.getItem('qr-generator:locale-preference')).toBe('es')
  })

  it('gracefully handles localStorage errors', () => {
    const getItemSpy = vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('Storage access denied')
    })
    const setItemSpy = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Storage space exceeded')
    })

    const { result } = renderHook(() => useLocale())
    expect(result.current.locale).toBe(defaultLocale)

    act(() => {
      result.current.setLocale('es')
    })

    expect(result.current.locale).toBe('es') // Should still update state even if persistence fails

    getItemSpy.mockRestore()
    setItemSpy.mockRestore()
  })
})
