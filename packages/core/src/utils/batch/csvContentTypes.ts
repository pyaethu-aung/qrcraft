/**
 * Declarative descriptor that lets the Batch tab build a real content-type payload for
 * every CSV row, instead of treating each cell as a raw QR string. The user picks a
 * content type (Wi-Fi, contact, event, ...) and maps each of its fields to a column;
 * every row is then fed through the same `buildXString` helpers as the single-QR view,
 * so a batch contact code is byte-for-byte what the live preview would produce.
 *
 * This is also what fixes multi-line payloads (vCard, iCalendar) in batch: the built
 * strings are returned as a structured list and never round-trip through the values
 * textarea, where {@link parseBatchInput} would split them on their internal newlines.
 *
 * Field labels and enum option labels reuse the existing single-QR form translation
 * keys (`controls.*`), so no per-field strings are duplicated.
 */

import type { CryptoNetwork, QRContentMode, WiFiSecurity } from '../../types/qr'
import type { TranslationKey } from '../../types/i18n'
import type { ParsedBatchCsv } from './parseBatchCsv'
import { buildWifiString } from '../wifi'
import { buildVCardString } from '../vcard'
import { buildEmailString } from '../email'
import { buildSmsString } from '../sms'
import { buildTelString } from '../tel'
import { buildGeoString } from '../geo'
import { buildVEventString } from '../vevent'
import { buildCryptoString } from '../crypto'

/** Sentinel for "this field is not mapped to any column". */
export const NO_COLUMN = -1

/**
 * `column` fields read their value from a mapped CSV column (one per row). `enum` and
 * `toggle` fields take a single fixed value applied to every row (a "security: WPA"
 * style setting almost never varies row to row, and a per-row column would add an
 * order of magnitude more validation surface for little gain).
 */
export type CsvFieldKind = 'column' | 'enum' | 'toggle'

export interface CsvFieldOption {
  value: string
  labelKey: TranslationKey
}

export interface CsvField {
  key: string
  labelKey: TranslationKey
  kind: CsvFieldKind
  /** Column fields only: a row missing this builds to '' and is skipped. */
  required?: boolean
  /** enum only: the selectable fixed values. */
  options?: CsvFieldOption[]
  /** enum: initial option value. toggle: 'true' | 'false'. */
  default?: string
}

export interface CsvContentType {
  id: QRContentMode
  labelKey: TranslationKey
  fields: CsvField[]
  /** Builds one payload from a field-value accessor; returns '' when the row is incomplete. */
  build: (get: (key: string) => string) => string
  /**
   * A short, human-readable caption for the Labels sheet (the raw payload makes a useless
   * caption — `WIFI:T:...` or a multi-line vCard). Omitted for `text`, whose value already
   * reads fine, so the Labels renderer falls back to the value itself.
   */
  caption?: (get: (key: string) => string) => string
}

/**
 * The content types offered for CSV mapping, in the same order as the single-QR picker.
 * `text` is the default and reproduces the original behaviour: one column encoded verbatim.
 */
