import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LocaleProvider } from '../../../../hooks/LocaleProvider'
import { QRGenerator } from '../QRGenerator'
import { useQRShare } from '../../../../hooks/useQRShare'
import type { ShareRequest } from '../../../../types/qr'

// Internal state for the mock
let _isSharing = false
let _shareRequest: ShareRequest | null = null
let _resolveSharePromise: (() => void) | undefined
let _rejectSharePromise: ((reason?: Error) => void) | undefined
let _shareSpy = vi.fn()

vi.mock('../../../../hooks/useQRShare', () => {
  return {
    useQRShare: vi.fn(() => ({
      share: _shareSpy,
      get isSharing() {
        return _isSharing
      },
      get shareRequest() {
        return _shareRequest
      },
    })),
  }
})

describe('QRSharePerf', () => {
  beforeEach(() => {
    vi.useFakeTimers()

    _isSharing = false
    _shareRequest = null
    _resolveSharePromise = undefined
    _rejectSharePromise = undefined

    _shareSpy = vi.fn(() => {
      _isSharing = true
      _shareRequest = { status: 'pending', method: 'clipboard', targetSupported: true }
      return new Promise<void>((resolve, reject) => {
        _resolveSharePromise = () => {
          _isSharing = false
          _shareRequest = { status: 'shared', method: 'clipboard', targetSupported: true }
          resolve()
        }
        _rejectSharePromise = (error?: Error) => {
          const rejectionError = error ?? new Error('Share failed')
          _isSharing = false
          _shareRequest = {
            status: 'failed',
            method: 'clipboard',
            targetSupported: true,
            errorMessage: rejectionError.message,
          }
          reject(rejectionError)
        }
      })
    })

    vi.mocked(useQRShare).mockClear()
    vi.mocked(useQRShare).mockImplementation(() => ({
      share: _shareSpy,
      get isSharing() {
        return _isSharing
      },
      get shareRequest() {
        return _shareRequest
      },
    }))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('should complete share successfully', async () => {
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
    fireEvent.click(shareButton)

    expect(_shareSpy).toHaveBeenCalledWith(expect.any(HTMLCanvasElement))
    expect(_isSharing).toBe(true)
    expect(_shareRequest?.status).toBe('pending')

    await act(async () => {
      _resolveSharePromise?.()
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(_isSharing).toBe(false)
      expect(_shareRequest?.status).toBe('shared')
    })
  })

  it('should handle share failure and update status', async () => {
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
    fireEvent.click(shareButton)

    expect(_isSharing).toBe(true)
    expect(_shareRequest?.status).toBe('pending')

    const errorMessage = 'Share operation failed!'
    await act(async () => {
      _rejectSharePromise?.(new Error(errorMessage))
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(_isSharing).toBe(false)
      expect(_shareRequest?.status).toBe('failed')
    })
  })
})
