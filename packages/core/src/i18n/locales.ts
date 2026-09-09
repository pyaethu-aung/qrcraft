// Single source of truth for which locales @qrcraft/core ships copy for.
// Add a new locale by adding its JSON here (packages/core/src/i18n/<code>.json)
// and to this list; SupportedLocale widens from it with no other type edits.
export const SUPPORTED_LOCALES = ['en', 'es'] as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]