export const CSV_CONTENT_TYPES: CsvContentType[] = [
  {
    id: 'text',
    labelKey: 'scan.typeText',
    fields: [{ key: 'value', labelKey: 'batch.csvMapValueLabel', kind: 'column', required: true }],
    build: (get) => get('value').trim(),
  },
  {
    id: 'wifi',
    labelKey: 'scan.typeWifi',
    fields: [
      { key: 'ssid', labelKey: 'controls.wifiSsidLabel', kind: 'column', required: true },
      { key: 'password', labelKey: 'controls.wifiPasswordLabel', kind: 'column' },
      {
        key: 'security',
        labelKey: 'controls.wifiSecurityLabel',
        kind: 'enum',
        default: 'WPA',
        options: [
          { value: 'WPA', labelKey: 'controls.wifiSecurityWpa' },
          { value: 'WEP', labelKey: 'controls.wifiSecurityWep' },
          { value: 'nopass', labelKey: 'controls.wifiSecurityNone' },
        ],
      },
      { key: 'hidden', labelKey: 'controls.wifiHiddenLabel', kind: 'toggle', default: 'false' },
    ],
    build: (get) =>
      buildWifiString({
        ssid: get('ssid'),
        password: get('password'),
        security: (get('security') || 'WPA') as WiFiSecurity,
        hidden: get('hidden') === 'true',
      }),
    caption: (get) => get('ssid'),
  },
  {
    id: 'vcard',
    labelKey: 'scan.typeVcard',
    fields: [
      { key: 'firstName', labelKey: 'controls.vcardFirstNameLabel', kind: 'column', required: true },
      { key: 'lastName', labelKey: 'controls.vcardLastNameLabel', kind: 'column' },
      { key: 'phone', labelKey: 'controls.vcardPhoneLabel', kind: 'column' },
      { key: 'email', labelKey: 'controls.vcardEmailLabel', kind: 'column' },
      { key: 'company', labelKey: 'controls.vcardCompanyLabel', kind: 'column' },
      { key: 'jobTitle', labelKey: 'controls.vcardJobTitleLabel', kind: 'column' },
      { key: 'website', labelKey: 'controls.vcardWebsiteLabel', kind: 'column' },
    ],
    build: (get) =>
      buildVCardString({
        firstName: get('firstName'),
        lastName: get('lastName'),
        phone: get('phone'),
        email: get('email'),
        company: get('company'),
        jobTitle: get('jobTitle'),
        website: get('website'),
      }),
    caption: (get) =>
      [get('firstName'), get('lastName')].map((part) => part.trim()).filter(Boolean).join(' '),
  },
  {
    id: 'email',
    labelKey: 'scan.typeEmail',
    fields: [
      { key: 'to', labelKey: 'controls.emailToLabel', kind: 'column', required: true },
      { key: 'subject', labelKey: 'controls.emailSubjectLabel', kind: 'column' },
      { key: 'body', labelKey: 'controls.emailBodyLabel', kind: 'column' },
    ],
    build: (get) =>
      buildEmailString({ to: get('to'), subject: get('subject'), body: get('body') }),
    caption: (get) => get('to'),
  },
  {
    id: 'sms',
    labelKey: 'scan.typeSms',
    fields: [
      { key: 'number', labelKey: 'controls.smsNumberLabel', kind: 'column', required: true },
      { key: 'message', labelKey: 'controls.smsMessageLabel', kind: 'column' },
    ],
    build: (get) => buildSmsString({ number: get('number'), message: get('message') }),
    caption: (get) => get('number'),
  },
  {
    id: 'tel',
    labelKey: 'scan.typeTel',
    fields: [{ key: 'number', labelKey: 'controls.telNumberLabel', kind: 'column', required: true }],
    build: (get) => buildTelString({ number: get('number') }),
    caption: (get) => get('number'),
  },
  {
    id: 'geo',
    labelKey: 'scan.typeGeo',
    fields: [
      { key: 'latitude', labelKey: 'controls.geoLatitudeLabel', kind: 'column', required: true },
      { key: 'longitude', labelKey: 'controls.geoLongitudeLabel', kind: 'column', required: true },
    ],
    build: (get) =>
      buildGeoString({ latitude: get('latitude'), longitude: get('longitude') }),
    caption: (get) => `${get('latitude')},${get('longitude')}`,
  },
  {
    id: 'vevent',
    labelKey: 'scan.typeVevent',
    fields: [
      { key: 'summary', labelKey: 'controls.veventSummaryLabel', kind: 'column', required: true },
      { key: 'start', labelKey: 'controls.veventStartLabel', kind: 'column', required: true },
      { key: 'end', labelKey: 'controls.veventEndLabel', kind: 'column' },
      { key: 'allDay', labelKey: 'controls.veventAllDayLabel', kind: 'toggle', default: 'false' },
      { key: 'location', labelKey: 'controls.veventLocationLabel', kind: 'column' },
      { key: 'description', labelKey: 'controls.veventDescriptionLabel', kind: 'column' },
    ],
    build: (get) =>
      buildVEventString({
        summary: get('summary'),
        start: get('start'),
        end: get('end'),
        allDay: get('allDay') === 'true',
        location: get('location'),
        description: get('description'),
      }),
    caption: (get) => get('summary').replace(/\s+/g, ' ').trim(),
  },
  {
    id: 'crypto',
    labelKey: 'scan.typeCrypto',
    fields: [
      {
        key: 'network',
        labelKey: 'controls.cryptoNetworkLabel',
        kind: 'enum',
        default: 'bitcoin',
        options: [
          { value: 'bitcoin', labelKey: 'controls.cryptoNetworkBitcoin' },
          { value: 'ethereum', labelKey: 'controls.cryptoNetworkEthereum' },
        ],
      },
      { key: 'address', labelKey: 'controls.cryptoAddressLabel', kind: 'column', required: true },
      { key: 'amount', labelKey: 'controls.cryptoAmountLabel', kind: 'column' },
      { key: 'label', labelKey: 'controls.cryptoLabelLabel', kind: 'column' },
    ],
    build: (get) =>
      buildCryptoString({
        network: (get('network') || 'bitcoin') as CryptoNetwork,
        address: get('address'),
        amount: get('amount'),
        label: get('label'),
      }),
    caption: (get) => get('network'),
  },
]

