import { useMemo } from 'react'
import type { EmailConfig } from '../types/qr'
import { buildEmailString } from '../utils/email'
import { usePersistedConfig } from './usePersistedConfig'

const DEFAULT_EMAIL_CONFIG: EmailConfig = {
  to: '',
  subject: '',
  body: '',
}

export interface UseEmailConfigReturn {
  emailConfig: EmailConfig
  emailString: string
  setTo: (v: string) => void
  setSubject: (v: string) => void
  setBody: (v: string) => void
}

export function useEmailConfig(): UseEmailConfigReturn {
  const [emailConfig, setEmailConfig] = usePersistedConfig<EmailConfig>(
    'qr-generator:draft:email',
    DEFAULT_EMAIL_CONFIG,
  )

  const setTo = (to: string) => setEmailConfig(prev => ({ ...prev, to }))
  const setSubject = (subject: string) => setEmailConfig(prev => ({ ...prev, subject }))
  const setBody = (body: string) => setEmailConfig(prev => ({ ...prev, body }))

  const emailString = useMemo(() => buildEmailString(emailConfig), [emailConfig])

  return { emailConfig, emailString, setTo, setSubject, setBody }
}
