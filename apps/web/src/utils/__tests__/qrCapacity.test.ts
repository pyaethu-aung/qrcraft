import { describe, it, expect } from 'vitest'
import {
  QR_BYTE_CAPACITY,
  CAPACITY_NEAR_LIMIT_RATIO,
  contentByteLength,
  getCapacityStatus,
} from '../qrCapacity'

describe('contentByteLength', () => {
  it('counts ASCII as one byte each', () => {
    expect(contentByteLength('hello')).toBe(5)
  })

  it('counts an empty string as zero', () => {
    expect(contentByteLength('')).toBe(0)
  })

  it('counts multi-byte characters by their UTF-8 length', () => {
    // é is two bytes, 🎉 is four — not one "character" each, as QR capacity sees it.
    expect(contentByteLength('é')).toBe(2)
    expect(contentByteLength('🎉')).toBe(4)
  })
})

describe('getCapacityStatus', () => {
  it('reports zero usage for empty content', () => {
    const status = getCapacityStatus('', 'M')
    expect(status.used).toBe(0)
    expect(status.max).toBe(QR_BYTE_CAPACITY.M)
    expect(status.ratio).toBe(0)
    expect(status.isNearLimit).toBe(false)
    expect(status.isOverLimit).toBe(false)
  })

  it('uses the capacity for the active error-correction level', () => {
    expect(getCapacityStatus('x', 'L').max).toBe(2953)
    expect(getCapacityStatus('x', 'H').max).toBe(1273)
  })

  it('measures usage in bytes, not characters', () => {
    expect(getCapacityStatus('🎉🎉', 'L').used).toBe(8)
  })

  it('is neither near nor over while comfortably under capacity', () => {
    const status = getCapacityStatus('x'.repeat(100), 'H')
    expect(status.isNearLimit).toBe(false)
    expect(status.isOverLimit).toBe(false)
  })

  it('flags near-limit once within the warning band but still encodable', () => {
    const max = QR_BYTE_CAPACITY.H
    const used = Math.ceil(max * CAPACITY_NEAR_LIMIT_RATIO)
    const status = getCapacityStatus('x'.repeat(used), 'H')
    expect(status.isNearLimit).toBe(true)
    expect(status.isOverLimit).toBe(false)
  })

  it('treats exactly-at-capacity as near, not over', () => {
    const status = getCapacityStatus('x'.repeat(QR_BYTE_CAPACITY.H), 'H')
    expect(status.used).toBe(status.max)
    expect(status.isNearLimit).toBe(true)
    expect(status.isOverLimit).toBe(false)
  })

  it('flags over-limit past capacity and stops calling it near', () => {
    const status = getCapacityStatus('x'.repeat(QR_BYTE_CAPACITY.H + 1), 'H')
    expect(status.isOverLimit).toBe(true)
    expect(status.isNearLimit).toBe(false)
    expect(status.ratio).toBeGreaterThan(1)
  })
})
