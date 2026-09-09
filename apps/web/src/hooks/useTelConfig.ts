import { useMemo } from 'react'
import type { TelConfig } from '@qrcraft/core'
import { buildTelString } from '@qrcraft/core'
import { usePersistedConfig } from './usePersistedConfig'

const DEFAULT_TEL_CONFIG: TelConfig = {
  number: '',
}

export interface UseTelConfigReturn {
  telConfig: TelConfig
  telString: string
  setNumber: (v: string) => void
}

export function useTelConfig(): UseTelConfigReturn {
  const [telConfig, setTelConfig] = usePersistedConfig<TelConfig>(
    'qr-generator:draft:tel',
    DEFAULT_TEL_CONFIG,
  )

  const setNumber = (number: string) => setTelConfig(prev => ({ ...prev, number }))

  const telString = useMemo(() => buildTelString(telConfig), [telConfig])

  return { telConfig, telString, setNumber }
}
