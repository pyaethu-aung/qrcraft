import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useQRDesign } from '../useQRDesign'

describe('useQRDesign - logo state', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('initializes logoDataUrl as null and logoSize clamped to maxLogoSize', () => {
    const { result } = renderHook(() => useQRDesign('', 'M'))
    expect(result.current.logoDataUrl).toBeNull()
    expect(result.current.logoSize).toBeLessThanOrEqual(result.current.maxLogoSize)
  })

  it('caps logoSize to maxLogoSize when setLogoSize is called', () => {
    const { result } = renderHook(() => useQRDesign('', 'L'))
    act(() => {
      result.current.setLogoSize(30)
    })
    expect(result.current.logoSize).toBe(7) // L cap is 7%
  })

  it('exposes the correct maxLogoSize per EC level', () => {
    const { result: resultL } = renderHook(() => useQRDesign('', 'L'))
    const { result: resultM } = renderHook(() => useQRDesign('', 'M'))
    const { result: resultQ } = renderHook(() => useQRDesign('', 'Q'))
    const { result: resultH } = renderHook(() => useQRDesign('', 'H'))

    expect(resultL.current.maxLogoSize).toBe(7)
    expect(resultM.current.maxLogoSize).toBe(15)
    expect(resultQ.current.maxLogoSize).toBe(25)
    expect(resultH.current.maxLogoSize).toBe(30)
  })

  it('clamps existing logoSize when ecLevel changes to a lower cap', () => {
    type Props = { ecLevel: 'L' | 'M' | 'Q' | 'H' }
    const { result, rerender } = renderHook(
      ({ ecLevel }: Props) => useQRDesign('', ecLevel),
      { initialProps: { ecLevel: 'H' } },
    )

    act(() => {
      result.current.setLogoSize(28)
    })
    expect(result.current.logoSize).toBe(28)

    rerender({ ecLevel: 'L' })
    expect(result.current.logoSize).toBe(7)
  })

  it('stores and clears logoDataUrl via setLogoDataUrl', () => {
    const { result } = renderHook(() => useQRDesign('', 'M'))

    act(() => {
      result.current.setLogoDataUrl('data:image/png;base64,test')
    })
    expect(result.current.logoDataUrl).toBe('data:image/png;base64,test')

    act(() => {
      result.current.setLogoDataUrl(null)
    })
    expect(result.current.logoDataUrl).toBeNull()
  })
})

describe('useQRDesign - eye shapes & colors', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('defaults to square frame/center inheriting the foreground color', () => {
    const { result } = renderHook(() => useQRDesign('', 'M'))
    expect(result.current.designConfig).toMatchObject({
      eyeFrameShape: 'Square',
      eyeCenterShape: 'Square',
      eyeFrameColor: null,
      eyeCenterColor: null,
      pixelPattern: 'Square',
    })
  })

  it('updates frame/center shapes and colors independently', () => {
    const { result } = renderHook(() => useQRDesign('', 'M'))

    act(() => result.current.setEyeFrameShape('Circle'))
    act(() => result.current.setEyeCenterShape('Diamond'))
    act(() => result.current.setEyeFrameColor('#A04D28'))
    act(() => result.current.setEyeCenterColor('#123456'))

    expect(result.current.designConfig).toMatchObject({
      eyeFrameShape: 'Circle',
      eyeCenterShape: 'Diamond',
      eyeFrameColor: '#A04D28',
      eyeCenterColor: '#123456',
    })

    act(() => result.current.setEyeFrameColor(null))
    expect(result.current.designConfig.eyeFrameColor).toBeNull()
  })

  it('migrates a legacy single eyeShape from localStorage into split frame/center shapes', () => {
    localStorage.setItem(
      'qr-generator-design-config',
      JSON.stringify({ eyeShape: 'Diamond', pixelPattern: 'Dots' }),
    )

    const { result } = renderHook(() => useQRDesign('', 'M'))
    expect(result.current.designConfig).toEqual({
      eyeFrameShape: 'Square',
      eyeCenterShape: 'Diamond',
      eyeFrameColor: null,
      eyeCenterColor: null,
      pixelPattern: 'Dots',
      fgGradient: null,
    })
  })

  it('maps legacy Rounded to rounded frame and center', () => {
    localStorage.setItem(
      'qr-generator-design-config',
      JSON.stringify({ eyeShape: 'Rounded', pixelPattern: 'Square' }),
    )

    const { result } = renderHook(() => useQRDesign('', 'M'))
    expect(result.current.designConfig.eyeFrameShape).toBe('Rounded')
    expect(result.current.designConfig.eyeCenterShape).toBe('Rounded')
  })
})

