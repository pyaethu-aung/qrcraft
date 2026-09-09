import { describe, it, expect } from 'vitest'
import { truncateWithEllipsis } from '../textFormat'

describe('truncateWithEllipsis', () => {
  it('returns the value unchanged when at or under the limit', () => {
    expect(truncateWithEllipsis('hello', 5)).toBe('hello')
    expect(truncateWithEllipsis('hi', 5)).toBe('hi')
  })

  it('truncates and appends an ellipsis when over the limit', () => {
    expect(truncateWithEllipsis('hello world', 5)).toBe('hello…')
  })

  it('handles an empty string', () => {
    expect(truncateWithEllipsis('', 5)).toBe('')
  })

  it('handles a zero limit', () => {
    expect(truncateWithEllipsis('hello', 0)).toBe('…')
  })
})
