import { describe, it, expect } from 'vitest'
import {
  loadPersistedAppearance,
  persistAppearance,
  defaultAppearance,
} from '../persistedAppearance'

const KEY = 'qr-generator:appearance'

describe('persistedAppearance', () => {
  it('returns defaults when nothing is stored', () => {
    expect(loadPersistedAppearance()).toEqual(defaultAppearance())
  })

  it('round-trips a persisted appearance', () => {
    const appearance = { fgColor: '#112233', bgColor: '#ffeedd', ecLevel: 'H' as const, transparentBg: true }
    persistAppearance(appearance)
    expect(loadPersistedAppearance()).toEqual(appearance)
  })

  it('falls back per-field for malformed colors or EC levels', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ fgColor: 'not-a-color', bgColor: '#abc', ecLevel: 'Z' }),
    )
    const result = loadPersistedAppearance()
    const fallback = defaultAppearance()
    expect(result.fgColor).toBe(fallback.fgColor)
    expect(result.bgColor).toBe('#abc')
    expect(result.ecLevel).toBe(fallback.ecLevel)
  })

  it('returns defaults for non-JSON storage', () => {
    localStorage.setItem(KEY, 'definitely not json')
    expect(loadPersistedAppearance()).toEqual(defaultAppearance())
  })
})
