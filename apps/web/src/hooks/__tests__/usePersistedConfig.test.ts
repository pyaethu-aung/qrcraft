import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { usePersistedConfig } from '../usePersistedConfig'

const DEFAULTS = { name: '', count: 0, secret: '', enabled: false }
const OMIT_SECRET = ['secret'] as const

describe('usePersistedConfig', () => {
  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  it('starts from defaults when nothing is stored', () => {
    const { result } = renderHook(() => usePersistedConfig('test:empty', DEFAULTS))
    expect(result.current[0]).toEqual(DEFAULTS)
  })

  it('writes the value after the debounce and restores it on a fresh mount', () => {
    vi.useFakeTimers()
    const first = renderHook(() => usePersistedConfig('test:roundtrip', DEFAULTS))
    act(() => first.result.current[1]((prev) => ({ ...prev, name: 'Team dinner', count: 2 })))
    act(() => {
      vi.advanceTimersByTime(500)
    })
    first.unmount()

    const second = renderHook(() => usePersistedConfig('test:roundtrip', DEFAULTS))
    expect(second.result.current[0]).toEqual({ ...DEFAULTS, name: 'Team dinner', count: 2 })
  })

  it('never writes omitted keys and restores them as defaults', () => {
    vi.useFakeTimers()
    const { result, unmount } = renderHook(() =>
      usePersistedConfig('test:omit', DEFAULTS, OMIT_SECRET),
    )
    act(() => result.current[1]((prev) => ({ ...prev, secret: 'hunter2', name: 'kept' })))
    act(() => {
      vi.advanceTimersByTime(500)
    })
    unmount()

    expect(localStorage.getItem('test:omit')).not.toContain('hunter2')
    const fresh = renderHook(() => usePersistedConfig('test:omit', DEFAULTS, OMIT_SECRET))
    expect(fresh.result.current[0]).toEqual({ ...DEFAULTS, name: 'kept' })
  })

  it('drops unknown keys and type mismatches from a stored draft', () => {
    localStorage.setItem(
      'test:sanitize',
      JSON.stringify({ name: 42, count: 'NaN', enabled: true, rogue: 'x' }),
    )
    const { result } = renderHook(() => usePersistedConfig('test:sanitize', DEFAULTS))
    expect(result.current[0]).toEqual({ ...DEFAULTS, enabled: true })
    expect(result.current[0]).not.toHaveProperty('rogue')
  })

  it('survives corrupt stored JSON', () => {
    localStorage.setItem('test:corrupt', '{not json')
    const { result } = renderHook(() => usePersistedConfig('test:corrupt', DEFAULTS))
    expect(result.current[0]).toEqual(DEFAULTS)
  })
})
