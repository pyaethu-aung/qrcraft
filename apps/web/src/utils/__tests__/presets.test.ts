import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadPresets,
  savePreset,
  deletePreset,
  clearPresets,
  PRESETS_MAX,
  PRESET_NAME_MAX,
  type NewPresetEntry,
} from '../presets'

const mockDesignConfig = {
  eyeFrameShape: 'Square' as const,
  eyeCenterShape: 'Square' as const,
  eyeFrameColor: null,
  eyeCenterColor: null,
  pixelPattern: 'Square' as const,
  fgGradient: null,
}

const mockFrameConfig = {
  style: 'None' as const,
  text: 'SCAN ME',
  color: '#000000',
  position: 'bottom' as const,
}

const base: NewPresetEntry = {
  name: 'Test preset',
  fgColor: '#000000',
  bgColor: '#ffffff',
  transparentBg: false,
  ecLevel: 'M',
  designConfig: mockDesignConfig,
  frameConfig: mockFrameConfig,
}

beforeEach(() => {
  localStorage.clear()
})

describe('loadPresets', () => {
  it('returns empty array when nothing stored', () => {
    expect(loadPresets()).toEqual([])
  })

  it('returns empty array for invalid JSON', () => {
    localStorage.setItem('qr-generator:presets', 'not-json')
    expect(loadPresets()).toEqual([])
  })

  it('returns empty array for non-array JSON', () => {
    localStorage.setItem('qr-generator:presets', JSON.stringify({ a: 1 }))
    expect(loadPresets()).toEqual([])
  })

  it('filters out entries missing required fields', () => {
    localStorage.setItem('qr-generator:presets', JSON.stringify([{ id: 'x', name: 'bad' }]))
    expect(loadPresets()).toEqual([])
  })

  it('filters out entries with invalid hex colors', () => {
    const bad = { ...base, fgColor: 'red' }
    localStorage.setItem('qr-generator:presets', JSON.stringify([{ id: 'x', savedAt: 1, ...bad }]))
    expect(loadPresets()).toEqual([])
  })

  it('filters out entries with invalid ecLevel', () => {
    localStorage.setItem('qr-generator:presets', JSON.stringify([
      { id: 'x', savedAt: 1, name: 'p', fgColor: '#000', bgColor: '#fff', transparentBg: false, ecLevel: 'X', designConfig: mockDesignConfig, frameConfig: mockFrameConfig },
    ]))
    expect(loadPresets()).toEqual([])
  })

  it('filters out entries with invalid designConfig', () => {
    localStorage.setItem('qr-generator:presets', JSON.stringify([
      { id: 'x', savedAt: 1, name: 'p', fgColor: '#000', bgColor: '#fff', transparentBg: false, ecLevel: 'M', designConfig: null, frameConfig: mockFrameConfig },
    ]))
    expect(loadPresets()).toEqual([])
  })

  it('accepts a valid entry with gradient', () => {
    const withGradient = {
      ...base,
      designConfig: { ...mockDesignConfig, fgGradient: { type: 'linear', from: '#000', to: '#fff', direction: 'to-r' } },
    }
    localStorage.setItem('qr-generator:presets', JSON.stringify([
      { id: 'x', savedAt: 1, name: 'gradient', fgColor: '#000000', bgColor: '#ffffff', transparentBg: false, ecLevel: 'M', designConfig: withGradient.designConfig, frameConfig: mockFrameConfig },
    ]))
    expect(loadPresets()).toHaveLength(1)
  })
})

describe('savePreset', () => {
  it('saves a preset and returns the list', () => {
    const result = savePreset(base)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Test preset')
    expect(typeof result[0].id).toBe('string')
    expect(result[0].savedAt).toBeGreaterThan(0)
  })

  it('prepends new preset to the list', () => {
    savePreset({ ...base, name: 'First' })
    const result = savePreset({ ...base, name: 'Second' })
    expect(result[0].name).toBe('Second')
    expect(result[1].name).toBe('First')
  })

  it('caps at PRESETS_MAX entries', () => {
    for (let i = 0; i < PRESETS_MAX + 3; i++) {
      savePreset({ ...base, name: `Preset ${i}` })
    }
    expect(loadPresets()).toHaveLength(PRESETS_MAX)
  })

  it('trims whitespace from name', () => {
    const result = savePreset({ ...base, name: '  My Brand  ' })
    expect(result[0].name).toBe('My Brand')
  })

  it('ignores blank name after trimming', () => {
    savePreset(base)
    const result = savePreset({ ...base, name: '   ' })
    expect(result).toHaveLength(1)
  })

  it('truncates name to PRESET_NAME_MAX', () => {
    const long = 'A'.repeat(PRESET_NAME_MAX + 10)
    const result = savePreset({ ...base, name: long })
    expect(result[0].name).toHaveLength(PRESET_NAME_MAX)
  })

  it('persists to localStorage', () => {
    savePreset(base)
    const raw = localStorage.getItem('qr-generator:presets')
    expect(raw).not.toBeNull()
    expect(loadPresets()).toHaveLength(1)
  })
})

describe('deletePreset', () => {
  it('removes the specified preset', () => {
    const saved = savePreset(base)
    const result = deletePreset(saved[0].id)
    expect(result).toHaveLength(0)
  })

  it('leaves other presets intact', () => {
    savePreset({ ...base, name: 'Keep' })
    const withSecond = savePreset({ ...base, name: 'Remove' })
    const result = deletePreset(withSecond[0].id)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Keep')
  })

  it('is a no-op for unknown id', () => {
    savePreset(base)
    const result = deletePreset('nonexistent-id')
    expect(result).toHaveLength(1)
  })
})

describe('clearPresets', () => {
  it('removes all presets', () => {
    savePreset(base)
    savePreset({ ...base, name: 'Second' })
    clearPresets()
    expect(loadPresets()).toHaveLength(0)
  })

  it('leaves localStorage without the presets key', () => {
    savePreset(base)
    clearPresets()
    expect(localStorage.getItem('qr-generator:presets')).toBeNull()
  })
})
