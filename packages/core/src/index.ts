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

// Types
// Note: types/index.ts (QRConfig, ValidationResult) is legacy dead code, superseded
// by types/qr.ts's QRConfig and unused anywhere in the codebase; not re-exported here
// to avoid the name collision. The file still moved since "everything in src/types/"
// did, per the spec.
export * from './types/qr'
export * from './types/i18n'
export * from './types/seo'
export * from './types/theme'
export * from './types/export'
