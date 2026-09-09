import { describe, it, expect } from 'vitest'
import { parseBatchCsv, csvRowsToCommaText } from '../parseBatchCsv'

describe('parseBatchCsv', () => {
  it('splits headers from data rows', () => {
    const { headers, rows } = parseBatchCsv('url,name\nhttps://a.com,Alpha\nhttps://b.com,Beta')
    expect(headers).toEqual(['url', 'name'])
    expect(rows).toEqual([
      ['https://a.com', 'Alpha'],
      ['https://b.com', 'Beta'],
    ])
  })

  it('trims surrounding whitespace from headers and cells', () => {
    const { headers, rows } = parseBatchCsv(' url , name \n a , b ')
    expect(headers).toEqual(['url', 'name'])
    expect(rows).toEqual([['a', 'b']])
  })

  it('honours quoted fields containing commas', () => {
    const { rows } = parseBatchCsv('value,label\n"https://x.com/?a=1,b=2","Big, Co"')
    expect(rows).toEqual([['https://x.com/?a=1,b=2', 'Big, Co']])
  })

  it('honours escaped double quotes inside quoted fields', () => {
    const { rows } = parseBatchCsv('value\n"she said ""hi"""')
    expect(rows).toEqual([['she said "hi"']])
  })

  it('keeps quoted newlines within a single field', () => {
    const { headers, rows } = parseBatchCsv('value,note\n"line1\nline2",ok')
    expect(headers).toEqual(['value', 'note'])
    expect(rows).toEqual([['line1\nline2', 'ok']])
  })

  it('accepts CRLF line endings', () => {
    const { headers, rows } = parseBatchCsv('a,b\r\n1,2\r\n3,4')
    expect(headers).toEqual(['a', 'b'])
    expect(rows).toEqual([
      ['1', '2'],
      ['3', '4'],
    ])
  })

  it('pads short rows and truncates long rows to the header width', () => {
    const { rows } = parseBatchCsv('a,b,c\n1\n1,2,3,4')
    expect(rows).toEqual([
      ['1', '', ''],
      ['1', '2', '3'],
    ])
  })

  it('drops fully blank lines', () => {
    const { rows } = parseBatchCsv('a,b\n1,2\n\n3,4\n')
    expect(rows).toEqual([
      ['1', '2'],
      ['3', '4'],
    ])
  })

  it('returns empty structures for empty input', () => {
    expect(parseBatchCsv('')).toEqual({ headers: [], rows: [] })
    expect(parseBatchCsv('\n\n')).toEqual({ headers: [], rows: [] })
  })

  it('handles a header-only file with no data rows', () => {
    expect(parseBatchCsv('url,name')).toEqual({ headers: ['url', 'name'], rows: [] })
  })
})

describe('csvRowsToCommaText', () => {
  it('serializes data rows to comma-separated lines, excluding the header', () => {
    const grid = parseBatchCsv('url,name\nhttps://a.com,Alice\nhttps://b.com,Bob')
    expect(csvRowsToCommaText(grid)).toBe('https://a.com,Alice\nhttps://b.com,Bob')
  })

  it('re-quotes cells containing a comma, quote, or newline', () => {
    const grid = parseBatchCsv('a,b\n"x,y",plain\n"she said ""hi""",z')
    expect(csvRowsToCommaText(grid)).toBe('"x,y",plain\n"she said ""hi""",z')
  })

  it('keeps padded trailing empty cells so column count is preserved', () => {
    const grid = parseBatchCsv('a,b,c\n1')
    expect(csvRowsToCommaText(grid)).toBe('1,,')
  })

  it('returns an empty string for a header-only grid', () => {
    expect(csvRowsToCommaText(parseBatchCsv('a,b'))).toBe('')
  })
})
