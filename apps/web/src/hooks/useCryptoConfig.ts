import { useMemo } from 'react'
import type { CryptoConfig } from '../types/qr'
import { buildCryptoString } from '../utils/crypto'
import { usePersistedConfig } from './usePersistedConfig'

const DEFAULT_CRYPTO_CONFIG: CryptoConfig = {
  network: 'bitcoin',
  address: '',
  amount: '',
  label: '',
}

export interface UseCryptoConfigReturn {
  cryptoConfig: CryptoConfig
  cryptoString: string
  setField: <K extends keyof CryptoConfig>(key: K, value: CryptoConfig[K]) => void
}

export function useCryptoConfig(): UseCryptoConfigReturn {
  const [cryptoConfig, setCryptoConfig] = usePersistedConfig<CryptoConfig>(
    'qr-generator:draft:crypto',
    DEFAULT_CRYPTO_CONFIG,
  )

  const setField = <K extends keyof CryptoConfig>(key: K, value: CryptoConfig[K]) =>
    setCryptoConfig((prev) => ({ ...prev, [key]: value }))

  const cryptoString = useMemo(() => buildCryptoString(cryptoConfig), [cryptoConfig])

  return { cryptoConfig, cryptoString, setField }
}
