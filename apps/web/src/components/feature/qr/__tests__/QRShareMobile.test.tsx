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
  const supportsNavigatorShare = vi.fn<SupportsNavigatorShareFn>(() => true)
  const canShareFiles = vi.fn<CanShareFilesFn>(() => true)
  const supportsClipboardImage = vi.fn<SupportsClipboardImageFn>(() => false)
  const copyPayloadToClipboard = vi.fn<CopyPayloadToClipboardFn>(() => Promise.resolve())
  const downloadPayload = vi.fn<DownloadPayloadFn>(() => undefined)
  const isMobileDevice = vi.fn<IsMobileDeviceFn>(() => true)

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

describe('QRShareMobile', () => {
  const mockBlob = new Blob(['mobile'], { type: 'image/png' })
  const mockFilename = 'qr-code.png'
  const mockPayload: SharePayload = {
    blob: mockBlob,
    filename: mockFilename,
    lastUpdated: new Date(0),
  }
  const mockFile = new File([mockBlob], mockFilename, {
    type: mockBlob.type,
  })
  type NativeShareArgs = { files: File[] }
  type NativeShareFn = (args: NativeShareArgs) => Promise<void>
  const shareMock = vi.fn<NativeShareFn>(() => Promise.resolve())
  const originalNavigatorShareDescriptor = Object.getOwnPropertyDescriptor(navigator, 'share')

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
      supportsNavigatorShareMock.mockReturnValue(true)
      canShareFilesMock.mockReturnValue(false)
      supportsClipboardImageMock.mockReturnValue(false)
      copyPayloadToClipboardMock.mockResolvedValue(undefined)
      downloadPayloadMock.mockReturnValue(undefined)
      isMobileDeviceMock.mockReturnValue(true)
      shareMock.mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'share', {
        value: shareMock,
        configurable: true,
      })
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.resetAllMocks()
    if (originalNavigatorShareDescriptor) {
      Object.defineProperty(navigator, 'share', originalNavigatorShareDescriptor)
    }
  })

  it('shares the preview QR when canShare({ files }) succeeds and respects size', async () => {
    render(
      <LocaleProvider>
        <QRGenerator />
      </LocaleProvider>,
    )

    const input = screen.getByLabelText(/Link \/ Text/i)
    fireEvent.change(input, { target: { value: 'https://example.com/mobile' } })
    act(() => {
      vi.advanceTimersByTime(300)
    })

    vi.useRealTimers()

    const shareButton = screen.getByRole('button', { name: 'Share QR code' })
    fireEvent.click(shareButton)

    await waitFor(() => expect(shareMock).toHaveBeenCalledTimes(1))

    expect(canShareFilesMock).toHaveBeenCalledWith([mockFile])
    expect(isMobileDeviceMock).toHaveBeenCalled()
    expect(copyPayloadToClipboardMock).not.toHaveBeenCalled()
    expect(downloadPayloadMock).not.toHaveBeenCalled()

    const shareArgument = shareMock.mock.calls[0][0]
    expect(shareArgument.files).toHaveLength(1)
    expect(shareArgument.files[0]).toBe(mockFile)

    const canvasArg = createSharePayloadMock.mock.calls[0][0]
    expect(canvasArg).toBeInstanceOf(HTMLCanvasElement)
    expect(canvasArg?.width).toBe(300)
    expect(canvasArg?.height).toBe(300)
  })
})
