import { useCallback, useEffect, useState } from 'react'
import type { Theme } from '../types/theme'

const STORAGE_KEY = 'qr-generator:theme-preference'
const isBrowser = typeof window !== 'undefined'

export function useTheme() {
  const getSystemTheme = useCallback((): Theme => {
    if (!isBrowser || !window.matchMedia) return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }, [])

  const [theme, setThemeState] = useState<Theme>(() => {
    if (!isBrowser) return 'light'
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'light' || stored === 'dark') return stored
    } catch (e) {
      console.warn('[theme] Could not read from localStorage', e)
    }
    return getSystemTheme()
  })

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    if (isBrowser) {
      try {
        localStorage.setItem(STORAGE_KEY, newTheme)
      } catch (e) {
        console.warn('[theme] Could not write to localStorage', e)
      }
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }, [theme, setTheme])

  useEffect(() => {
    if (!isBrowser || !window.matchMedia) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      // Guarded like every other access in this file: reading site data throws
      // outright in some privacy contexts, and an OS theme change must not
      // take the app down with it.
      let stored: string | null = null
      try {
        stored = localStorage.getItem(STORAGE_KEY)
      } catch (err) {
        console.warn('[theme] Could not read from localStorage', err)
      }
      if (!stored) {
        setThemeState(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark'
  }
}
