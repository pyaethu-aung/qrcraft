import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { ReactElement } from 'react'
import { LocaleProvider } from '../../../../hooks/LocaleProvider'
import { QRGenerator } from '../QRGenerator'

describe('QRGenerator Integration', () => {
  const renderWithProviders = (ui: ReactElement) => render(<LocaleProvider>{ui}</LocaleProvider>)

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render the generator layout', () => {
    renderWithProviders(<QRGenerator />)
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Preview')).toBeInTheDocument()
  })

  it('seeds Text mode from a scanner round-trip', () => {
    renderWithProviders(<QRGenerator seed={{ value: 'seeded text', token: 1 }} />)
    expect(screen.getByLabelText(/Link \/ Text/i)).toHaveValue('seeded text')
  })

  it('should show placeholder initially', () => {
    renderWithProviders(<QRGenerator />)
    expect(screen.getByRole('img', { name: /qr code placeholder/i })).toBeInTheDocument()
    expect(screen.queryByTestId('qr-code-canvas')).not.toBeInTheDocument()
  })

  it('should not render a Generate button', () => {
    renderWithProviders(<QRGenerator />)
    expect(screen.queryByRole('button', { name: /generate qr code/i })).not.toBeInTheDocument()
  })

  it('should show QR code after typing input and debounce delay', () => {
    renderWithProviders(<QRGenerator />)

    const input = screen.getByLabelText(/Link \/ Text/i)
    fireEvent.change(input, { target: { value: 'https://example.com' } })

    // Canvas should not appear before the debounce fires
    expect(screen.queryByTestId('qr-code-canvas')).not.toBeInTheDocument()

    // Advance past the 300ms debounce
    act(() => {
      vi.advanceTimersByTime(300)
    })

    const qrCode = screen.getByTestId('qr-code-canvas')
    expect(qrCode).toBeInTheDocument()
    expect(qrCode).toHaveAttribute('data-value', 'https://example.com')

    // Placeholder gone
    expect(screen.queryByRole('img', { name: /qr code placeholder/i })).not.toBeInTheDocument()
  })

  it('renders accessible preview aria labels after input debounce', () => {
    renderWithProviders(<QRGenerator />)

    const input = screen.getByLabelText(/Link \/ Text/i)
    fireEvent.change(input, { target: { value: 'keyboard.com' } })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(
      screen.getByRole('img', { name: /qr code for value: keyboard.com/i }),
    ).toBeInTheDocument()
  })

  it('updates the live preview when settings change without re-typing', () => {
    renderWithProviders(<QRGenerator />)

    const input = screen.getByLabelText(/Link \/ Text/i)
    fireEvent.change(input, { target: { value: 'https://example.com' } })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(screen.getByTestId('qr-code-canvas')).toHaveAttribute('data-value', 'https://example.com')

    // Changing EC level should not remove the preview — no Generate click needed
    fireEvent.click(screen.getByRole('button', { name: 'Highest (30%)' }))

    expect(screen.getByTestId('qr-code-canvas')).toBeInTheDocument()
  })

  it('disables the copy-link button until there is content', () => {
    renderWithProviders(<QRGenerator />)
    expect(screen.getByRole('button', { name: /copy link/i })).toBeDisabled()
  })

  it('copies a shareable #c= link and confirms success', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })

    renderWithProviders(<QRGenerator />)
    const input = screen.getByLabelText(/Link \/ Text/i)
    fireEvent.change(input, { target: { value: 'https://example.com' } })
    act(() => {
      vi.advanceTimersByTime(300)
    })

    const copyButton = screen.getByRole('button', { name: /copy link/i })
    expect(copyButton).toBeEnabled()

    await act(async () => {
      fireEvent.click(copyButton)
      await Promise.resolve()
    })

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('#c='))
    expect(screen.getByRole('button', { name: /link copied/i })).toBeInTheDocument()
  })

  it('surfaces an error when the clipboard write fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })

    renderWithProviders(<QRGenerator />)
    const input = screen.getByLabelText(/Link \/ Text/i)
    fireEvent.change(input, { target: { value: 'https://example.com' } })
    act(() => {
      vi.advanceTimersByTime(300)
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy link/i }))
      await Promise.resolve()
    })

    expect(screen.getByText(/couldn't copy the link/i)).toBeInTheDocument()
  })
})
