import { useState, useCallback } from 'react'
import {
  loadPresets,
  savePreset,
  deletePreset,
  clearPresets,
  type PresetEntry,
  type NewPresetEntry,
} from '../utils/presets'

export type { PresetEntry }

export function useQRPresets() {
  const [presets, setPresets] = useState<PresetEntry[]>(loadPresets)

  const save = useCallback((entry: NewPresetEntry) => {
    setPresets(savePreset(entry))
  }, [])

  const remove = useCallback((id: string) => {
    setPresets(deletePreset(id))
  }, [])

  const clear = useCallback(() => {
    clearPresets()
    setPresets([])
  }, [])

  return { presets, save, remove, clear }
}
