import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { LocaleProvider } from '../../../../hooks/LocaleProvider'
import { GeoForm } from '../GeoForm'
import type { GeoConfig } from '../../../../types/qr'

const defaultConfig: GeoConfig = {
  latitude: '',
  longitude: '',
}

const setup = (config: GeoConfig = defaultConfig, overrides: Partial<{
  onLatitudeChange: (v: string) => void
  onLongitudeChange: (v: string) => void
}> = {}) => {
  const handlers = {
    onLatitudeChange: overrides.onLatitudeChange ?? vi.fn(),
    onLongitudeChange: overrides.onLongitudeChange ?? vi.fn(),
  }
  const utils = render(
    <LocaleProvider>
      <GeoForm config={config} {...handlers} />
    </LocaleProvider>
  )
  return { ...utils, ...handlers }
}

const latInput = () => screen.getByRole('textbox', { name: /latitude/i })
const lngInput = () => screen.getByRole('textbox', { name: /longitude/i })
const locateButton = () => screen.getByRole('button', { name: /use my location/i })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('GeoForm', () => {
  it('renders latitude and longitude fields', () => {
    setup()
    expect(latInput()).toBeInTheDocument()
    expect(lngInput()).toBeInTheDocument()
  })

  it('reports coordinate edits upward', () => {
    const { onLatitudeChange, onLongitudeChange } = setup()
    fireEvent.change(latInput(), { target: { value: '37.787' } })
    fireEvent.change(lngInput(), { target: { value: '-122.3997' } })
    expect(onLatitudeChange).toHaveBeenCalledWith('37.787')
    expect(onLongitudeChange).toHaveBeenCalledWith('-122.3997')
  })

  it('uses decimal input mode for coordinate fields', () => {
    setup()
    expect(latInput()).toHaveAttribute('inputmode', 'decimal')
    expect(lngInput()).toHaveAttribute('inputmode', 'decimal')
  })

  it('shows an error for an out-of-range latitude once the field is blurred', () => {
    setup({ latitude: '91', longitude: '0' })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    fireEvent.blur(latInput())
    expect(screen.getByRole('alert')).toHaveTextContent(/between -90 and 90/i)
  })

  it('shows an error for an out-of-range longitude once the field is blurred', () => {
    setup({ latitude: '0', longitude: '200' })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    fireEvent.blur(lngInput())
    expect(screen.getByRole('alert')).toHaveTextContent(/between -180 and 180/i)
  })

  it('shows no error while a coordinate field is empty', () => {
    setup({ latitude: '', longitude: '' })
    fireEvent.blur(latInput())
    fireEvent.blur(lngInput())
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('updates the latitude error live once the field has been touched', () => {
    const { rerender } = setup({ latitude: '91', longitude: '0' })
    fireEvent.blur(latInput())
    expect(screen.getByRole('alert')).toBeInTheDocument()
    rerender(
      <LocaleProvider>
        <GeoForm
          config={{ latitude: '45', longitude: '0' }}
          onLatitudeChange={vi.fn()}
          onLongitudeChange={vi.fn()}
        />
      </LocaleProvider>,
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('previews the map target once both coordinates are valid', () => {
    setup({ latitude: '37.787', longitude: '-122.3997' })
    expect(screen.getByText(/opens maps at 37\.787, -122\.3997/i)).toBeInTheDocument()
  })

  it('shows no preview when the location is incomplete', () => {
    setup({ latitude: '37.787', longitude: '' })
    expect(screen.queryByText(/opens maps at/i)).not.toBeInTheDocument()
  })

  it('offers coordinate help while the location is incomplete', () => {
    setup({ latitude: '', longitude: '' })
    expect(screen.getByText(/right-click your spot/i)).toBeInTheDocument()
  })

  it('describes the coordinate fields with the on-screen guidance', () => {
    setup({ latitude: '', longitude: '' })
    const describedBy = latInput().getAttribute('aria-describedby') ?? ''
    const help = screen.getByText(/right-click your spot/i)
    const hint = screen.getByText(/open this spot in a map app/i)
    expect(describedBy).toContain(help.id)
    expect(describedBy).toContain(hint.id)
  })

  it('replaces the help with the preview once the location is valid', () => {
    setup({ latitude: '37.787', longitude: '-122.3997' })
    expect(screen.queryByText(/right-click your spot/i)).not.toBeInTheDocument()
    expect(screen.getByText(/opens maps at/i)).toBeInTheDocument()
  })

  it('fills both fields from the Geolocation API on success', () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) =>
      success({ coords: { latitude: 51.5074123, longitude: -0.1278456 } } as GeolocationPosition),
    )
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })
    const { onLatitudeChange, onLongitudeChange } = setup()
    fireEvent.click(locateButton())
    expect(onLatitudeChange).toHaveBeenCalledWith('51.507412')
    expect(onLongitudeChange).toHaveBeenCalledWith('-0.127846')
  })

  it('announces a found location to assistive tech', () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) =>
      success({ coords: { latitude: 51.5074, longitude: -0.1278 } } as GeolocationPosition),
    )
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })
    setup()
    fireEvent.click(locateButton())
    expect(screen.getByRole('status')).toHaveTextContent(/location found/i)
  })

  it('surfaces an error when the location request fails', () => {
    const getCurrentPosition = vi.fn((_success: PositionCallback, error: PositionErrorCallback) =>
      error({ code: 1, message: 'denied' } as GeolocationPositionError),
    )
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })
    setup()
    fireEvent.click(locateButton())
    expect(screen.getByRole('alert')).toHaveTextContent(/couldn't get your location/i)
  })

  it('clears a location error once the user edits a coordinate', () => {
    const getCurrentPosition = vi.fn((_success: PositionCallback, error: PositionErrorCallback) =>
      error({ code: 1, message: 'denied' } as GeolocationPositionError),
    )
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })
    setup()
    fireEvent.click(locateButton())
    expect(screen.getByRole('alert')).toBeInTheDocument()
    fireEvent.change(latInput(), { target: { value: '37.787' } })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('explains when the browser has no geolocation support', () => {
    vi.stubGlobal('navigator', {})
    setup()
    fireEvent.click(locateButton())
    expect(screen.getByRole('alert')).toHaveTextContent(/doesn't support location/i)
  })
})