describe('useQRDesign - isRiskyPattern', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('triggers isRiskyPattern when using Dots with a matrix size >= 41', () => {
    // Generate long string to force > 40 size (Version 6+)
    const denseValue = 'https://example.com/'.repeat(50)
    
    const { result } = renderHook(() => useQRDesign(denseValue, 'H'))
    
    // Default is Square, no risk
    expect(result.current.isRiskyPattern).toBe(false)
    
    // Switch to Dots
    act(() => {
      result.current.setPixelPattern('Dots')
    })
    
    // Should now be risky
    expect(result.current.isRiskyPattern).toBe(true)
  })
  
  it('does not trigger isRiskyPattern for low density Data', () => {
    const lightValue = 'A'
    
    const { result } = renderHook(() => useQRDesign(lightValue, 'L'))
    
    act(() => {
      result.current.setPixelPattern('Dots')
    })
    
    expect(result.current.isRiskyPattern).toBe(false)
  })

  it('can be dismissed', () => {
    const denseValue = 'https://example.com/'.repeat(50)
    const { result } = renderHook(() => useQRDesign(denseValue, 'H'))
    
    act(() => {
      result.current.setPixelPattern('Dots')
    })
    
    expect(result.current.isRiskyPattern).toBe(true)
    
    act(() => {
      result.current.dismissWarning()
    })
    
    expect(result.current.isRiskyPattern).toBe(false)
  })

  it('triggers isRiskyPattern for Vertical pattern at high density', () => {
    const denseValue = 'https://example.com/'.repeat(50)
    const { result } = renderHook(() => useQRDesign(denseValue, 'H'))

    act(() => { result.current.setPixelPattern('Vertical') })
    expect(result.current.isRiskyPattern).toBe(true)
  })

  it('does not trigger isRiskyPattern for Rounded pattern at any density', () => {
    const denseValue = 'https://example.com/'.repeat(50)
    const { result } = renderHook(() => useQRDesign(denseValue, 'H'))

    act(() => { result.current.setPixelPattern('Rounded') })
    expect(result.current.isRiskyPattern).toBe(false)
  })

  it('does not trigger isRiskyPattern for Diamond pattern at high density', () => {
    const denseValue = 'https://example.com/'.repeat(50)
    const { result } = renderHook(() => useQRDesign(denseValue, 'H'))

    act(() => { result.current.setPixelPattern('Diamond') })
    expect(result.current.isRiskyPattern).toBe(false)
  })

  it('triggers isRiskyPattern for Horizontal pattern at high density', () => {
    const denseValue = 'https://example.com/'.repeat(50)
    const { result } = renderHook(() => useQRDesign(denseValue, 'H'))

    act(() => { result.current.setPixelPattern('Horizontal') })
    expect(result.current.isRiskyPattern).toBe(true)
  })

  it('does not trigger isRiskyPattern for the connected patterns at high density', () => {
    const denseValue = 'https://example.com/'.repeat(50)
    const { result } = renderHook(() => useQRDesign(denseValue, 'H'))

    act(() => { result.current.setPixelPattern('Classy') })
    expect(result.current.isRiskyPattern).toBe(false)

    act(() => { result.current.setPixelPattern('Fluid') })
    expect(result.current.isRiskyPattern).toBe(false)
  })
})

describe('useQRDesign - foreground gradient', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('defaults fgGradient to null (solid foreground)', () => {
    const { result } = renderHook(() => useQRDesign('', 'M'))
    expect(result.current.designConfig.fgGradient).toBeNull()
  })

  it('sets and persists a gradient via setFgGradient', () => {
    const { result } = renderHook(() => useQRDesign('', 'M'))
    act(() => {
      result.current.setFgGradient({ type: 'linear', from: '#000000', to: '#4F46E5', direction: 'to-r' })
    })
    expect(result.current.designConfig.fgGradient).toEqual({ type: 'linear', from: '#000000', to: '#4F46E5', direction: 'to-r' })
    const stored = JSON.parse(localStorage.getItem('qr-generator-design-config') ?? '{}') as { fgGradient?: unknown }
    expect(stored.fgGradient).toEqual({ type: 'linear', from: '#000000', to: '#4F46E5', direction: 'to-r' })
  })

  it('clears the gradient back to solid with null', () => {
    const { result } = renderHook(() => useQRDesign('', 'M'))
    act(() => { result.current.setFgGradient({ type: 'radial', from: '#000000', to: '#FFFFFF', direction: 'to-br' }) })
    act(() => { result.current.setFgGradient(null) })
    expect(result.current.designConfig.fgGradient).toBeNull()
  })

  it('restores a valid persisted gradient on load', () => {
    localStorage.setItem('qr-generator-design-config', JSON.stringify({
      eyeFrameShape: 'Square', eyeCenterShape: 'Square', eyeFrameColor: null, eyeCenterColor: null,
      pixelPattern: 'Square', fgGradient: { type: 'linear', from: '#112233', to: '#445566', direction: 'to-b' },
    }))
    const { result } = renderHook(() => useQRDesign('', 'M'))
    expect(result.current.designConfig.fgGradient).toEqual({ type: 'linear', from: '#112233', to: '#445566', direction: 'to-b' })
  })

  it('rejects a malformed persisted gradient and falls back to solid', () => {
    localStorage.setItem('qr-generator-design-config', JSON.stringify({
      eyeFrameShape: 'Square', eyeCenterShape: 'Square', eyeFrameColor: null, eyeCenterColor: null,
      pixelPattern: 'Square', fgGradient: { type: 'spiral', from: 'not-a-hex', to: '#445566', direction: 'sideways' },
    }))
    const { result } = renderHook(() => useQRDesign('', 'M'))
    expect(result.current.designConfig.fgGradient).toBeNull()
  })

  it('defaults an unknown direction to to-br while keeping valid colors', () => {
    localStorage.setItem('qr-generator-design-config', JSON.stringify({
      eyeFrameShape: 'Square', eyeCenterShape: 'Square', eyeFrameColor: null, eyeCenterColor: null,
      pixelPattern: 'Square', fgGradient: { type: 'linear', from: '#000000', to: '#FFFFFF', direction: 'nowhere' },
    }))
    const { result } = renderHook(() => useQRDesign('', 'M'))
    expect(result.current.designConfig.fgGradient).toEqual({ type: 'linear', from: '#000000', to: '#FFFFFF', direction: 'to-br' })
  })
})
