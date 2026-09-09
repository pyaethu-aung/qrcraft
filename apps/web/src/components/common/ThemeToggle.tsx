import { Sun, Moon } from 'lucide-react'
import { useThemeContext } from '../../hooks/ThemeProvider'
import { useLocaleContext } from '../../hooks/LocaleProvider'

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeContext()
  const { translate } = useLocaleContext()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border-strong bg-surface-raised text-text-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
      aria-label={isDark ? translate('layout.themeToggleToLight') : translate('layout.themeToggleToDark')}
    >
      {isDark ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
    </button>
  )
}
