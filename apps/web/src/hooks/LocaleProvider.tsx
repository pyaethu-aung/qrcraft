import type { PropsWithChildren } from 'react'
import { createContext, useContext, useEffect } from 'react'

import { useLocale } from './useLocale'
import type { UseLocaleResult } from './useLocale'

const LocaleContext = createContext<UseLocaleResult | undefined>(undefined)

export function LocaleProvider({ children }: PropsWithChildren) {
  const localeState = useLocale()

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.lang = localeState.locale
  }, [localeState.locale])

  return <LocaleContext.Provider value={localeState}>{children}</LocaleContext.Provider>
}

export function useLocaleContext() {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocaleContext must be used within LocaleProvider')
  }

  return context
}
