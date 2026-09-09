import en from './en.json'
import es from './es.json'
import type { LocaleConfig } from '../types/i18n'

// The single source of truth for which locales @qrcraft/core ships copy for,
// and the registry consumers (apps/web's data/i18n/index.ts, and any future
// consumer) should build on rather than re-deriving their own. Add a new
// locale by adding its JSON here; SupportedLocale and SUPPORTED_LOCALES widen
// from it with no other type edits.
export const localeRegistry = {
  en: en as LocaleConfig,
  es: es as LocaleConfig,
} as const

export type LocaleRegistry = typeof localeRegistry
export type SupportedLocale = keyof LocaleRegistry
export const SUPPORTED_LOCALES = Object.keys(localeRegistry) as SupportedLocale[]
