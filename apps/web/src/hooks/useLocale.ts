import { useCallback, useEffect, useMemo, useState } from 'react'

import { defaultLocale, getCopy, localeCodes, locales } from '../data/i18n'
import type { SupportedLocale, SeoMetadata, TranslationKey } from '../types/i18n'

const STORAGE_KEY = 'qr-generator:locale-preference'

const isBrowser = typeof window !== 'undefined'

function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && localeCodes.includes(value as SupportedLocale)
}

function readPersistedLocale(): SupportedLocale | null {
  if (!isBrowser) return null

  const storage = window.localStorage
  if (typeof storage?.getItem !== 'function') return null

  try {
    const stored = storage.getItem(STORAGE_KEY)
    return stored && isSupportedLocale(stored) ? stored : null
  } catch (error) {
    console.warn('[i18n] Could not access localStorage for locale preference', error)
    return null
  }
}

function persistLocale(locale: SupportedLocale) {
  if (!isBrowser) return

  const storage = window.localStorage
  if (typeof storage?.setItem !== 'function') return

  try {
    storage.setItem(STORAGE_KEY, locale)
  } catch (error) {
    console.warn('[i18n] Could not persist locale preference', error)
  }
}

export type UseLocaleResult = {
  locale: SupportedLocale
  setLocale: (value: SupportedLocale) => void
  translate: (key: TranslationKey) => string
  seo: SeoMetadata
}

export function useLocale(): UseLocaleResult {
  const fallback = useMemo(() => readPersistedLocale() ?? defaultLocale, [])
  const [locale, setLocaleState] = useState<SupportedLocale>(fallback)

  useEffect(() => {
    persistLocale(locale)
  }, [locale])

  const setLocale = useCallback((value: SupportedLocale) => {
    if (!isSupportedLocale(value)) return
    setLocaleState(value)
  }, [])

  const translate = useCallback((key: TranslationKey) => getCopy(locale, key), [locale])

  const seo = useMemo(() => locales[locale].seo, [locale])

  return useMemo(
    () => ({ locale, setLocale, translate, seo }),
    [locale, setLocale, translate, seo],
  )
}
