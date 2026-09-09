import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, expect, it, beforeEach, afterEach, vi, type MockedFunction } from 'vitest'
import { LocaleProvider } from '../../../../hooks/LocaleProvider'
import { QRGenerator } from '../QRGenerator'
import type { SharePayload } from '../../../../types/qr'

type CreateSharePayloadFn = (canvas: HTMLCanvasElement | null) => Promise<SharePayload>
type PayloadToFileFn = (payload: SharePayload) => File
type SupportsNavigatorShareFn = () => boolean
type CanShareFilesFn = (files: File[]) => boolean
type SupportsClipboardImageFn = () => boolean
type CopyPayloadToClipboardFn = (payload: SharePayload) => Promise<void>
type DownloadPayloadFn = (payload: SharePayload) => void
type IsMobileDeviceFn = () => boolean

vi.mock('../../../../utils/share', () => {
  const createSharePayload = vi.fn()
  const payloadToFile = vi.fn()
  const supportsNavigatorShare = vi.fn<SupportsNavigatorShareFn>(() => false)
  const canShareFiles = vi.fn<CanShareFilesFn>(() => false)
  const supportsClipboardImage = vi.fn<SupportsClipboardImageFn>(() => false)
  const copyPayloadToClipboard = vi.fn<CopyPayloadToClipboardFn>(() => Promise.resolve())
  const downloadPayload = vi.fn<DownloadPayloadFn>(() => undefined)
  const isMobileDevice = vi.fn<IsMobileDeviceFn>(() => false)

  return {
    createSharePayload,
    payloadToFile,
    supportsNavigatorShare,
    canShareFiles,
    supportsClipboardImage,
    copyPayloadToClipboard,
    downloadPayload,
    isMobileDevice,
  }
})

let createSharePayloadMock: MockedFunction<CreateSharePayloadFn>
let payloadToFileMock: MockedFunction<PayloadToFileFn>
let supportsNavigatorShareMock: MockedFunction<SupportsNavigatorShareFn>
let canShareFilesMock: MockedFunction<CanShareFilesFn>
let supportsClipboardImageMock: MockedFunction<SupportsClipboardImageFn>
let copyPayloadToClipboardMock: MockedFunction<CopyPayloadToClipboardFn>
let downloadPayloadMock: MockedFunction<DownloadPayloadFn>
let isMobileDeviceMock: MockedFunction<IsMobileDeviceFn>

