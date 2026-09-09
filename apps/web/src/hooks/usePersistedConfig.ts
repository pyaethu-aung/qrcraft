import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

/**
 * Restores a stored draft, sanitizing it key-by-key against the defaults:
 * unknown keys are dropped and type mismatches fall back to the default, so a
 * stale or hand-edited draft can never poison component state.
 */
function restoreConfig<T extends object>(storageKey: string, defaults: T): T {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return defaults
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return defaults
    const next = { ...defaults }
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const candidate = (parsed as Record<string, unknown>)[key as string]
      if (candidate !== undefined && typeof candidate === typeof defaults[key]) {
        next[key] = candidate as T[keyof T]
      }
    }
    return next
  } catch {
    return defaults
  }
}

/**
 * useState that survives a refresh: restores from localStorage on mount and
 * writes back (debounced one write per pause, not per keystroke) as the value
 * changes. Keys listed in `omit` are stored as their defaults instead of the
 * live value — secrets like a Wi-Fi password stay in memory only.
 *
 * `defaults` and `omit` must be module-level constants (stable identity);
 * passing fresh literals re-arms the write timer on every render.
 *
 * `seed` overlays its defined values onto the restored initial state only (it is read
 * once, in the initializer, never persisted). It lets a caller inject an in-memory value
 * — e.g. a secret from a shared link — into initial state without writing it to storage.
 */
export function usePersistedConfig<T extends object>(
  storageKey: string,
  defaults: T,
  omit: readonly (keyof T)[] = [],
  seed?: Partial<T>,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const restored = restoreConfig(storageKey, defaults)
    if (!seed) return restored
    const next = { ...restored }
    for (const key of Object.keys(seed) as (keyof T)[]) {
      const candidate = seed[key]
      if (candidate !== undefined) next[key] = candidate
    }
    return next
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const draft: Record<string, unknown> = {}
        for (const key of Object.keys(defaults) as (keyof T)[]) {
          draft[key as string] = omit.includes(key) ? defaults[key] : value[key]
        }
        localStorage.setItem(storageKey, JSON.stringify(draft))
      } catch {
        // Ignore if localStorage is unavailable
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [storageKey, value, defaults, omit])

  return [value, setValue]
}
