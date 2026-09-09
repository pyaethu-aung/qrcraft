import { describe, it, expect } from 'vitest'
import { parseBatchFile } from '../parseBatchFile'

describe('parseBatchFile', () => {
  describe('.txt files', () => {
    it('returns content as-is', () => {
      const content = 'https://example.com\nhello world\nfoo'
      expect(parseBatchFile('list.txt', content)).toBe(content)
    })

    it('returns empty string for empty file', () => {
      expect(parseBatchFile('list.txt', '')).toBe('')
    })

    it('preserves blank lines (downstream parseBatchInput strips them)', () => {
      const content = 'a\n\nb'
      expect(parseBatchFile('list.txt', content)).toBe(content)
    })

    it('treats uppercase .TXT as a text file', () => {
      const content = 'line one\nline two'
      expect(parseBatchFile('EXPORT.TXT', content)).toBe(content)
    })
  })

  describe('.csv files', () => {
    it('extracts the first column from each row', () => {
      const csv = 'https://example.com,Label A\nhttps://other.com,Label B'
      expect(parseBatchFile('data.csv', csv)).toBe('https://example.com\nhttps://other.com')
    })

    it('handles rows with no comma (single-column CSV)', () => {
      const csv = 'https://example.com\nhttps://other.com'
      expect(parseBatchFile('data.csv', csv)).toBe('https://example.com\nhttps://other.com')
    })

    it('handles double-quoted first fields', () => {
      const csv = '"Table 3 QR",extra\n"Welcome message",extra'
      expect(parseBatchFile('data.csv', csv)).toBe('Table 3 QR\nWelcome message')
    })

    it('handles quoted fields that contain commas', () => {
      const csv = '"Smith, John",dept\nhttps://a.com,label'
      expect(parseBatchFile('data.csv', csv)).toBe('Smith, John\nhttps://a.com')
    })

    it('filters out empty lines', () => {
      const csv = 'a,1\n\n\nb,2'
      expect(parseBatchFile('data.csv', csv)).toBe('a\nb')
    })

    it('returns empty string when all rows are empty', () => {
      expect(parseBatchFile('data.csv', '\n\n\n')).toBe('')
    })

    it('treats uppercase .CSV as a csv file', () => {
      const csv = 'hello,world\nfoo,bar'
      expect(parseBatchFile('EXPORT.CSV', csv)).toBe('hello\nfoo')
    })

    it('includes every row — no header detection', () => {
      const csv = 'url,label\nhttps://example.com,Home\nhttps://other.com,About'
      expect(parseBatchFile('data.csv', csv)).toBe('url\nhttps://example.com\nhttps://other.com')
    })
  })
})
