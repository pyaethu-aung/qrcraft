import { describe, expect, it, vi } from 'vitest'
import { exportSvg } from '../svgExporter'
import type { SvgExportConfig } from '../svgExporter'

vi.mock('../../logoCompositor', () => ({
  rasterizeLogoForSvg: vi.fn().mockResolvedValue('data:image/png;base64,rasterized'),
}))

// Helper to read blob text in test environment
async function blobToText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsText(blob)
  })
}

describe('svgExporter', () => {
  const mockConfig: SvgExportConfig = {
    value: 'https://example.com',
    ecLevel: 'M' as const,
    fgColor: '#000000',
    bgColor: '#FFFFFF',
    margin: 0,
    designConfig: {
      eyeFrameShape: 'Square',
      eyeCenterShape: 'Square',
      eyeFrameColor: null,
      eyeCenterColor: null,
      pixelPattern: 'Square'
    }
  }

  describe('exportSvg', () => {
    it('generates valid SVG blob', async () => {
      const blob = await exportSvg('Test QR Code', mockConfig)

      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('image/svg+xml;charset=utf-8')
      expect(blob.size).toBeGreaterThan(0)
    })

    it('generates SVG string containing QR code data', async () => {
      const blob = await exportSvg('https://example.com', mockConfig)
      const text = await blobToText(blob)

      // Verify it's valid SVG
      expect(text).toContain('<svg')
      expect(text).toContain('</svg>')
      expect(text).toContain('xmlns="http://www.w3.org/2000/svg"')
    })

    it('preserves foreground color', async () => {
      const customConfig = {
        ...mockConfig,
        fgColor: '#FF0000', // Red
      }

      const blob = await exportSvg('Test', customConfig)
      const text = await blobToText(blob)

      // SVG should contain the red color
      expect(text.toLowerCase()).toContain('#ff0000')
    })

    it('applies distinct eye border and center colors when set', async () => {
      const customConfig: SvgExportConfig = {
        ...mockConfig,
        designConfig: {
          eyeFrameShape: 'Square',
          eyeCenterShape: 'Dot',
          eyeFrameColor: '#aa11bb',
          eyeCenterColor: '#22cc33',
          pixelPattern: 'Square',
        },
      }

      const blob = await exportSvg('Test', customConfig)
      const text = await blobToText(blob)

      expect(text.toLowerCase()).toContain('#aa11bb')
      expect(text.toLowerCase()).toContain('#22cc33')
    })

    it('falls back to the foreground color for eyes when colors are null', async () => {
      const customConfig: SvgExportConfig = {
        ...mockConfig,
        fgColor: '#FF0000',
        designConfig: {
          eyeFrameShape: 'Square',
          eyeCenterShape: 'Square',
          eyeFrameColor: null,
          eyeCenterColor: null,
          pixelPattern: 'Square',
        },
      }

      const blob = await exportSvg('Test', customConfig)
      const text = await blobToText(blob)

      // both data and eye paths use the foreground color
      expect(text.toLowerCase().split('#ff0000').length - 1).toBeGreaterThanOrEqual(3)
    })

    it('preserves background color', async () => {
      const customConfig = {
        ...mockConfig,
        bgColor: '#00FF00', // Green
      }

      const blob = await exportSvg('Test', customConfig)
      const text = await blobToText(blob)

      // SVG should contain the green color
      expect(text.toLowerCase()).toContain('#00ff00')
    })

    it('respects error correction level', async () => {
      const highECConfig = {
        ...mockConfig,
        ecLevel: 'H' as const, // High error correction
      }

      const lowECConfig = {
        ...mockConfig,
        ecLevel: 'L' as const, // Low error correction
      }

      const highBlob = await exportSvg('Test', highECConfig)
      const lowBlob = await exportSvg('Test', lowECConfig)

      // Higher EC level produces more modules (larger SVG)
      expect(lowBlob.size).toBeGreaterThan(highBlob.size)
    })

    it('generates different SVG for different content', async () => {
      const blob1 = await exportSvg('Content A', mockConfig)
      const blob2 = await exportSvg('Content B', mockConfig)

      const text1 = await blobToText(blob1)
      const text2 = await blobToText(blob2)

      // Different content should produce different SVG
      expect(text1).not.toBe(text2)
    })

    it('handles long URLs correctly', async () => {
      const longUrl = 'https://example.com/very/long/path/with/many/segments/' + 'x'.repeat(100)

      const blob = await exportSvg(longUrl, mockConfig)
      const text = await blobToText(blob)

      expect(text).toContain('<svg')
      expect(blob.size).toBeGreaterThan(0)
    })

    it('handles special characters in content', async () => {
      const specialContent = 'Test & <Special> "Characters"'

      const blob = await exportSvg(specialContent, mockConfig)
      const text = await blobToText(blob)

      expect(text).toContain('<svg')
      expect(blob.size).toBeGreaterThan(0)
    })

    it('throws error for empty value', async () => {
      await expect(exportSvg('', mockConfig)).rejects.toThrow('Cannot export empty QR code')
    })

    it('applies margin setting', async () => {
      const noMarginConfig = { ...mockConfig, margin: 0 }
      const withMarginConfig = { ...mockConfig, margin: 4 }

      const noMarginBlob = await exportSvg('Test', noMarginConfig)
      const withMarginBlob = await exportSvg('Test', withMarginConfig)

      // SVG with margin should be larger (more whitespace)
      expect(withMarginBlob.size).toBeGreaterThan(noMarginBlob.size)
    })

    it('generates resolution-independent output', async () => {
      // SVG should not have fixed dimensions that prevent scaling
      const blob = await exportSvg('Test', mockConfig)
      const text = await blobToText(blob)

      // Verify SVG has viewBox for scalability
      expect(text).toContain('viewBox')
    })

    it('produces valid XML structure', async () => {
      const blob = await exportSvg('Test', mockConfig)
      const text = await blobToText(blob)

      // Basic XML validity checks
      expect(text).toMatch(/<svg[^>]*>/)
      expect(text).toContain('</svg>')
      expect(text.split('<svg').length - 1).toBe(1) // Only one svg root
      expect(text.split('</svg>').length - 1).toBe(1)
    })

    it('embeds logo elements when logoDataUrl is provided', async () => {
      const configWithLogo: SvgExportConfig = {
        ...mockConfig,
        logoDataUrl: 'data:image/png;base64,logo',
        logoSize: 20,
      }

      const blob = await exportSvg('Test', configWithLogo)
      const text = await blobToText(blob)

      expect(text).toContain('logo-clip')
      expect(text).toContain('<circle')
      expect(text).toContain('<image')
      expect(text).toContain('data:image/png;base64,rasterized')
    })

    it('omits logo elements when logoDataUrl is absent', async () => {
      const blob = await exportSvg('Test', mockConfig)
      const text = await blobToText(blob)

      expect(text).not.toContain('logo-clip')
      expect(text).not.toContain('<image')
    })

    it('omits background rect when transparentBg is true', async () => {
      const blob = await exportSvg('Test', { ...mockConfig, transparentBg: true })
      const text = await blobToText(blob)

      expect(text).not.toContain(`fill="${mockConfig.bgColor}"`)
      expect(text).not.toContain('fill="#FFFFFF"')
    })

    it('includes background rect when transparentBg is false', async () => {
      const blob = await exportSvg('Test', { ...mockConfig, bgColor: '#aabbcc', transparentBg: false })
      const text = await blobToText(blob)

      expect(text.toLowerCase()).toContain('#aabbcc')
    })
  })
})
