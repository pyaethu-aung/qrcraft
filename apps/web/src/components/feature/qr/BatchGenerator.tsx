import { useId, useRef, useState } from 'react'
import { Layers, Package, Check, Palette, Upload, FileText, Columns3, ChevronDown } from 'lucide-react'
import { parseBatchFile } from '../../../utils/batch/parseBatchFile'
import {
  parseBatchCsv,
  csvRowsToCommaText,
  type ParsedBatchCsv,
} from '../../../utils/batch/parseBatchCsv'
import {
  CSV_CONTENT_TYPES,
  getCsvContentType,
  autoMapColumns,
  defaultFixedValues,
  buildCsvValues,
  NO_COLUMN,
  type CsvBuildResult,
} from '../../../utils/batch/csvContentTypes'
import type { QRContentMode } from '../../../types/qr'

import { PillGroup } from '../../common/PillGroup'
import { Callout } from '../../common/Callout'
import { useBatchGenerator, type BatchOutput } from '../../../hooks/useBatchGenerator'
import {
  LABEL_SHEET_PRESETS,
  getLabelPreset,
  type LabelPresetId,
} from '../../../utils/batch/labelSheetLayout'
import { useLocaleContext } from '../../../hooks/LocaleProvider'
import { useFileDrop } from '../../../hooks/useFileDrop'

// File formats are proper nouns: identical across locales, so they aren't translated.
// "Labels" is a word, so it carries a translation key (filled in per-render below).
const BASE_FORMAT_OPTIONS: { value: BatchOutput; label: string }[] = [
  { value: 'png', label: 'PNG' },
  { value: 'svg', label: 'SVG' },
  { value: 'pdf', label: 'PDF' },
]

// Page name + grid dimensions read the same in every locale, so preset labels aren't
// translated, matching the format pills.
const LAYOUT_OPTIONS: { value: LabelPresetId; label: string }[] = LABEL_SHEET_PRESETS.map(
  (preset) => ({ value: preset.id, label: preset.label }),
)

/** How many built payloads to show in the structured-mapping preview. */
const PREVIEW_LIMIT = 3
/** Collapse a multi-line payload to a single readable line for the preview. */
const previewLine = (value: string) => value.replace(/\s+/g, ' ').trim().slice(0, 72)

