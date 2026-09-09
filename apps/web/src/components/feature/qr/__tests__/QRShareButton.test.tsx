import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import {
  describe,
  expect,
  it,
  beforeEach,
  afterEach,
  afterAll,
  vi,
  type MockedFunction,
} from 'vitest'
import { LocaleProvider } from '../../../../hooks/LocaleProvider'
import { QRGenerator } from '../QRGenerator'
import type { SharePayload } from '../../../../types/qr'

type CreateSharePayloadFn = (canvas: HTMLCanvasElement | null) => Promise<SharePayload>
type PayloadToFileFn = (payload: SharePayload) => File
type SupportsNavigatorShareFn = () => boolean
type CanShareFilesFn = (files: File[]) => boolean
type IsMobileDeviceFn = () => boolean
type SupportsClipboardImageFn = () => boolean
type CopyPayloadToClipboardFn = (payload: SharePayload) => Promise<void>
type DownloadPayloadFn = (payload: SharePayload) => void

vi.mock('../../../../utils/share', () => {
  const createSharePayload = vi.fn()
  const payloadToFile = vi.fn()
  const supportsNavigatorShare = vi.fn<SupportsNavigatorShareFn>(() => true)
  const canShareFiles = vi.fn<CanShareFilesFn>(() => true)
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

describe('QRShareButton', () => {
  const mockBlob = new Blob(['PNG'], { type: 'image/png' })
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
      canShareFilesMock.mockReturnValue(true)
      supportsClipboardImageMock.mockReturnValue(false)
      isMobileDeviceMock.mockReturnValue(false)
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
  })

  afterAll(() => {
    if (originalNavigatorShareDescriptor) {
      Object.defineProperty(navigator, 'share', originalNavigatorShareDescriptor)
    }
  })

  it('shares the WYSIWYG QR canvas via navigator.share', async () => {
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

    await waitFor(() => expect(shareMock).toHaveBeenCalledTimes(1))
    expect(createSharePayloadMock).toHaveBeenCalledTimes(1)

    const canvasArg = createSharePayloadMock.mock.calls[0][0]
    expect(canvasArg).toBeInstanceOf(HTMLCanvasElement)
    expect(canvasArg?.width).toBe(300)
    expect(canvasArg?.height).toBe(300)

    expect(payloadToFileMock).toHaveBeenCalledWith(mockPayload)

    const shareArgument = shareMock.mock.calls[0][0]
    expect(shareArgument.files).toHaveLength(1)
    const [shareFile] = shareArgument.files
    expect(shareFile.name).toBe('qr-code.png')
    expect(shareFile.type).toBe('image/png')
    expect(copyPayloadToClipboardMock).not.toHaveBeenCalled()
    expect(downloadPayloadMock).not.toHaveBeenCalled()
  })
})
