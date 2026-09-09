import { useLocaleContext } from '../../hooks/LocaleProvider'
import { ThemeToggle } from '../common/ThemeToggle'
import { LanguageToggle } from '../common/LanguageToggle'

/**
 * Brand mark: the three finder squares every QR code carries, drawn in ink
 * rather than the accent so the Terracotta Economy stays spent on state and
 * actions. Replaces the 🔳 emoji, which rendered as a different glyph on every
 * platform and sat outside the warm palette.
 */
function BrandMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[22px] w-[22px] shrink-0 text-text-primary"
      fill="none"
      aria-hidden
      focusable="false"
    >
      {/* Three finder patterns: outer ring plus solid core. */}
      {[
        [1, 1],
        [14, 1],
        [1, 14],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect
            x={x + 0.75}
            y={y + 0.75}
            width={7.5}
            height={7.5}
            rx={1.75}
            stroke="currentColor"
            strokeWidth={1.5}
          />
          <rect x={x + 3.25} y={y + 3.25} width={2.5} height={2.5} rx={0.6} fill="currentColor" />
        </g>
      ))}
      {/* Sparse data modules in the free quadrant. */}
      <rect x={14} y={14} width={3} height={3} rx={0.7} fill="currentColor" />
      <rect x={19} y={14} width={3} height={3} rx={0.7} fill="currentColor" />
      <rect x={14} y={19} width={3} height={3} rx={0.7} fill="currentColor" />
      <rect x={19} y={19} width={3} height={3} rx={0.7} fill="currentColor" opacity={0.45} />
    </svg>
  )
}

export function Navbar() {
  const { translate } = useLocaleContext()

  return (
    <header className="relative z-50 border-b border-border-subtle bg-surface-overlay">
      <div className="max-w-6xl mx-auto py-4 px-6 sm:px-12 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-semibold text-text-primary">
            <BrandMark />
            {translate('layout.headerTitle')}
          </h1>
          <p className="mt-1 hidden sm:block text-xs sm:text-sm text-text-secondary">{translate('layout.headerSubtitle')}</p>
        </div>

        <nav aria-label={translate('layout.navLabel')} className="flex shrink-0 items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