/** Styled native select shared by the column pickers and the fixed enum/toggle pickers. */
function MappingSelect({
  label,
  required,
  value,
  onChange,
  options,
}: {
  label: string
  required?: boolean
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  const id = useId()
  return (
    <div className="flex-1 space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium text-text-secondary">
        {label}
        {required && (
          <span aria-hidden className="ml-0.5 text-error">
            *
          </span>
        )}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-border-strong bg-surface-inset py-2 pl-3 pr-9 text-sm text-text-primary transition-colors focus-visible:border-focus-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring/25"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={15}
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
        />
      </div>
    </div>
  )
}

export function BatchGenerator() {
  const { translate } = useLocaleContext()
  const {
    input,
    setInput,
    format,
    setFormat,
    labelPreset,
    setLabelPreset,
    captions,
    setCaptions,
    setFilenameOverrides,
    setCaptionOverrides,
    setPreparedValues,
    values,
    truncated,
    status,
    progress,
    errorCode,
    generate,
    maxLines,
  } = useBatchGenerator()

  const isGenerating = status === 'generating'

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importedFileName, setImportedFileName] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  // The parsed CSV grid drives the column-mapping UI; null when no multi-column CSV is active.
  const [csvGrid, setCsvGrid] = useState<ParsedBatchCsv | null>(null)
  const [contentType, setContentType] = useState<QRContentMode>('text')
  // Per-field column assignments (column fields) and fixed values (enum/toggle fields).
  const [columns, setColumns] = useState<Record<string, number>>({})
  const [fixed, setFixed] = useState<Record<string, string>>({})
  const [filenameCol, setFilenameCol] = useState(NO_COLUMN)

  // Leaving mapping mode (manual edit, .txt import, or a single-column CSV) clears the grid,
  // the prepared values, and any filename overrides so stale mappings never apply.
  function clearMapping() {
    setCsvGrid(null)
    setContentType('text')
    setColumns({})
    setFixed({})
    setFilenameCol(NO_COLUMN)
    setFilenameOverrides(null)
    setCaptionOverrides(null)
    setPreparedValues(null)
  }

  /**
   * Builds every row's payload for the given mapping and pushes the result into the hook.
   * The textarea is left untouched: while a grid is active it shows the uploaded file's rows
   * as a read-only source view, and `preparedValues` (not the textarea) drives generation, so
   * a payload that legitimately contains newlines (vCard, iCalendar) is never split on its own
   * lines. Returns the build result for callers that need to react to an empty mapping.
   */
  function applyMapping(
    grid: ParsedBatchCsv,
    typeId: QRContentMode,
    cols: Record<string, number>,
    fixedValues: Record<string, string>,
    fnCol: number,
  ): CsvBuildResult {
    const result = buildCsvValues(grid, {
      type: typeId,
      columns: cols,
      fixed: fixedValues,
      filenameCol: fnCol,
    })
    setPreparedValues(result.values)
    setFilenameOverrides(result.filenameOverrides)
    setCaptionOverrides(result.captionOverrides)
    return result
  }

  // Shared by the Import button and the textarea drop zone: validate the type, read the file,
  // and route a multi-column CSV into the mapping UI or everything else into the textarea.
  function processFile(file: File) {
    const name = file.name.toLowerCase()
    if (!name.endsWith('.txt') && !name.endsWith('.csv')) {
      setFileError(translate('batch.importErrorType'))
      setImportedFileName(null)
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result
      if (typeof text !== 'string') {
        setFileError(translate('batch.importErrorRead'))
        setImportedFileName(null)
        return
      }

      // A multi-column CSV opens the mapping UI; everything else (one-column CSV or .txt)
      // takes the simple first-column / pass-through path with no mapping.
      if (name.endsWith('.csv')) {
        const grid = parseBatchCsv(text)
        if (grid.headers.length >= 2 && grid.rows.length > 0) {
          const type = getCsvContentType('text')
          const cols = autoMapColumns(grid, type)
          const fixedValues = defaultFixedValues(type)
          const result = buildCsvValues(grid, {
            type: 'text',
            columns: cols,
            fixed: fixedValues,
            filenameCol: NO_COLUMN,
          })
          if (result.values.length === 0) {
            setFileError(translate('batch.importErrorEmpty'))
            setImportedFileName(null)
            return
          }
          setCsvGrid(grid)
          setContentType('text')
          setColumns(cols)
          setFixed(fixedValues)
          setFilenameCol(NO_COLUMN)
          setPreparedValues(result.values)
          setFilenameOverrides(null)
          setCaptionOverrides(null)
          // Show the file's data rows as a read-only source view; the mapping below (not this
          // text) drives generation while a grid is active.
          setInput(csvRowsToCommaText(grid))
          setFileError(null)
          setImportedFileName(file.name)
          return
        }
      }

      const parsed = parseBatchFile(file.name, text)
      if (!parsed.trim()) {
        setFileError(translate('batch.importErrorEmpty'))
        setImportedFileName(null)
        return
      }
      clearMapping()
      setInput(parsed)
      setFileError(null)
      setImportedFileName(file.name)
    }
    reader.onerror = () => {
      setFileError(translate('batch.importErrorRead'))
      setImportedFileName(null)
    }
    reader.readAsText(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    processFile(file)
  }

  const { isDragging, onDragEnter, onDragOver, onDragLeave, onDrop } = useFileDrop(
    processFile,
    { disabled: isGenerating },
  )

  function handleTypeChange(nextId: QRContentMode) {
    if (!csvGrid) return
    const type = getCsvContentType(nextId)
    const nextColumns = autoMapColumns(csvGrid, type)
    const nextFixed = defaultFixedValues(type)
    setContentType(nextId)
    setColumns(nextColumns)
    setFixed(nextFixed)
    applyMapping(csvGrid, nextId, nextColumns, nextFixed, filenameCol)
  }

  function handleColumnChange(key: string, col: number) {
    if (!csvGrid) return
    const next = { ...columns, [key]: col }
    setColumns(next)
    applyMapping(csvGrid, contentType, next, fixed, filenameCol)
  }

  function handleFixedChange(key: string, val: string) {
    if (!csvGrid) return
    const next = { ...fixed, [key]: val }
    setFixed(next)
    applyMapping(csvGrid, contentType, columns, next, filenameCol)
  }

  function handleFilenameColChange(col: number) {
    if (!csvGrid) return
    setFilenameCol(col)
    applyMapping(csvGrid, contentType, columns, fixed, col)
  }

  const textareaId = useId()
  const formatLabelId = useId()
  const layoutLabelId = useId()
  const captionsLabelId = useId()
  const isLabels = format === 'labels'

  const formatOptions = [
    ...BASE_FORMAT_OPTIONS,
    { value: 'labels' as BatchOutput, label: translate('batch.formatLabelsOption') },
  ]
  const captionOptions = [
    { value: 'on', label: translate('batch.captionsOn') },
    { value: 'off', label: translate('batch.captionsOff') },
  ]
  const selectedPreset = getLabelPreset(labelPreset)
  const perPageHint = translate('batch.perPageHint').replace(
    '{count}',
    String(selectedPreset.columns * selectedPreset.rows),
  )
  const count = values.length
  const canGenerate = count > 0 && !isGenerating
  const percent = progress.total ? Math.round((progress.completed / progress.total) * 100) : 0

  const currentType = getCsvContentType(contentType)
  // A CSV mapping is active: the textarea is a read-only source view of the uploaded rows and
  // `preparedValues` (not the textarea) drives the generated codes.
  const mappingActive = csvGrid !== null
  const isStructured = mappingActive && contentType !== 'text'
  const headerOptions = csvGrid
    ? csvGrid.headers.map((header, i) => ({ value: String(i), label: header || `Column ${i + 1}` }))
    : []
  const noneOption = { value: String(NO_COLUMN), label: translate('batch.csvMapColumnNone') }
  const previewValues = values.slice(0, PREVIEW_LIMIT)

  const countLabel = translate('batch.countLabel')
    .replace('{count}', String(count))
    .replace('{max}', String(maxLines))
  const truncatedWarning = translate('batch.truncatedWarning').replace('{max}', String(maxLines))
  const generatingStatus = translate('batch.generatingStatus')
    .replace('{completed}', String(progress.completed))
    .replace('{total}', String(progress.total))

  return (
    <section className="relative isolate overflow-x-hidden px-2 pb-12 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-xl space-y-3">
        <div className="text-center pt-10 pb-4 px-6 sm:px-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-text-secondary">
            {translate('batch.sectionLabel')}
          </p>
          <h2 className="mt-1.5 text-2xl font-bold text-text-primary sm:text-4xl">
            {translate('batch.title')}
          </h2>
          <p className="mt-2 text-sm text-text-secondary">{translate('batch.subtitle')}</p>
        </div>

        <div className="rounded-xl border border-border-strong bg-surface-overlay p-6 sm:p-8 shadow-lg space-y-5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor={textareaId} className="text-sm font-semibold text-text-primary">
                {translate('batch.inputLabel')}
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating}
                className="flex items-center gap-1.5 rounded-md border border-border-strong bg-surface-raised px-2.5 py-1 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-inset hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1"
              >
                <Upload size={12} aria-hidden className="shrink-0" />
                {translate('batch.importButton')}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv"
                className="sr-only"
                aria-hidden="true"
                tabIndex={-1}
                onChange={handleFileChange}
              />
            </div>
            <div
              className="relative"
              onDragEnter={onDragEnter}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <textarea
                id={textareaId}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  setImportedFileName(null)
                  setFileError(null)
                  clearMapping()
                }}
                disabled={isGenerating}
                readOnly={mappingActive}
                rows={mappingActive ? 5 : 9}
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
                placeholder={
                  mappingActive
                    ? translate('batch.csvStructuredPlaceholder')
                    : translate('batch.inputPlaceholder')
                }
                className="w-full resize-y rounded-lg border border-border-strong bg-surface-inset p-3 font-['Geist_Mono'] text-sm text-text-primary placeholder:text-text-secondary transition-colors focus-visible:border-focus-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring/25 disabled:opacity-50"
              />
              {isDragging && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-action bg-surface-overlay/90 text-sm font-semibold text-action backdrop-blur-sm"
                >
                  <Upload size={20} className="shrink-0" />
                  {translate('batch.dropHint')}
                </div>
              )}
            </div>
            {fileError ? (
              <p className="flex items-center gap-1.5 text-xs text-error" role="alert">
                {fileError}
              </p>
            ) : importedFileName ? (
              <p className="flex items-center gap-1.5 text-xs text-text-secondary" aria-live="polite">
                <FileText size={12} aria-hidden className="shrink-0 text-action" />
                {translate('batch.importedFile').replace('{filename}', importedFileName)}
              </p>
            ) : (
              <p className="text-xs text-text-secondary" aria-live="polite">
                {count > 0 ? countLabel : translate('batch.emptyHint')}
              </p>
            )}
          </div>

          {csvGrid && (
            <div className="space-y-3 rounded-lg border border-border-subtle bg-surface-raised p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
                  <Columns3 size={15} aria-hidden className="shrink-0 text-action" />
                  {translate('batch.csvMapTitle')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    clearMapping()
                    setInput('')
                    setImportedFileName(null)
                  }}
                  disabled={isGenerating}
                  className="-mr-1 rounded-md px-2 py-1 text-xs font-semibold text-text-secondary transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1"
                >
                  {translate('batch.csvMapClear')}
                </button>
              </div>

              <MappingSelect
                label={translate('batch.csvMapTypeLabel')}
                value={contentType}
                onChange={(value) => handleTypeChange(value as QRContentMode)}
                options={CSV_CONTENT_TYPES.map((type) => ({
                  value: type.id,
                  label: translate(type.labelKey),
                }))}
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {currentType.fields.map((field) =>
                  field.kind === 'column' ? (
                    <MappingSelect
                      key={field.key}
                      label={translate(field.labelKey)}
                      required={field.required}
                      value={String(columns[field.key] ?? NO_COLUMN)}
                      onChange={(value) => handleColumnChange(field.key, Number(value))}
                      options={[noneOption, ...headerOptions]}
                    />
                  ) : (
                    <MappingSelect
                      key={field.key}
                      label={translate(field.labelKey)}
                      value={fixed[field.key] ?? field.default ?? ''}
                      onChange={(value) => handleFixedChange(field.key, value)}
                      options={
                        field.kind === 'enum'
                          ? (field.options ?? []).map((option) => ({
                              value: option.value,
                              label: translate(option.labelKey),
                            }))
                          : [
                              { value: 'false', label: translate('batch.csvToggleNo') },
                              { value: 'true', label: translate('batch.csvToggleYes') },
                            ]
                      }
                    />
                  ),
                )}
                {!isLabels && (
                  <MappingSelect
                    label={translate('batch.csvMapFilenameLabel')}
                    value={String(filenameCol)}
                    onChange={(value) => handleFilenameColChange(Number(value))}
                    options={[
                      { value: String(NO_COLUMN), label: translate('batch.csvMapFilenameNone') },
                      ...headerOptions,
                    ]}
                  />
                )}
              </div>

              <p className="text-xs text-text-secondary">
                {translate(isStructured ? 'batch.csvMapStructuredHint' : 'batch.csvMapHint')}
              </p>

              {mappingActive && previewValues.length > 0 && (
                <ul className="space-y-1 rounded-md bg-surface-inset p-2.5 font-['Geist_Mono'] text-xs text-text-secondary">
                  {previewValues.map((value, i) => (
                    <li key={i} className="truncate">
                      {previewLine(value)}
                    </li>
                  ))}
                  {count > previewValues.length && (
                    <li className="text-text-secondary">
                      {translate('batch.csvPreviewMore').replace(
                        '{count}',
                        String(count - previewValues.length),
                      )}
                    </li>
                  )}
                </ul>
              )}
            </div>
          )}

          {truncated && <Callout role="status">{truncatedWarning}</Callout>}

          <div className="space-y-2">
            <p id={formatLabelId} className="text-sm font-semibold text-text-primary">
              {translate('batch.formatLabel')}
            </p>
            <PillGroup<BatchOutput>
              aria-labelledby={formatLabelId}
              value={format}
              onChange={setFormat}
              options={formatOptions}
            />
          </div>

          {isLabels && (
            <div className="space-y-5">
              <div className="space-y-2">
                <p id={layoutLabelId} className="text-sm font-semibold text-text-primary">
                  {translate('batch.layoutLabel')}
                </p>
                <PillGroup<LabelPresetId>
                  aria-labelledby={layoutLabelId}
                  value={labelPreset}
                  onChange={setLabelPreset}
                  options={LAYOUT_OPTIONS}
                />
                <p className="text-xs text-text-secondary" aria-live="polite">
                  {perPageHint}
                </p>
              </div>

              <div className="space-y-2">
                <p id={captionsLabelId} className="text-sm font-semibold text-text-primary">
                  {translate('batch.captionsLabel')}
                </p>
                <PillGroup
                  aria-labelledby={captionsLabelId}
                  value={captions ? 'on' : 'off'}
                  onChange={(value) => setCaptions(value === 'on')}
                  options={captionOptions}
                />
              </div>
            </div>
          )}

          <p className="flex items-center gap-2 text-xs text-text-secondary">
            <Palette size={14} aria-hidden className="shrink-0" />
            <span>{translate('batch.designNote')}</span>
          </p>

          <button
            type="button"
            onClick={() => void generate()}
            disabled={!canGenerate}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-action px-6 text-sm font-semibold text-action-fg shadow-sm transition-colors hover:bg-action/90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
          >
            {isGenerating ? (
              <>
                <Layers size={16} aria-hidden className="motion-safe:animate-pulse shrink-0" />
                <span>{generatingStatus}</span>
              </>
            ) : (
              <>
                <Package size={16} aria-hidden className="shrink-0" />
                <span>
                  {translate(isLabels ? 'batch.generateLabels' : 'batch.generateButton')}
                </span>
              </>
            )}
          </button>

          {isGenerating && (
            <div className="space-y-1.5">
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-surface-inset"
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={generatingStatus}
              >
                <div
                  className="h-full w-full origin-left rounded-full bg-action transition-transform duration-150 ease-out"
                  style={{ transform: `scaleX(${percent / 100})` }}
                />
              </div>
              <p role="status" aria-live="polite" className="text-center text-xs text-text-secondary">
                {generatingStatus}
              </p>
            </div>
          )}

          {status === 'success' && (
            <p
              role="status"
              aria-live="polite"
              className="flex items-center justify-center gap-1.5 text-sm font-medium text-action"
            >
              <Check size={15} aria-hidden className="shrink-0" />
              <span>
                {translate(isLabels ? 'batch.successStatusLabels' : 'batch.successStatus')}
              </span>
            </p>
          )}

          {status === 'error' && errorCode && (
            <Callout role="alert">
              {translate(errorCode === 'empty' ? 'batch.errorEmpty' : 'batch.errorRender')}
            </Callout>
          )}
        </div>
      </div>
    </section>
  )
}

export default BatchGenerator
