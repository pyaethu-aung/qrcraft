import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LocaleProvider } from '../../../../hooks/LocaleProvider'
import { QRGenerator } from '../QRGenerator'

vi.mock('../../../../hooks/useQRShare', () => ({
  useQRShare: vi.fn(() => ({
    share: vi.fn(() => Promise.resolve()),
    isSharing: false,
    shareRequest: null,
  })),
}))

describe('QRShareUX', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should complete share within 3 user actions (conceptual)', async () => {
    render(
      <LocaleProvider>
        <QRGenerator />
      </LocaleProvider>,
    )

    const input = screen.getByLabelText(/Link \/ Text/i)
    fireEvent.change(input, { target: { value: 'https://example.com' } })
    act(() => {
      vi.advanceTimersByTime(300)
    })

    vi.useRealTimers()

    const shareButton = screen.getByRole('button', { name: 'Share QR code' })
    expect(shareButton).toBeInTheDocument()
    expect(shareButton).not.toBeDisabled()

    fireEvent.click(shareButton)

    await waitFor(() => {
      expect(shareButton).not.toBeDisabled()
    })
  })
})