describe('QRShareFallback', () => {
  const mockBlob = new Blob(['PNG'], { type: 'image/png' })
  const mockFilename = 'qr-code.png'
  const mockPayload: SharePayload = {
    blob: mockBlob,
    filename: mockFilename,
    lastUpdated: new Date(0),
  }
  const mockFile = new File([mockBlob], mockFilename, { type: mockBlob.type })

  beforeEach(() => {
    vi.useFakeTimers()
    return vi.importMock('../../../../utils/share').then((shareModule) => {
      const resolvedModule = shareModule as typeof import('../../../../utils/share')
      createSharePayloadMock = vi.mocked(resolvedModule.createSharePayload)
      payloadToFileMock = vi.mocked(resolvedModule.payloadToFile)
      supportsNavigatorShareMock = vi.mocked(resolvedModule.supportsNavigatorShare)
      canShareFilesMock = vi.mocked(resolvedModule.canShareFiles)
      supportsClipboardImageMock = vi.mocked(resolvedModule.supportsClipboardImage)
      copyPayloadToClipboardMock = vi.mocked(resolvedModule.copyPayloadToClipboard)
      downloadPayloadMock = vi.mocked(resolvedModule.downloadPayload)
      isMobileDeviceMock = vi.mocked(resolvedModule.isMobileDevice)
      createSharePayloadMock.mockResolvedValue(mockPayload)
      payloadToFileMock.mockReturnValue(mockFile)
      supportsNavigatorShareMock.mockReturnValue(false)
      canShareFilesMock.mockReturnValue(false)
      supportsClipboardImageMock.mockReturnValue(false)
      isMobileDeviceMock.mockReturnValue(false)
      copyPayloadToClipboardMock.mockResolvedValue(undefined)
      downloadPayloadMock.mockReturnValue(undefined)
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.resetAllMocks()
  })

  const renderWithQR = (url = 'https://example.com') => {
    render(
      <LocaleProvider>
        <QRGenerator />
      </LocaleProvider>,
    )
    const input = screen.getByLabelText(/Link \/ Text/i)
    fireEvent.change(input, { target: { value: url } })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    vi.useRealTimers()
  }

  it('copies QR payload to clipboard when native share is unavailable', async () => {
    supportsClipboardImageMock.mockReturnValue(true)

    renderWithQR()

    const shareButton = screen.getByRole('button', { name: 'Share QR code' })
    fireEvent.click(shareButton)

    await waitFor(() => expect(copyPayloadToClipboardMock).toHaveBeenCalledWith(mockPayload))
    expect(downloadPayloadMock).not.toHaveBeenCalled()
  })

  it('downloads QR payload when clipboard fallback is not supported', async () => {
    supportsClipboardImageMock.mockReturnValue(false)

    renderWithQR()

    const shareButton = screen.getByRole('button', { name: 'Share QR code' })
    fireEvent.click(shareButton)

    await waitFor(() => expect(downloadPayloadMock).toHaveBeenCalledWith(mockPayload))
    expect(copyPayloadToClipboardMock).not.toHaveBeenCalled()
  })

  const capabilityMatrix = [
    {
      title: 'falls back to clipboard when native share is unavailable',
      supportsNavigatorShare: false,
      canShareFiles: false,
      clipboardAvailable: true,
      expectClipboard: true,
    },
    {
      title: 'falls back to download when native share is unavailable and clipboard unsupported',
      supportsNavigatorShare: false,
      canShareFiles: false,
      clipboardAvailable: false,
      expectClipboard: false,
    },
    {
      title: 'falls back to clipboard when native share cannot share files',
      supportsNavigatorShare: true,
      canShareFiles: false,
      clipboardAvailable: true,
      expectClipboard: true,
    },
    {
      title:
        'falls back to download when native share cannot share files and clipboard unsupported',
      supportsNavigatorShare: true,
      canShareFiles: false,
      clipboardAvailable: false,
      expectClipboard: false,
    },
  ] as const

  describe('capability matrix for fallbacks', () => {
    capabilityMatrix.forEach((scenario) => {
      it(scenario.title, async () => {
        supportsNavigatorShareMock.mockReturnValue(scenario.supportsNavigatorShare)
        canShareFilesMock.mockReturnValue(scenario.canShareFiles)
        supportsClipboardImageMock.mockReturnValue(scenario.clipboardAvailable)
        isMobileDeviceMock.mockReturnValue(false)

        renderWithQR()

        const shareButton = screen.getByRole('button', { name: 'Share QR code' })
        fireEvent.click(shareButton)

        if (scenario.expectClipboard) {
          await waitFor(() => expect(copyPayloadToClipboardMock).toHaveBeenCalledWith(mockPayload))
          expect(downloadPayloadMock).not.toHaveBeenCalled()
        } else {
          await waitFor(() => expect(downloadPayloadMock).toHaveBeenCalledWith(mockPayload))
          expect(copyPayloadToClipboardMock).not.toHaveBeenCalled()
        }
      })
    })
  })

  describe('Permission denied handling', () => {
    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('automatically triggers download fallback when navigator.share permission is denied', async () => {
      supportsNavigatorShareMock.mockReturnValue(true)
      canShareFilesMock.mockReturnValue(true)
      supportsClipboardImageMock.mockReturnValue(false) // Force download fallback

      const notAllowedError = new Error('Permission denied')
      notAllowedError.name = 'NotAllowedError'
      const shareSpy = vi.fn().mockRejectedValue(notAllowedError)
      vi.stubGlobal('navigator', {
        ...global.navigator,
        share: shareSpy,
      })

      renderWithQR()

      const shareButton = screen.getByRole('button', { name: 'Share QR code' })
      fireEvent.click(shareButton)

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/QR code downloaded/i)
      })

      expect(downloadPayloadMock).toHaveBeenCalledWith(mockPayload)

      // Persistence check: Subsequent attempts should skip navigator.share
      shareSpy.mockClear()
      downloadPayloadMock.mockClear()

      fireEvent.click(shareButton)

      await waitFor(() => {
        expect(downloadPayloadMock).toHaveBeenCalledWith(mockPayload)
      })
      expect(shareSpy).not.toHaveBeenCalled()
    })

    it('remembers blocked permission state and uses fallback immediately', async () => {
      supportsNavigatorShareMock.mockReturnValue(true)
      canShareFilesMock.mockReturnValue(true)
      supportsClipboardImageMock.mockReturnValue(true)

      const notAllowedError = new Error('Permission denied')
      notAllowedError.name = 'NotAllowedError'
      const shareSpy = vi.fn().mockRejectedValue(notAllowedError)
      vi.stubGlobal('navigator', {
        ...global.navigator,
        share: shareSpy,
      })

      renderWithQR('test')

      const shareButton = screen.getByRole('button', { name: 'Share QR code' })

      // First attempt: Navigator share is called, fails with NotAllowedError, triggers clipboard fallback
      fireEvent.click(shareButton)
      await waitFor(() => expect(shareSpy).toHaveBeenCalled())
      await waitFor(() => expect(copyPayloadToClipboardMock).toHaveBeenCalled())

      // Reset mocks for second attempt
      shareSpy.mockClear()
      copyPayloadToClipboardMock.mockClear()

      // Second attempt: Navigator share should be skipped (persistent block)
      fireEvent.click(shareButton)
      await waitFor(() => expect(copyPayloadToClipboardMock).toHaveBeenCalled())
      expect(shareSpy).not.toHaveBeenCalled()
    })
  })
})
