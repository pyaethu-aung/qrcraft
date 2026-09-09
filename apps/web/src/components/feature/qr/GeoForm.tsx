import { useId, useState } from 'react'
import { LocateFixed } from 'lucide-react'
import { Input } from '../../common/Input'
import { Callout } from '../../common/Callout'
import { useLocaleContext } from '../../../hooks/LocaleProvider'
import { useTimedState } from '../../../hooks/useTimedState'
import { parseLatitude, parseLongitude } from '../../../utils/geo'
import type { GeoConfig } from '../../../types/qr'

interface GeoFormProps {
  config: GeoConfig
  onLatitudeChange: (v: string) => void
  onLongitudeChange: (v: string) => void
}

/** Six decimals of a degree is about 0.1m on the ground: precise enough for any map pin, and tidier than the device's raw float. */
const roundCoord = (n: number): string => String(Math.round(n * 1e6) / 1e6)

/**
 * Location (geo:) form: a latitude/longitude pair that encodes an RFC 5870 geo URI, plus a
 * one-tap "use my location" that fills both fields from the Geolocation API. Coordinates are
 * the source of truth; geolocation is a convenience, not a requirement, so a denied permission
 * or an unsupported browser degrades to manual entry rather than a dead end. When neither path
 * is available the field help points people at the coordinates they already have in a map app.
 * The live preview mirrors the phone field's confirmation line so people see exactly where the
 * code will open.
 */
export function GeoForm({ config, onLatitudeChange, onLongitudeChange }: GeoFormProps) {
  const { translate } = useLocaleContext()
  // Tie both inputs to the on-screen guidance: the mode hint and the help/preview slot,
  // so a screen-reader user hears where to find coordinates, not just the bare label.
  const hintId = useId()
  const guidanceId = useId()
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | undefined>()
  // Single polite live-region message: the in-flight "finding…" then a transient "found",
  // so a non-sighted user hears that the silent field fill actually succeeded.
  const [srStatus, setSrStatusTimed, setSrStatus] = useTimedState('', 3000)

  const [latTouched, setLatTouched] = useState(false)
  const [lngTouched, setLngTouched] = useState(false)

  // A non-empty field that fails to parse is an explicit error; a blank field is merely
  // incomplete and stays quiet until the user commits to a value. Deferred until the
  // field is blurred once, so a mid-typo digit doesn't flash red before the user is done.
  const lat = parseLatitude(config.latitude)
  const lng = parseLongitude(config.longitude)
  const latError = latTouched && config.latitude.trim() !== '' && lat === null
  const lngError = lngTouched && config.longitude.trim() !== '' && lng === null

  const showPreview = lat !== null && lng !== null
  const previewCoords = showPreview ? `${lat}, ${lng}` : ''

  // Typing a coordinate is the user moving on from a failed locate attempt; a stale
  // "couldn't get your location" banner hovering over a valid number reads as broken.
  const editCoordinate = (apply: (v: string) => void) => (value: string) => {
    apply(value)
    if (locationError) setLocationError(undefined)
  }

  const handleUseMyLocation = () => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setLocationError(translate('controls.geoLocationUnsupported'))
      return
    }
    setLocating(true)
    setLocationError(undefined)
    setSrStatus(translate('controls.geoLocating'))
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLatitudeChange(roundCoord(position.coords.latitude))
        onLongitudeChange(roundCoord(position.coords.longitude))
        setLocating(false)
        setSrStatusTimed(translate('controls.geoLocationFound'))
      },
      () => {
        setLocating(false)
        setSrStatus('')
        setLocationError(translate('controls.geoLocationError'))
      },
      // A map pin doesn't need sub-meter GPS; a coarse cell/wifi fix is faster and lighter
      // on battery, and a recent cached position (up to a minute old) is fine to reuse.
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p id={hintId} className="text-xs text-text-secondary">{translate('controls.geoModeHint')}</p>

      <button
        type="button"
        onClick={handleUseMyLocation}
        disabled={locating}
        aria-busy={locating}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-raised px-4 text-sm font-medium text-text-primary transition-colors hover:bg-surface-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:cursor-wait disabled:opacity-60"
      >
        {locating ? (
          <span className="h-4 w-4 motion-safe:animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
        ) : (
          <LocateFixed size={16} aria-hidden className="text-text-secondary" />
        )}
        {locating ? translate('controls.geoLocating') : translate('controls.geoUseMyLocation')}
      </button>

      {/* Announce in-flight and success states for screen readers without relying on the
          visual spinner or the silently-populated fields. */}
      <span className="sr-only" role="status" aria-live="polite">{srStatus}</span>

      {locationError && <Callout>{locationError}</Callout>}

      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          <Input
            label={translate('controls.geoLatitudeLabel')}
            placeholder={translate('controls.geoLatitudePlaceholder')}
            value={config.latitude}
            onChange={(e) => editCoordinate(onLatitudeChange)(e.target.value)}
            onBlur={() => setLatTouched(true)}
            error={latError ? translate('controls.geoLatitudeError') : undefined}
            aria-describedby={`${hintId} ${guidanceId}`}
            inputMode="decimal"
            autoComplete="off"
            required
          />
        </div>
        <div className="min-w-0 flex-1">
          <Input
            label={translate('controls.geoLongitudeLabel')}
            placeholder={translate('controls.geoLongitudePlaceholder')}
            value={config.longitude}
            onChange={(e) => editCoordinate(onLongitudeChange)(e.target.value)}
            onBlur={() => setLngTouched(true)}
            error={lngError ? translate('controls.geoLongitudeError') : undefined}
            aria-describedby={`${hintId} ${guidanceId}`}
            inputMode="decimal"
            autoComplete="off"
            required
          />
        </div>
      </div>

      {/* One slot, two jobs: confirm the encoded target once valid, otherwise teach people
          where to find coordinates so a declined permission isn't a dead end. */}
      {showPreview ? (
        <p id={guidanceId} className="text-xs text-text-secondary">
          {translate('controls.geoMapPreview').replace('{coords}', previewCoords)}
        </p>
      ) : (
        <p id={guidanceId} className="text-xs text-text-secondary">{translate('controls.geoCoordinateHelp')}</p>
      )}
    </div>
  )
}
