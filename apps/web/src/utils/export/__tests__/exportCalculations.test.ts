import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  calculateScaleFactor,
  dpiToPageSize,
  generateFilename,
  isValidDimension,
  calculateExportDimensions,
} from '../exportCalculations'

describe('exportCalculations', () => {
  describe('calculateScaleFactor', () => {
    it('returns 1 when target equals source', () => {
      expect(calculateScaleFactor(500, 500)).toBe(1)
    })

    it('returns correct scale for larger target', () => {
      expect(calculateScaleFactor(256, 500)).toBe(2) // 500/256 = 1.95, ceil = 2
      expect(calculateScaleFactor(256, 1000)).toBe(4) // 1000/256 = 3.9, ceil = 4
      expect(calculateScaleFactor(256, 2000)).toBe(8) // 2000/256 = 7.8, ceil = 8
    })

    it('returns 1 for source larger than target', () => {
      expect(calculateScaleFactor(1000, 500)).toBe(1) // Minimum scale is 1
    })

    it('handles zero source size gracefully', () => {
      expect(calculateScaleFactor(0, 500)).toBe(1)
    })

    it('handles negative source size gracefully', () => {
      expect(calculateScaleFactor(-100, 500)).toBe(1)
    })
  })

  describe('dpiToPageSize', () => {
    it('calculates correct page size for 72 DPI (screen)', () => {
      // 1000px at 72 DPI = 1000/72 inches = 13.89 inches = 1000 points
      expect(dpiToPageSize(1000, 72)).toBeCloseTo(1000, 1)
    })

    it('calculates correct page size for 150 DPI (standard print)', () => {
      // 1000px at 150 DPI = 1000/150 inches = 6.67 inches = 480 points
      expect(dpiToPageSize(1000, 150)).toBeCloseTo(480, 1)
    })

    it('calculates correct page size for 300 DPI (high-quality print)', () => {
      // 1000px at 300 DPI = 1000/300 inches = 3.33 inches = 240 points
      expect(dpiToPageSize(1000, 300)).toBeCloseTo(240, 1)
    })

    it('handles different dimension presets', () => {
      expect(dpiToPageSize(500, 300)).toBeCloseTo(120, 1)
      expect(dpiToPageSize(2000, 300)).toBeCloseTo(480, 1)
    })
  })

  describe('generateFilename', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-05T12:30:45.123Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('generates PNG filename with dimension', () => {
      const filename = generateFilename('png', 'qrcode', 1000)
      expect(filename).toBe('qrcode-1000px_2026-02-05T12-30-45.png')
    })

    it('generates SVG filename without dimension (resolution-independent)', () => {
      const filename = generateFilename('svg', 'qrcode')
      expect(filename).toBe('qrcode_2026-02-05T12-30-45.svg')
    })

    it('generates PDF filename with dimension and DPI', () => {
      const filename = generateFilename('pdf', 'qrcode', 2000, 300)
      expect(filename).toBe('qrcode-2000px-300dpi_2026-02-05T12-30-45.pdf')
    })

    it('uses custom prefix when provided', () => {
      const filename = generateFilename('png', 'mycode', 500)
      expect(filename).toBe('mycode-500px_2026-02-05T12-30-45.png')
    })

    it('omits dimension when not provided for PNG', () => {
      const filename = generateFilename('png')
      expect(filename).toBe('qrcode_2026-02-05T12-30-45.png')
    })

    it('includes dimension but omits DPI for PNG', () => {
      const filename = generateFilename('png', 'qrcode', 1000, 300)
      expect(filename).toBe('qrcode-1000px_2026-02-05T12-30-45.png') // No DPI for PNG
    })
  })

  describe('isValidDimension', () => {
    it('returns true for valid preset dimensions', () => {
      expect(isValidDimension(500)).toBe(true)
      expect(isValidDimension(1000)).toBe(true)
      expect(isValidDimension(2000)).toBe(true)
    })

    it('returns true for dimension at boundaries', () => {
      expect(isValidDimension(100)).toBe(true)
      expect(isValidDimension(4000)).toBe(true)
    })

    it('returns false for dimension below minimum', () => {
      expect(isValidDimension(99)).toBe(false)
      expect(isValidDimension(0)).toBe(false)
      expect(isValidDimension(-100)).toBe(false)
    })

    it('returns false for dimension above maximum', () => {
      expect(isValidDimension(4001)).toBe(false)
      expect(isValidDimension(10000)).toBe(false)
    })
  })

  describe('calculateExportDimensions', () => {
    it('returns pixel dimensions for PNG format', () => {
      const result = calculateExportDimensions('png', 1000, 72)
      expect(result).toEqual({ width: 1000, height: 1000, unit: 'px' })
    })

    it('returns pixel dimensions for SVG format', () => {
      const result = calculateExportDimensions('svg', 2000, 300)
      expect(result).toEqual({ width: 2000, height: 2000, unit: 'px' })
    })

    it('returns point dimensions for PDF format based on DPI', () => {
      const result = calculateExportDimensions('pdf', 1000, 300)
      expect(result.unit).toBe('pt')
      expect(result.width).toBeCloseTo(240, 1)
      expect(result.height).toBeCloseTo(240, 1)
    })

    it('calculates different PDF sizes for different DPI', () => {
      const result72 = calculateExportDimensions('pdf', 1000, 72)
      const result300 = calculateExportDimensions('pdf', 1000, 300)

      expect(result72.width).toBeGreaterThan(result300.width)
    })
  })
})
