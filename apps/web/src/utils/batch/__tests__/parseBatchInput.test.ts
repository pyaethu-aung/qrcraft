import { describe, it, expect } from 'vitest'
import { parseBatchInput, BATCH_MAX_LINES } from '../parseBatchInput'

describe('parseBatchInput', () => {
  it('returns empty values for empty or whitespace-only input', () => {
    expect(parseBatchInput('')).toEqual({ values: [], total: 0, truncated: false })
    expect(parseBatchInput('   \n\t\n  ')).toEqual({ values: [], total: 0, truncated: false })
  })

  it('splits on newlines and trims each line', () => {
    const result = parseBatchInput('  https://a.com \n b.com\n\nc.com  ')
    expect(result.values).toEqual(['https://a.com', 'b.com', 'c.com'])
    expect(result.total).toBe(3)
    expect(result.truncated).toBe(false)
  })

  it('de-duplicates repeated lines after trimming', () => {
    const result = parseBatchInput('a.com\na.com\n  a.com  \nb.com')
    expect(result.values).toEqual(['a.com', 'b.com'])
    expect(result.total).toBe(2)
  })

  it('caps values at BATCH_MAX_LINES and flags truncation', () => {
    const lines = Array.from({ length: BATCH_MAX_LINES + 5 }, (_, i) => `line-${i}`)
    const result = parseBatchInput(lines.join('\n'))
    expect(result.values).toHaveLength(BATCH_MAX_LINES)
    expect(result.total).toBe(BATCH_MAX_LINES + 5)
    expect(result.truncated).toBe(true)
  })

  it('does not flag truncation at exactly the cap', () => {
    const lines = Array.from({ length: BATCH_MAX_LINES }, (_, i) => `line-${i}`)
    const result = parseBatchInput(lines.join('\n'))
    expect(result.values).toHaveLength(BATCH_MAX_LINES)
    expect(result.truncated).toBe(false)
  })
})
