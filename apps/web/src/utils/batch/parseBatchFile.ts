/**
 * Extracts the first column value from a single CSV line.
 * Handles double-quoted fields; unquoted fields are split at the first comma.
 */
function extractCsvFirstColumn(line: string): string {
  if (!line) return ''
  if (line.startsWith('"')) {
    const closing = line.indexOf('"', 1)
    return closing === -1 ? line.slice(1) : line.slice(1, closing)
  }
  const commaIdx = line.indexOf(',')
  return commaIdx === -1 ? line : line.slice(0, commaIdx)
}

/**
 * Parses the raw text content of an uploaded .txt or .csv file into a
 * newline-separated string suitable for the batch textarea.
 *
 * - .txt  → content returned as-is; the textarea/parseBatchInput handles blank
 *           lines and deduplication downstream.
 * - .csv  → first column of every non-empty row is extracted and joined with
 *           newlines. Every row is included — no header detection.
 *
 * The caller is responsible for checking that the result is non-empty before
 * committing it to state.
 */
export function parseBatchFile(filename: string, content: string): string {
  if (filename.toLowerCase().endsWith('.csv')) {
    return content
      .split('\n')
      .map((line) => extractCsvFirstColumn(line.trim()))
      .filter((value) => value.length > 0)
      .join('\n')
  }
  return content
}
