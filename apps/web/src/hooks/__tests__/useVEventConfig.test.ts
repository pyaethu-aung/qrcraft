import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useVEventConfig } from '../useVEventConfig'

describe('useVEventConfig', () => {
  it('builds the payload once title and start are set', () => {
    const { result } = renderHook(() => useVEventConfig())
    act(() => {
      result.current.setSummary('Team dinner')
      result.current.setStart('2026-07-01T19:00')
    })
    expect(result.current.veventString).toContain('SUMMARY:Team dinner')
    expect(result.current.veventString).toContain('DTSTART:20260701T190000')
  })

  it('restores the chosen times after an all-day round trip', () => {
    const { result } = renderHook(() => useVEventConfig())
    act(() => {
      result.current.setStart('2026-07-01T18:00')
      result.current.setEnd('2026-07-01T21:00')
    })
    act(() => result.current.setAllDay(true))
    expect(result.current.veventConfig.start).toBe('2026-07-01')
    expect(result.current.veventConfig.end).toBe('2026-07-01')
    act(() => result.current.setAllDay(false))
    expect(result.current.veventConfig.start).toBe('2026-07-01T18:00')
    expect(result.current.veventConfig.end).toBe('2026-07-01T21:00')
  })

  it('falls back to default times when none were ever chosen', () => {
    const { result } = renderHook(() => useVEventConfig())
    act(() => result.current.setAllDay(true))
    act(() => result.current.setStart('2026-07-01'))
    act(() => result.current.setAllDay(false))
    expect(result.current.veventConfig.start).toBe('2026-07-01T09:00')
  })

  it('keeps restored times even after the date changes while all-day', () => {
    const { result } = renderHook(() => useVEventConfig())
    act(() => result.current.setStart('2026-07-01T18:00'))
    act(() => result.current.setAllDay(true))
    act(() => result.current.setStart('2026-08-15'))
    act(() => result.current.setAllDay(false))
    expect(result.current.veventConfig.start).toBe('2026-08-15T18:00')
  })
})
