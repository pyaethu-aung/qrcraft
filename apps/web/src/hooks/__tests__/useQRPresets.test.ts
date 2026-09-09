import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useQRPresets } from '../useQRPresets'
import type { NewPresetEntry } from '../../utils/presets'

const base: NewPresetEntry = {
  name: 'Test',
  fgColor: '#000000',
  bgColor: '#ffffff',
  transparentBg: false,
  ecLevel: 'M',
  designConfig: {
    eyeFrameShape: 'Square',
    eyeCenterShape: 'Square',
    eyeFrameColor: null,
    eyeCenterColor: null,
    pixelPattern: 'Square',
    fgGradient: null,
  },
  frameConfig: {
    style: 'None',
    text: 'SCAN ME',
    color: '#000000',
    position: 'bottom',
  },
}

beforeEach(() => {
  localStorage.clear()
})

describe('useQRPresets', () => {
  it('starts with empty presets', () => {
    const { result } = renderHook(() => useQRPresets())
    expect(result.current.presets).toEqual([])
  })

  it('hydrates from localStorage on mount', () => {
    const { result: r1 } = renderHook(() => useQRPresets())
    act(() => r1.current.save(base))
    const { result: r2 } = renderHook(() => useQRPresets())
    expect(r2.current.presets).toHaveLength(1)
    expect(r2.current.presets[0].name).toBe('Test')
  })

  it('adds a preset via save', () => {
    const { result } = renderHook(() => useQRPresets())
    act(() => result.current.save(base))
    expect(result.current.presets).toHaveLength(1)
    expect(result.current.presets[0].name).toBe('Test')
  })

  it('removes a preset via remove', () => {
    const { result } = renderHook(() => useQRPresets())
    act(() => result.current.save(base))
    const id = result.current.presets[0].id
    act(() => result.current.remove(id))
    expect(result.current.presets).toHaveLength(0)
  })

  it('clears all presets via clear', () => {
    const { result } = renderHook(() => useQRPresets())
    act(() => result.current.save(base))
    act(() => result.current.save({ ...base, name: 'Second' }))
    act(() => result.current.clear())
    expect(result.current.presets).toHaveLength(0)
  })

  it('preserves other presets when removing one', () => {
    const { result } = renderHook(() => useQRPresets())
    act(() => result.current.save({ ...base, name: 'Keep' }))
    act(() => result.current.save({ ...base, name: 'Delete' }))
    const idToDelete = result.current.presets[0].id
    act(() => result.current.remove(idToDelete))
    expect(result.current.presets).toHaveLength(1)
    expect(result.current.presets[0].name).toBe('Keep')
  })
})
