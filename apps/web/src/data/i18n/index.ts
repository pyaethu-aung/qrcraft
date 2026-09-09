import en from './en.json'
import es from './es.json'

import type { LocaleConfig, TranslationKey } from '../../types/i18n'

const localeRegistry = {
  en: en as LocaleConfig,
  es: es as LocaleConfig,
} as const

export const locales = localeRegistry
export type LocaleRegistry = typeof localeRegistry
export type SupportedLocale = keyof LocaleRegistry
export const defaultLocale: SupportedLocale = 'en'
export const localeCodes = Object.keys(localeRegistry) as SupportedLocale[]

const missingTranslationLog = new Set<string>()

/** Flattens a locale's nested copy tree into `"a.b.c" -> string` for O(1) lookups. */
function flattenLocale(node: unknown, prefix: string, out: Map<string, string>): void {
  if (typeof node === 'string') {
    out.set(prefix, node)
    return
  }
  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      flattenLocale(value, prefix ? `${prefix}.${key}` : key, out)
    }
  }
}

const flatLocaleCache = new Map<SupportedLocale, Map<string, string>>()

function getFlatLocale(locale: SupportedLocale): Map<string, string> {
  let flat = flatLocaleCache.get(locale)
  if (!flat) {
    flat = new Map()
    flattenLocale(locales[locale], '', flat)
    flatLocaleCache.set(locale, flat)
  }
  return flat
}

function resolveTranslation(locale: SupportedLocale, key: TranslationKey): string | undefined {
  return getFlatLocale(locale).get(key)
}

function logMissingTranslation(locale: SupportedLocale, key: TranslationKey) {
  if (locale === defaultLocale) return

  const logToken = `${locale}:${key}`
  if (!missingTranslationLog.has(logToken)) {
    missingTranslationLog.add(logToken)
    console.warn(
      `[i18n] Missing translation for "${key}" in ${locale}; falling back to ${defaultLocale}`,
    )
  }
}

export function getCopy(locale: SupportedLocale, key: TranslationKey): string {
  const localizedCopy = resolveTranslation(locale, key)
  if (localizedCopy) {
    return localizedCopy
  }

  logMissingTranslation(locale, key)
  return resolveTranslation(defaultLocale, key) ?? ''
}