/** Looks up a content type by id, falling back to `text` for an unknown id. */
export function getCsvContentType(id: QRContentMode): CsvContentType {
  return CSV_CONTENT_TYPES.find((type) => type.id === id) ?? CSV_CONTENT_TYPES[0]
}

/** Strips a header/field name to bare lowercase alphanumerics for tolerant matching. */
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Initial column assignments when a content type is chosen: each column field is matched
 * to a header whose normalized name equals the field key (so a CSV with `ssid,password`
 * columns wires up on its own). Unmatched fields stay unmapped, except the lone `text`
 * value field, which falls back to the first column so an import is immediately usable.
 */
export function autoMapColumns(
  grid: ParsedBatchCsv,
  type: CsvContentType,
): Record<string, number> {
  const columns: Record<string, number> = {}
  for (const field of type.fields) {
    if (field.kind !== 'column') continue
    const match = grid.headers.findIndex((header) => normalizeName(header) === field.key.toLowerCase())
    if (match !== NO_COLUMN) columns[field.key] = match
    else columns[field.key] = type.id === 'text' ? 0 : NO_COLUMN
  }
  return columns
}

/** Default fixed values (enum / toggle) for a content type's non-column fields. */
export function defaultFixedValues(type: CsvContentType): Record<string, string> {
  const fixed: Record<string, string> = {}
  for (const field of type.fields) {
    if (field.kind === 'column') continue
    fixed[field.key] = field.default ?? field.options?.[0]?.value ?? ''
  }
  return fixed
}

export interface CsvMapping {
  type: QRContentMode
  /** column-field key -> column index (or {@link NO_COLUMN}). */
  columns: Record<string, number>
  /** enum/toggle-field key -> fixed value. */
  fixed: Record<string, string>
  /** Column that names each output file, or {@link NO_COLUMN} for the automatic name. */
  filenameCol: number
}

export interface CsvBuildResult {
  /** Built payloads, one per row that produced a non-empty value (pre dedup/cap). */
  values: string[]
  /**
   * value -> filename map for the chosen filename column (first occurrence wins, matching
   * the dedup downstream), or `null` when no filename column is mapped.
   */
  filenameOverrides: Record<string, string> | null
  /**
   * value -> Labels-sheet caption map (first occurrence wins), or `null` when the content
   * type has no caption rule (`text`), so the Labels renderer falls back to the value.
   */
  captionOverrides: Record<string, string> | null
}

/**
 * Builds every row's payload for the chosen content type and column mapping. Rows that
 * build to '' (a missing required field, or a value the builder rejects as invalid) are
 * skipped, so the live count reflects exactly what will be generated.
 */
export function buildCsvValues(grid: ParsedBatchCsv, mapping: CsvMapping): CsvBuildResult {
  const type = getCsvContentType(mapping.type)
  const hasFilename = mapping.filenameCol !== NO_COLUMN
  const values: string[] = []
  const overrides: Record<string, string> = {}
  const captions: Record<string, string> = {}

  for (const row of grid.rows) {
    const get = (key: string): string => {
      const field = type.fields.find((f) => f.key === key)
      if (!field) return ''
      if (field.kind === 'column') {
        const col = mapping.columns[key]
        return col === undefined || col === NO_COLUMN ? '' : (row[col] ?? '')
      }
      return mapping.fixed[key] ?? field.default ?? ''
    }

    const value = type.build(get)
    if (!value) continue
    values.push(value)

    if (hasFilename && !(value in overrides)) {
      const name = row[mapping.filenameCol] ?? ''
      if (name) overrides[value] = name
    }
    if (type.caption && !(value in captions)) {
      const caption = type.caption(get)
      if (caption) captions[value] = caption
    }
  }

  return {
    values,
    filenameOverrides: hasFilename ? overrides : null,
    captionOverrides: Object.keys(captions).length > 0 ? captions : null,
  }
}
