import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LocaleProvider } from '../../../../hooks/LocaleProvider'
import { QRScanner } from '../QRScanner'
import type { UseQrScannerReturn } from '../../../../hooks/useQrScanner'

const scanFile = vi.fn()
const cancelScan = vi.fn()
const startCamera = vi.fn()
const stopCamera = vi.fn()
const showResult = vi.fn()
const reset = vi.fn()

let scannerState: UseQrScannerReturn

vi.mock('../../../../hooks/useQrScanner', () => ({
  useQrScanner: () => scannerState,
}))

function makeState(over: Partial<UseQrScannerReturn> = {}): UseQrScannerReturn {
  return {
    decoded: null,
    error: null,
    isDecoding: false,
    isCameraActive: false,
    videoRef: { current: null },
    scanFile,
    cancelScan,
    startCamera,
    stopCamera,
    showResult,
    reset,
    ...over,
  }
}

function setup(onEdit = vi.fn()) {
  render(
    <LocaleProvider>
      <QRScanner onEditInGenerator={onEdit} />
    </LocaleProvider>,
  )
  return { onEdit }
}

beforeEach(() => {
  localStorage.clear()
  scanFile.mockReset()
  cancelScan.mockReset()
  startCamera.mockReset()
  stopCamera.mockReset()
  showResult.mockReset()
  reset.mockReset()
  scannerState = makeState()
})

describe('QRScanner — inputs', () => {
  it('shows the upload dropzone by default and the method toggle', () => {
    setup()
    expect(screen.getByRole('group', { name: /scan method/i })).toBeInTheDocument()
    expect(screen.getByText(/drop an image here/i)).toBeInTheDocument()
  })

  it('passes a chosen file to scanFile', () => {
    setup()
    const file = new File(['x'], 'qr.png', { type: 'image/png' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })
    expect(scanFile).toHaveBeenCalledWith(file)
  })

  it('switches to the camera input and starts the camera', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: /camera/i }))
    fireEvent.click(screen.getByRole('button', { name: /start camera/i }))
    expect(startCamera).toHaveBeenCalled()
  })

  it('shows a decoding status while a file is processed', () => {
    scannerState = makeState({ isDecoding: true })
    setup()
    expect(screen.getByText(/reading code/i)).toBeInTheDocument()
  })

  it('cancels an in-flight decode when Cancel is clicked', () => {
    scannerState = makeState({ isDecoding: true })
    setup()
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(cancelScan).toHaveBeenCalled()
  })

  it('renders an error message from the scanner', () => {
    scannerState = makeState({ error: 'no-code' })
    setup()
    expect(screen.getByText(/no qr code found/i)).toBeInTheDocument()
  })

  it('renders the file-too-large error message', () => {
    scannerState = makeState({ error: 'file-too-large' })
    setup()
    expect(screen.getByText(/too large/i)).toBeInTheDocument()
  })
})

describe('QRScanner — result', () => {
  it('shows the decoded value with a URL type chip and an Open link', () => {
    scannerState = makeState({ decoded: 'https://example.com' })
    setup()
    const result = within(screen.getByRole('region', { name: /scan result/i }))
    expect(result.getByText('https://example.com')).toBeInTheDocument()
    expect(result.getByText('Link')).toBeInTheDocument()
    const open = result.getByRole('link', { name: /open link/i })
    expect(open).toHaveAttribute('href', 'https://example.com')
  })

  it('omits the Open link for non-URL content', () => {
    scannerState = makeState({ decoded: 'just some text' })
    setup()
    const result = within(screen.getByRole('region', { name: /scan result/i }))
    expect(result.getByText('Text')).toBeInTheDocument()
    expect(result.queryByRole('link', { name: /open link/i })).not.toBeInTheDocument()
  })

  it('round-trips the value to the generator', () => {
    scannerState = makeState({ decoded: 'hello world' })
    const { onEdit } = setup()
    fireEvent.click(screen.getByRole('button', { name: /edit in generator/i }))
    expect(onEdit).toHaveBeenCalledWith('hello world')
  })

  it('resets when scanning another', () => {
    scannerState = makeState({ decoded: 'hello' })
    setup()
    fireEvent.click(screen.getByRole('button', { name: /scan another/i }))
    expect(reset).toHaveBeenCalled()
  })

  it('copies the decoded value to the clipboard', () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
    scannerState = makeState({ decoded: 'copy me' })
    setup()
    fireEvent.click(screen.getByRole('button', { name: /^copy$/i }))
    expect(writeText).toHaveBeenCalledWith('copy me')
    vi.unstubAllGlobals()
  })
})

describe('QRScanner — scan history', () => {
  it('records a decoded scan into the history list', () => {
    scannerState = makeState({ decoded: 'https://history.example' })
    setup()
    expect(screen.getByText('Recently scanned')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Link: https:\/\/history\.example/i }),
    ).toBeInTheDocument()
  })

  it('restores a history entry through showResult', () => {
    scannerState = makeState({ decoded: 'https://history.example' })
    setup()
    fireEvent.click(screen.getByRole('button', { name: /Link: https:\/\/history\.example/i }))
    expect(showResult).toHaveBeenCalledWith('https://history.example')
  })

  it('clears the history list', () => {
    scannerState = makeState({ decoded: 'https://history.example' })
    setup()
    expect(screen.getByText('Recently scanned')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /clear scan history/i }))
    expect(screen.queryByText('Recently scanned')).not.toBeInTheDocument()
  })
})
