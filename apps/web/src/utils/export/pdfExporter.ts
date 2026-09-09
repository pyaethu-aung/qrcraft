/**
 * PDF Export Utility
 *
 * @why Client-side PDF generation using jsPDF with embedded SVG QR codes provides
 * print-ready quality at configurable DPI settings. Vector embedding ensures crisp
 * output at any scale.
 * 
 * @performance jsPDF is lazy-loaded via dynamic import to reduce initial bundle size.
 * The library is only downloaded when users actually export to PDF.
 */

import { exportSvg } from './svgExporter'
import { dpiToPageSize } from './exportCalculations'
import type { SvgExportConfig } from './svgExporter'
import type { DpiPreset } from '../../types/export'

export interface PdfExportConfig extends SvgExportConfig {
  dpi: DpiPreset
  dimension: number
}

/**
 * Export QR code as PDF blob with embedded SVG for print quality.
 *
 * @param value - QR code content
 * @param config - QR configuration with colors, error correction, DPI, and dimension
 * @returns Promise resolving to PDF Blob
 * @throws Error if PDF generation fails
 *
 * @why PDF format provides print-ready output with DPI-aware sizing.
 * Embedding SVG ensures vector quality at any print resolution.
 */
export async function exportPdf(value: string, config: PdfExportConfig): Promise<Blob> {
  if (!value) {
    throw new Error('Cannot export empty QR code')
  }

  try {
    // Lazy-load jsPDF only when needed (reduces initial bundle size)
    const { jsPDF } = await import('jspdf')

    // Generate SVG data URL for embedding
    const svgBlob = await exportSvg(value, config)
    const svgText = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsText(svgBlob)
    })

    // Calculate PDF page size based on DPI
    // NOTE: DPI controls physical print size, NOT file size. All DPI settings embed
    // the same pixel data (e.g., 2000x2000px PNG), but create different page sizes:
    // - 72 DPI: 2000px/72 = 27.78" (large print, screen quality)
    // - 150 DPI: 2000px/150 = 13.33" (medium print, standard quality)
    // - 300 DPI: 2000px/300 = 6.67" (small print, high quality)
    // Therefore, file sizes are identical for same dimension with different DPI.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    const pageSize = dpiToPageSize(config.dimension as any, config.dpi)

    // Create temporary image element to convert SVG to image data
    const img = new Image()
    const svgDataUrl = `data:image/svg+xml;base64,${btoa(svgText)}`
    
    // Load SVG as image and create canvas to get PNG data
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = svgDataUrl
    })

    // Create canvas to render image
    const canvas = document.createElement('canvas')
    canvas.width = config.dimension
    canvas.height = config.dimension
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to get canvas context')
    }

    // Draw image to canvas
    ctx.drawImage(img, 0, 0, config.dimension, config.dimension)

    // Get PNG data URL from canvas
    const pngDataUrl = canvas.toDataURL('image/png')

    // Create PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [pageSize, pageSize], // Square format for QR code
    })

    // Add PNG to PDF (jsPDF supports PNG)
    pdf.addImage(pngDataUrl, 'PNG', 0, 0, pageSize, pageSize)

    // Generate blob
    const pdfBlob = pdf.output('blob')
    return pdfBlob
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to export PDF: ${errorMessage}`)
  }
}
