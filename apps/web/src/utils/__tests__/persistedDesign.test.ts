import { describe, it, expect } from 'vitest'
import {
  loadDesignConfig,
  loadFrameConfig,
  DEFAULT_DESIGN_CONFIG,
  DEFAULT_FRAME_CONFIG,
  DESIGN_STORAGE_KEY,
  FRAME_STORAGE_KEY,
  FRAME_TEXT_LIMIT,
} from '../persistedDesign'

describe('loadDesignConfig', () => {
  it('returns defaults when nothing is stored', () => {
    expect(loadDesignConfig()).toEqual(DEFAULT_DESIGN_CONFIG)
  })

  it('reads a stored split-shape config', () => {
    localStorage.setItem(
      DESIGN_STORAGE_KEY,
      JSON.stringify({
        eyeFrameShape: 'Circle',
        eyeCenterShape: 'Dot',
        eyeFrameColor: '#ff0000',
        eyeCenterColor: null,
        pixelPattern: 'Dots',
      }),
    )
    const result = loadDesignConfig()
    expect(result.eyeFrameShape).toBe('Circle')
    expect(result.eyeCenterShape).toBe('Dot')
    expect(result.eyeFrameColor).toBe('#ff0000')
    expect(result.pixelPattern).toBe('Dots')
  })

  it('migrates the legacy single eyeShape into split shapes', () => {
    localStorage.setItem(DESIGN_STORAGE_KEY, JSON.stringify({ eyeShape: 'Diamond', pixelPattern: 'Rounded' }))
    const result = loadDesignConfig()
    expect(result.eyeFrameShape).toBe('Square')
    expect(result.eyeCenterShape).toBe('Diamond')
    expect(result.pixelPattern).toBe('Rounded')
  })

  it('validates the gradient, dropping malformed ones to null', () => {
    localStorage.setItem(
      DESIGN_STORAGE_KEY,
      JSON.stringify({ eyeFrameShape: 'Square', fgGradient: { type: 'linear', from: 'bad', to: '#000000' } }),
    )
    expect(loadDesignConfig().fgGradient).toBeNull()
  })

  it('keeps a valid gradient with a defaulted direction', () => {
    localStorage.setItem(
      DESIGN_STORAGE_KEY,
      JSON.stringify({ eyeFrameShape: 'Square', fgGradient: { type: 'radial', from: '#000000', to: '#ffffff' } }),
    )
    expect(loadDesignConfig().fgGradient).toEqual({
      type: 'radial',
      from: '#000000',
      to: '#ffffff',
      direction: 'to-br',
    })
  })

  it('returns defaults for non-JSON storage', () => {
    localStorage.setItem(DESIGN_STORAGE_KEY, 'nope')
    expect(loadDesignConfig()).toEqual(DEFAULT_DESIGN_CONFIG)
  })
})

describe('loadFrameConfig', () => {
  it('returns defaults when nothing is stored', () => {
    expect(loadFrameConfig()).toEqual(DEFAULT_FRAME_CONFIG)
  })

  it('reads a stored frame and clamps the caption length', () => {
    localStorage.setItem(
      FRAME_STORAGE_KEY,
      JSON.stringify({ style: 'Banner', text: 'x'.repeat(FRAME_TEXT_LIMIT + 10), color: '#123456', position: 'top' }),
    )
    const result = loadFrameConfig()
    expect(result.style).toBe('Banner')
    expect(result.text).toHaveLength(FRAME_TEXT_LIMIT)
    expect(result.color).toBe('#123456')
    expect(result.position).toBe('top')
  })

  it('falls back to a known style for an invalid one', () => {
    localStorage.setItem(FRAME_STORAGE_KEY, JSON.stringify({ style: 'Bogus' }))
    expect(loadFrameConfig().style).toBe(DEFAULT_FRAME_CONFIG.style)
  })
})
