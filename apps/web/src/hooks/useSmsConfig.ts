import { useMemo } from 'react'
import type { SmsConfig } from '@qrcraft/core'
import { buildSmsString } from '@qrcraft/core'
import { usePersistedConfig } from './usePersistedConfig'

const DEFAULT_SMS_CONFIG: SmsConfig = {
  number: '',
  message: '',
}

export interface UseSmsConfigReturn {
  smsConfig: SmsConfig
  smsString: string
  setNumber: (v: string) => void
  setMessage: (v: string) => void
}

export function useSmsConfig(): UseSmsConfigReturn {
  const [smsConfig, setSmsConfig] = usePersistedConfig<SmsConfig>(
    'qr-generator:draft:sms',
    DEFAULT_SMS_CONFIG,
  )

  const setNumber = (number: string) => setSmsConfig(prev => ({ ...prev, number }))
  const setMessage = (message: string) => setSmsConfig(prev => ({ ...prev, message }))

  const smsString = useMemo(() => buildSmsString(smsConfig), [smsConfig])

  return { smsConfig, smsString, setNumber, setMessage }
}
