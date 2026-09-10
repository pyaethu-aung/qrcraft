// Payload builders
export * from './utils/wifi'
export * from './utils/vcard'
export * from './utils/email'
export * from './utils/sms'
export * from './utils/tel'
export * from './utils/geo'
export * from './utils/vevent'
export * from './utils/crypto'
export * from './utils/url'

// QR geometry
export * from './utils/qrShapeRenderer'

// Validation and maths
export * from './utils/qrCapacity'
export * from './utils/contrast'
export * from './utils/gradient'
export * from './utils/phone'
export * from './utils/country'
export * from './utils/qrClassify'

// Batch parsing
export * from './utils/batch/parseBatchInput'
export * from './utils/batch/parseBatchCsv'
export * from './utils/batch/csvContentTypes'
export * from './utils/batch/batchFilename'

// Misc pure helpers
export * from './utils/concurrency'
export * from './utils/textFormat'

// Data
export * from './data/countries'

// i18n registry: the single source of truth for locale codes and copy.
// apps/web's data/i18n/index.ts builds its getCopy()/flatten logic on top of
// this rather than re-deriving its own registry.
export * from './i18n/locales'

// Types
export type * from './types/qr'
export type * from './types/i18n'
export type * from './types/seo'
export type * from './types/theme'
export * from './types/export'
