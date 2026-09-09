import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { ComponentProps } from 'react'
import { LocaleProvider } from '../../../../hooks/LocaleProvider'
import { QRControls } from '../QRControls'
import { DEFAULT_QR_CONFIG } from '../../../../data/defaults'

type QRControlsProps = ComponentProps<typeof QRControls>

const setup = (overrides: Partial<QRControlsProps> = {}) => {
  const onValueChange = vi.fn<(value: string) => void>()
  const onEcLevelChange = vi.fn<(level: QRControlsProps['ecLevel']) => void>()
  const onFgColorChange = vi.fn<(color: string) => void>()
  const onBgColorChange = vi.fn<(color: string) => void>()
  const onEyeFrameShapeChange = vi.fn<QRControlsProps['onEyeFrameShapeChange']>()
  const onEyeCenterShapeChange = vi.fn<QRControlsProps['onEyeCenterShapeChange']>()
  const onEyeFrameColorChange = vi.fn<QRControlsProps['onEyeFrameColorChange']>()
  const onEyeCenterColorChange = vi.fn<QRControlsProps['onEyeCenterColorChange']>()
  const onPixelPatternChange = vi.fn<QRControlsProps['onPixelPatternChange']>()

  const baseProps: QRControlsProps = {
    value: '',
    ecLevel: 'M',
    eyeFrameShape: 'Square',
    eyeCenterShape: 'Square',
    eyeFrameColor: null,
    eyeCenterColor: null,
    pixelPattern: 'Square',
    fgColor: DEFAULT_QR_CONFIG.fgColor,
    bgColor: DEFAULT_QR_CONFIG.bgColor,
    onValueChange,
    onEcLevelChange,
    onEyeFrameShapeChange,
    onEyeCenterShapeChange,
    onEyeFrameColorChange,
    onEyeCenterColorChange,
    onPixelPatternChange,
    onFgColorChange,
    onBgColorChange,
    canDownload: false,
  }

  const utils = render(
    <LocaleProvider>
      <QRControls {...baseProps} {...overrides} />
    </LocaleProvider>,
  )

  return {
    ...utils,
    onValueChange,
    onEcLevelChange,
    onEyeFrameShapeChange,
    onEyeCenterShapeChange,
    onEyeFrameColorChange,
    onEyeCenterColorChange,
    onPixelPatternChange,
    onFgColorChange,
    onBgColorChange,
  }
}

function openAppearance() {
  const btn = screen.getByRole('button', { name: /Appearance/ })
  if (btn.getAttribute('aria-expanded') === 'false') fireEvent.click(btn)
}

