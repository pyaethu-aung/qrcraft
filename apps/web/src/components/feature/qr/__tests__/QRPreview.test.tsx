import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LocaleProvider } from '../../../../hooks/LocaleProvider'
import { QRPreview } from '../QRPreview'

describe('QRPreview', () => {
  const defaultProps = {
    value: '',
    ecLevel: 'M' as const,
    fgColor: '#000000',
    bgColor: '#ffffff',
    designConfig: {
      eyeFrameShape: 'Square' as const,
      eyeCenterShape: 'Square' as const,
      eyeFrameColor: null,
      eyeCenterColor: null,
      pixelPattern: 'Square' as const,
    },
  }

  it('renders placeholder when value is empty', () => {
    render(
      <LocaleProvider>
        <QRPreview {...defaultProps} value="" />
      </LocaleProvider>,
    )

    expect(screen.getByText('QR preview')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'QR Code Placeholder' })).toBeInTheDocument()
  })

  it('explains the empty state when a blocked reason is supplied', () => {
    render(
      <LocaleProvider>
        <QRPreview {...defaultProps} value="" placeholderHint="Add a start date to finish your QR code." />
      </LocaleProvider>,
    )

    expect(screen.queryByText('QR preview')).not.toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Add a start date to finish your QR code.' }),
    ).toBeInTheDocument()
  })

  it('does not render a download button inside the preview', () => {
    render(
      <LocaleProvider>
        <QRPreview {...defaultProps} value="" />
      </LocaleProvider>,
    )

    expect(screen.queryByTestId('download-qr-button')).not.toBeInTheDocument()
  })

  it('renders QR code canvas when value is provided', () => {
    render(
      <LocaleProvider>
        <QRPreview {...defaultProps} value="https://example.com" />
      </LocaleProvider>,
    )

    expect(screen.queryByText('Enter text to generate')).not.toBeInTheDocument()

    const qrCode = screen.getByTestId('qr-code-canvas')
    expect(qrCode).toBeInTheDocument()
    expect(qrCode).toHaveAttribute('aria-label', 'QR Code for value: https://example.com')
  })

  it('applies foreground and background colors correctly', () => {
    const customProps = {
      ...defaultProps,
      value: 'Test Color',
      fgColor: '#FF0000',
      bgColor: '#0000FF',
    }

    render(
      <LocaleProvider>
        <QRPreview {...customProps} />
      </LocaleProvider>,
    )

    const canvas = screen.getByTestId('qr-code-canvas')
    expect(canvas).toHaveAttribute('data-fg', '#FF0000')
    expect(canvas).toHaveAttribute('data-bg', '#0000FF')
  })

  it('renders with custom size', () => {
    render(
      <LocaleProvider>
        <QRPreview {...defaultProps} value="Test Size" size={128} />
      </LocaleProvider>,
    )

    const canvas = screen.getByTestId('qr-code-canvas')
    expect(canvas).toHaveAttribute('width', '128')
    expect(canvas).toHaveAttribute('height', '128')
  })

  it('handles forwardedRef as a function', () => {
    const ref = vi.fn()
    render(
      <LocaleProvider>
        <QRPreview {...defaultProps} value="https://example.com" ref={ref} />
      </LocaleProvider>,
    )
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLCanvasElement))
  })

  it('handles forwardedRef as an object', () => {
    const ref = { current: null }
    render(
      <LocaleProvider>
        <QRPreview {...defaultProps} value="https://example.com" ref={ref} />
      </LocaleProvider>,
    )
    expect(ref.current).toBeInstanceOf(HTMLCanvasElement)
  })
})
