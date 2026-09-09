/**
 * Parses CSV text into a header row plus data rows so the Batch tab can offer
 * column mapping (choose which column holds the QR value, and optionally which
 * column names the output file).
 *
 * This is the richer counterpart to {@link parseBatchFile}: where that collapses a
 * CSV to its first column for the simple paste flow, this preserves the full grid.
 *
 * The first non-empty line is always treated as the header — the mapping UI only
 * appears for multi-column CSVs, where a header row is the near-universal convention.
 * Every data row is normalised to the header's column count (missing trailing cells
 * become empty strings; extra cells are dropped) so column indices stay valid.
 *
 * Handles the common CSV dialect: double-quoted fields may contain commas, newlines,
 * and escaped quotes (`""`); unquoted fields are split on commas. Both `\n` and
 * `\r\n` line endings are accepted.
 */

export interface ParsedBatchCsv {
  /** Column names from the first non-empty line. */
  headers: string[]
  /** Data rows after the header, each padded/truncated to `headers.length`. */
  rows: string[][]
}

/**
 * Splits CSV text into rows of fields using a small state machine so quoted fields
 * (which may embed commas and newlines) are honoured. Fully empty rows are dropped.
 */
function parseCsvGrid(content: string): string[][] {
  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let inQuotes = false
  let i = 0

  const pushField = () => {
    row.push(field)
    field = ''
  }
  const pushRow = () => {
    pushField()
    // Drop rows that are entirely empty (e.g. a trailing newline).
    if (row.some((cell) => cell.length > 0)) rows.push(row)
    row = []
  }

  while (i < content.length) {
    const char = content[i]

    if (inQuotes) {
      if (char === '"') {
        if (content[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i += 1
        continue
      }
      field += char
      i += 1
      continue
    }

    if (char === '"') {
      inQuotes = true
      i += 1
      continue
    }
    if (char === ',') {
      pushField()
      i += 1
      continue
    }
    if (char === '\r') {
      // Swallow the \r of a \r\n pair; a lone \r also ends the row.
      if (content[i + 1] === '\n') i += 1
      pushRow()
      i += 1
      continue
    }
    if (char === '\n') {
      pushRow()
      i += 1
      continue
    }

    field += char
    i += 1
  }

  // Flush the final field/row when the file does not end in a newline.
  if (field.length > 0 || row.length > 0) pushRow()

  return rows
}

export function parseBatchCsv(content: string): ParsedBatchCsv {
  const grid = parseCsvGrid(content)
  if (grid.length === 0) return { headers: [], rows: [] }

  const headers = grid[0].map((cell) => cell.trim())
  const width = headers.length
  const rows = grid.slice(1).map((row) => {
    const normalised = row.slice(0, width).map((cell) => cell.trim())
    while (normalised.length < width) normalised.push('')
    return normalised
  })

  return { headers, rows }
}

/** Quotes a single cell RFC-4180 style: wrap in `"..."` (doubling inner quotes) only when
 *  the cell contains a comma, quote, or newline, so plain cells stay untouched. */
function serializeCsvCell(cell: string): string {
  return /[",\r\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell
}

/**
 * Serializes a parsed grid's data rows (the header is excluded) back to comma-separated
 * lines, one row per line. Used to show an uploaded multi-column CSV's content in the batch
 * textarea as a read-only source view while the column-mapping UI drives generation.
 */
export function csvRowsToCommaText(grid: ParsedBatchCsv): string {
  return grid.rows.map((row) => row.map(serializeCsvCell).join(',')).join('\n')
}