describe('QRControls configuration updates', () => {
  it('calls onValueChange when the input text changes', () => {
    const { onValueChange } = setup()

    fireEvent.change(screen.getByLabelText(/Link \/ Text/i), {
      target: { value: 'https://example.com' },
    })

    expect(onValueChange).toHaveBeenCalledWith('https://example.com')
  })

  it('calls onEcLevelChange when an EC Level pill button is clicked', () => {
    const { onEcLevelChange } = setup()

    fireEvent.click(screen.getByRole('button', { name: 'Highest (30%)' }))

    expect(onEcLevelChange).toHaveBeenCalledWith('H')
  })

  it('marks the active EC Level pill with aria-pressed=true', () => {
    setup({ ecLevel: 'M' })

    const activeButton = screen.getByRole('button', { name: 'Medium (15%)' })
    expect(activeButton).toHaveAttribute('aria-pressed', 'true')

    const inactiveButton = screen.getByRole('button', { name: 'Low (7%)' })
    expect(inactiveButton).toHaveAttribute('aria-pressed', 'false')
  })

  it('[US1] calls onEyeFrameShapeChange when an eye border swatch is clicked', () => {
    const { onEyeFrameShapeChange } = setup()
    openAppearance()

    fireEvent.click(screen.getByRole('button', { name: 'Hexagon frame' }))

    expect(onEyeFrameShapeChange).toHaveBeenCalledWith('Hexagon')
  })

  it('[US1] calls onEyeCenterShapeChange when an eye center swatch is clicked', () => {
    const { onEyeCenterShapeChange } = setup()
    openAppearance()

    fireEvent.click(screen.getByRole('button', { name: 'Dot center' }))

    expect(onEyeCenterShapeChange).toHaveBeenCalledWith('Dot')
  })

  it('border and center shape pickers are independent groups', () => {
    setup({ eyeFrameShape: 'Circle', eyeCenterShape: 'Diamond' })
    openAppearance()

    const borderGroup = screen.getByRole('group', { name: 'Corner Frame' })
    const centerGroup = screen.getByRole('group', { name: 'Corner Dot' })

    expect(borderGroup.querySelector('[aria-pressed="true"]')).toHaveAttribute('aria-label', 'Circle frame')
    expect(centerGroup.querySelector('[aria-pressed="true"]')).toHaveAttribute('aria-label', 'Diamond center')
  })

  it('reveals "Match foreground" reset only after an eye color is set, and reverts to inherit', () => {
    const { rerender, onEyeFrameColorChange } = setup()
    openAppearance()

    // Inherit by default → no reset link
    expect(screen.queryByRole('button', { name: 'Match foreground' })).not.toBeInTheDocument()

    rerender(
      <LocaleProvider>
        <QRControls
          value=""
          ecLevel="M"
          eyeFrameShape="Square"
          eyeCenterShape="Square"
          eyeFrameColor="#ff0000"
          eyeCenterColor={null}
          pixelPattern="Square"
          fgColor="#000000"
          bgColor="#ffffff"
          onValueChange={vi.fn()}
          onEcLevelChange={vi.fn()}
          onEyeFrameShapeChange={vi.fn()}
          onEyeCenterShapeChange={vi.fn()}
          onEyeFrameColorChange={onEyeFrameColorChange}
          onEyeCenterColorChange={vi.fn()}
          onPixelPatternChange={vi.fn()}
          onFgColorChange={vi.fn()}
          onBgColorChange={vi.fn()}
        />
      </LocaleProvider>,
    )

    const reset = screen.getByRole('button', { name: 'Match foreground' })
    fireEvent.click(reset)
    expect(onEyeFrameColorChange).toHaveBeenCalledWith(null)
  })

  it('[US2] calls onPixelPatternChange when a pixel pattern pill is clicked', () => {
    const { onPixelPatternChange } = setup()
    openAppearance()

    fireEvent.click(screen.getByRole('button', { name: 'Dots pattern' }))

    expect(onPixelPatternChange).toHaveBeenCalledWith('Dots')
  })

  it('marks the active pixel pattern swatch with aria-pressed=true', () => {
    setup({ eyeFrameShape: 'Rounded', pixelPattern: 'Square' })
    openAppearance()

    const pixelGroup = screen.getByRole('group', { name: 'Pixel Pattern' })
    const activeButton = pixelGroup.querySelector('[aria-pressed="true"]')
    expect(activeButton).toHaveAttribute('aria-label', 'Square pattern')
  })

  it('calls color change handlers when pickers are used', () => {
    const { container, onFgColorChange, onBgColorChange, onEyeFrameColorChange, onEyeCenterColorChange } = setup()
    openAppearance()

    // Foreground, Background, Eye Border, Eye Center
    const colorInputs = Array.from(container.querySelectorAll('input[type="color"]'))
    expect(colorInputs).toHaveLength(4)

    fireEvent.change(colorInputs[0], { target: { value: '#ff0000' } })
    fireEvent.change(colorInputs[1], { target: { value: '#00ff00' } })
    fireEvent.change(colorInputs[2], { target: { value: '#0000ff' } })
    fireEvent.change(colorInputs[3], { target: { value: '#abcdef' } })

    expect(onFgColorChange).toHaveBeenCalledWith('#ff0000')
    expect(onBgColorChange).toHaveBeenCalledWith('#00ff00')
    expect(onEyeFrameColorChange).toHaveBeenCalledWith('#0000ff')
    expect(onEyeCenterColorChange).toHaveBeenCalledWith('#abcdef')
  })

  it('renders inline error when provided', () => {
    setup({ inputError: 'Input too long' })

    expect(screen.getByText('Input too long')).toBeInTheDocument()
  })

  it('renders download buttons with download icons when handlers provided', () => {
    const onDownloadPng = vi.fn()
    const onDownloadSvg = vi.fn()
    setup({ onDownloadPng, onDownloadSvg, canDownload: true })

    const pngButton = screen.getByRole('button', { name: /Download PNG/i })
    const svgButton = screen.getByRole('button', { name: /Download SVG/i })

    expect(pngButton.querySelector('svg')).toBeInTheDocument()
    expect(svgButton.querySelector('svg')).toBeInTheDocument()
  })

  it('does not render a "Download Formats" section divider', () => {
    const onDownloadPng = vi.fn()
    const onDownloadSvg = vi.fn()
    setup({ onDownloadPng, onDownloadSvg })

    expect(screen.queryByText('Download Formats')).not.toBeInTheDocument()
  })

  it('does not render a Generate button', () => {
    setup()

    expect(screen.queryByRole('button', { name: /Generate QR Code/i })).not.toBeInTheDocument()
  })
})

