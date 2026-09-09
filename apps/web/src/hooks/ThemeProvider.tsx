import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useTheme } from './useTheme'
import type { ThemeContextType } from '../types/theme'

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const themeState = useTheme()
  const { theme } = themeState

  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    // Read the value back off --color-surface rather than repeating the hex.
    // The class is already applied above, so the computed value is the theme's.
    // index.html's boot script still carries literals: it runs before any CSS
    // has loaded, which is the whole point of it.
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (meta) {
      const surface = getComputedStyle(root).getPropertyValue('--color-surface').trim()
      if (surface) meta.content = surface
    }
  }, [theme])

  useEffect(() => {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      requestAnimationFrame(() => {
        document.documentElement.classList.add('transitions-ready')
      })
    }
  }, [])

  return (
    <ThemeContext.Provider value={themeState}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useThemeContext() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider')
  }
  return context
}
