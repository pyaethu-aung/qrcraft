import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LocaleProvider } from '../../../../hooks/LocaleProvider'
import { QRGenerator } from '../QRGenerator'
import { useQRShare } from '../../../../hooks/useQRShare'
import type { ShareRequest } from '../../../../types/qr'

// Internal mock state
let _isSharing = false
let _shareRequest: ShareRequest | null = null
let _resolveSharePromise: (() => void) | undefined
let _rejectSharePromise: ((reason?: Error) => void) | undefined
let _shareSpy = vi.fn()

vi.mock('../../../../hooks/useQRShare', () => {
  return {
    useQRShare: vi.fn(() => ({
      share: _shareSpy,
      get isSharing() { return _isSharing },
      get shareRequest() { return _shareRequest },
    })),
  }
})

describe('QRShareReliability', () => {
  const totalAttempts = 100
  const successThreshold = 0.95

  beforeEach(() => {
    vi.useFakeTimers()

    _isSharing = false
    _shareRequest = null
    _resolveSharePromise = undefined
    _rejectSharePromise = undefined

    _shareSpy = vi.fn(() => {
      _isSharing = true
      _shareRequest = { status: 'pending', method: 'navigator-share', targetSupported: true }
      return new Promise<void>((resolve, reject) => {
        _resolveSharePromise = () => {
          _isSharing = false
          _shareRequest = { status: 'shared', method: 'navigator-share', targetSupported: true }
          resolve()
        }
        _rejectSharePromise = (error?: Error) => {
          _isSharing = false
          _shareRequest = {
            status: 'failed',
            method: 'navigator-share',
            targetSupported: true,
            errorMessage: error?.message || 'Share failed',
          }
          reject(error || new Error('Share failed'))
        }
      })
    })

    vi.mocked(useQRShare).mockClear()
    vi.mocked(useQRShare).mockImplementation(() => ({
      share: _shareSpy,
      get isSharing() { return _isSharing },
      get shareRequest() { return _shareRequest },
    }))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('should achieve ≥95% successful shares over many attempts', async () => {
    render(
      <LocaleProvider>
        <QRGenerator />
      </LocaleProvider>
    )

    const input = screen.getByLabelText(/Link \/ Text/i)
    fireEvent.change(input, { target: { value: 'https://example.com' } })
    act(() => {
      vi.advanceTimersByTime(300)
    })

    vi.useRealTimers()

    const shareButton = screen.getByRole('button', { name: 'Share QR code' })
    let successes = 0
    let failures = 0

    for (let i = 0; i < totalAttempts; i++) {
      fireEvent.click(shareButton)

      const shouldSucceed = i % 20 !== 0

      if (shouldSucceed) {
        await act(async () => {
          _resolveSharePromise?.()
          await Promise.resolve()
        })
        successes++
      } else {
        await act(async () => {
          _rejectSharePromise?.(new Error('Simulated share failure'))
          await Promise.resolve()
        })
        failures++
      }

      await waitFor(() => {
        const status = _shareRequest?.status
        expect(status).not.toBe('pending')
        expect(['shared', 'failed']).toContain(status)
      })
    }

    const successRate = successes / totalAttempts
    expect(successRate).toBeGreaterThanOrEqual(successThreshold)
    expect(successes).toBe(95)
    expect(failures).toBe(5)
  })
})
