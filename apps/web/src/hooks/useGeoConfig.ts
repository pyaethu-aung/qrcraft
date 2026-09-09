import { useMemo } from 'react'
import type { GeoConfig } from '../types/qr'
import { buildGeoString } from '../utils/geo'
import { getHydratedSecrets } from '../utils/shareConfig'
import { usePersistedConfig } from './usePersistedConfig'

const DEFAULT_GEO_CONFIG: GeoConfig = {
  latitude: '',
  longitude: '',
}

export interface UseGeoConfigReturn {
  geoConfig: GeoConfig
  geoString: string
  setLatitude: (v: string) => void
  setLongitude: (v: string) => void
}

export function useGeoConfig(): UseGeoConfigReturn {
  // A shared link's coordinates are seeded from memory rather than written to disk here;
  // normal edits persist as before via usePersistedConfig.
  const secrets = getHydratedSecrets()
  const [geoConfig, setGeoConfig] = usePersistedConfig<GeoConfig>(
    'qr-generator:draft:geo',
    DEFAULT_GEO_CONFIG,
    [],
    { latitude: secrets?.geoLatitude, longitude: secrets?.geoLongitude },
  )

  const setLatitude = (latitude: string) => setGeoConfig(prev => ({ ...prev, latitude }))
  const setLongitude = (longitude: string) => setGeoConfig(prev => ({ ...prev, longitude }))

  const geoString = useMemo(() => buildGeoString(geoConfig), [geoConfig])

  return { geoConfig, geoString, setLatitude, setLongitude }
}