describe('color contrast warning', () => {
  it('does not show a warning when contrast is good (dark on light)', () => {
    setup({ fgColor: DEFAULT_QR_CONFIG.fgColor, bgColor: DEFAULT_QR_CONFIG.bgColor })

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows a "Contrast Risk" warning when fg/bg contrast ratio is below 3:1', () => {
    // #cccccc on #ffffff ≈ 1.6:1 — well below threshold
    setup({ fgColor: '#cccccc', bgColor: '#ffffff' })

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Contrast Risk')).toBeInTheDocument()
  })

  it('shows an "Inverted Colors" warning when fg is lighter than bg with good contrast', () => {
    // #ffffff on #000000 is 21:1 but inverted
    setup({ fgColor: '#ffffff', bgColor: '#000000' })

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Inverted Colors')).toBeInTheDocument()
  })

  it('hides the warning after the dismiss button is clicked', () => {
    setup({ fgColor: '#cccccc', bgColor: '#ffffff' })

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss contrast warning' }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('resets dismissal and shows warning again when colors change', () => {
    const { rerender } = setup({ fgColor: '#cccccc', bgColor: '#ffffff' })

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss contrast warning' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    rerender(
      <LocaleProvider>
        <QRControls
          value=""
          ecLevel="M"
          eyeFrameShape="Square"
          eyeCenterShape="Square"
          eyeFrameColor={null}
          eyeCenterColor={null}
          pixelPattern="Square"
          fgColor="#dddddd"
          bgColor="#ffffff"
          onValueChange={vi.fn()}
          onEcLevelChange={vi.fn()}
          onEyeFrameShapeChange={vi.fn()}
          onEyeCenterShapeChange={vi.fn()}
          onEyeFrameColorChange={vi.fn()}
          onEyeCenterColorChange={vi.fn()}
          onPixelPatternChange={vi.fn()}
          onFgColorChange={vi.fn()}
          onBgColorChange={vi.fn()}
        />
      </LocaleProvider>,
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  describe('Appearance customized badge', () => {
    it('hides the badge when appearance is all default', () => {
      setup()
      expect(screen.queryByRole('img', { name: /customized/i })).not.toBeInTheDocument()
    })

    it('shows the badge when the pixel pattern is non-default', () => {
      setup({ pixelPattern: 'Dots' })
      expect(screen.getByRole('img', { name: /customized/i })).toBeInTheDocument()
    })

    it('shows the badge when a color is non-default', () => {
      setup({ fgColor: '#ff0000' })
      expect(screen.getByRole('img', { name: /customized/i })).toBeInTheDocument()
    })

    it('shows the badge when an eye color is set', () => {
      setup({ eyeCenterColor: '#00ff00' })
      expect(screen.getByRole('img', { name: /customized/i })).toBeInTheDocument()
    })

    it('shows the badge when a foreground gradient is set', () => {
      setup({ fgGradient: { type: 'linear', from: '#000000', to: '#4F46E5', direction: 'to-br' } })
      expect(screen.getByRole('img', { name: /customized/i })).toBeInTheDocument()
    })
  })

  describe('foreground gradient', () => {
    it('only shows the fill-type control when onFgGradientChange is provided', () => {
      setup()
      openAppearance()
      expect(screen.queryByRole('group', { name: 'Foreground Fill' })).not.toBeInTheDocument()
    })

    it('enabling Linear seeds a gradient from the current foreground color', () => {
      const onFgGradientChange = vi.fn()
      setup({ fgColor: '#123456', onFgGradientChange })
      openAppearance()

      fireEvent.click(screen.getByRole('button', { name: 'Linear' }))

      expect(onFgGradientChange).toHaveBeenCalledWith({
        type: 'linear',
        from: '#123456',
        to: '#4F46E5',
        direction: 'to-br',
      })
    })

    it('switching to Solid clears the gradient', () => {
      const onFgGradientChange = vi.fn()
      setup({ fgGradient: { type: 'radial', from: '#000000', to: '#ffffff', direction: 'to-br' }, onFgGradientChange })
      openAppearance()

      fireEvent.click(screen.getByRole('button', { name: 'Solid' }))

      expect(onFgGradientChange).toHaveBeenCalledWith(null)
    })

    it('shows Start and End color fields when a gradient is active', () => {
      setup({ fgGradient: { type: 'linear', from: '#000000', to: '#4F46E5', direction: 'to-r' }, onFgGradientChange: vi.fn() })
      openAppearance()

      expect(screen.getByLabelText('Start Color')).toBeInTheDocument()
      expect(screen.getByLabelText('End Color')).toBeInTheDocument()
      expect(screen.queryByLabelText('Foreground')).not.toBeInTheDocument()
    })

    it('updates the end color via the End picker', () => {
      const onFgGradientChange = vi.fn()
      setup({ fgGradient: { type: 'linear', from: '#000000', to: '#4F46E5', direction: 'to-r' }, onFgGradientChange })
      openAppearance()

      fireEvent.change(screen.getByLabelText('End Color'), { target: { value: '#abcdef' } })

      expect(onFgGradientChange).toHaveBeenCalledWith({ type: 'linear', from: '#000000', to: '#abcdef', direction: 'to-r' })
    })

    it('shows the 8 direction options for linear and updates on click', () => {
      const onFgGradientChange = vi.fn()
      setup({ fgGradient: { type: 'linear', from: '#000000', to: '#4F46E5', direction: 'to-r' }, onFgGradientChange })
      openAppearance()

      const group = screen.getByRole('group', { name: 'Direction' })
      expect(group.querySelectorAll('button')).toHaveLength(8)

      fireEvent.click(screen.getByRole('button', { name: 'Top' }))
      expect(onFgGradientChange).toHaveBeenCalledWith({ type: 'linear', from: '#000000', to: '#4F46E5', direction: 'to-t' })
    })

    it('restores the previous stops when toggling Solid then back to a gradient', () => {
      const onFgGradientChange = vi.fn()
      const props: Partial<QRControlsProps> = {
        fgColor: '#000000',
        fgGradient: { type: 'linear', from: '#111111', to: '#222222', direction: 'to-r' },
        onFgGradientChange,
      }
      const { rerender } = setup(props)
      openAppearance()

      // Switch to Solid (clears the gradient)…
      fireEvent.click(screen.getByRole('button', { name: 'Solid' }))
      expect(onFgGradientChange).toHaveBeenLastCalledWith(null)

      // …the parent re-renders with no gradient; switching back restores the old stops.
      rerender(
        <LocaleProvider>
          <QRControls
            value=""
            ecLevel="M"
            eyeFrameShape="Square"
            eyeCenterShape="Square"
            eyeFrameColor={null}
            eyeCenterColor={null}
            pixelPattern="Square"
            fgColor="#000000"
            bgColor="#ffffff"
            fgGradient={null}
            onFgGradientChange={onFgGradientChange}
            onValueChange={vi.fn()}
            onEcLevelChange={vi.fn()}
            onEyeFrameShapeChange={vi.fn()}
            onEyeCenterShapeChange={vi.fn()}
            onEyeFrameColorChange={vi.fn()}
            onEyeCenterColorChange={vi.fn()}
            onPixelPatternChange={vi.fn()}
            onFgColorChange={vi.fn()}
            onBgColorChange={vi.fn()}
          />
        </LocaleProvider>,
      )
      openAppearance()
      fireEvent.click(screen.getByRole('button', { name: 'Linear' }))

      expect(onFgGradientChange).toHaveBeenLastCalledWith({ type: 'linear', from: '#111111', to: '#222222', direction: 'to-r' })
    })

    it('hides the direction grid for a radial gradient', () => {
      setup({ fgGradient: { type: 'radial', from: '#000000', to: '#4F46E5', direction: 'to-r' }, onFgGradientChange: vi.fn() })
      openAppearance()

      expect(screen.queryByRole('group', { name: 'Direction' })).not.toBeInTheDocument()
    })

    it('warns on low contrast when a gradient stop blends into the background', () => {
      // White-ish end stop on a white background → low contrast on at least one stop.
      setup({ bgColor: '#ffffff', fgGradient: { type: 'linear', from: '#000000', to: '#fefefe', direction: 'to-r' }, onFgGradientChange: vi.fn() })

      expect(screen.getByText(/contrast may prevent scanners/i)).toBeInTheDocument()
    })
  })
})
