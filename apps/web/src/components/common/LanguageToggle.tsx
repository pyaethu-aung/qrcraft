import { ChevronDown, Globe } from 'lucide-react'
import { useLocaleContext } from '../../hooks/LocaleProvider'
import { localeCodes, locales } from '../../data/i18n'
import type { SupportedLocale } from '../../types/i18n'

export function LanguageToggle() {
  const { locale, setLocale, translate } = useLocaleContext()

  return (
    <div className="relative inline-flex items-center">
      <Globe
        size={16}
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
      />
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value as SupportedLocale)}
        aria-label={translate('locale.toggleLabel')}
        className="h-11 cursor-pointer appearance-none rounded-full border border-border-strong bg-surface-raised pl-9 pr-9 text-sm text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
      >
        {localeCodes.map((code) => (
          <option key={code} value={code}>
            {locales[code].locale.name}
          </option>
        ))}
      </select>
      <ChevronDown
        size={15}
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
      />
    </div>
  )
}
