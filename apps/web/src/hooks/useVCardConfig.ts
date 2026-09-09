import { useMemo } from 'react'
import type { VCardConfig } from '../types/qr'
import { buildVCardString } from '../utils/vcard'
import { usePersistedConfig } from './usePersistedConfig'

const DEFAULT_VCARD_CONFIG: VCardConfig = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  company: '',
  jobTitle: '',
  website: '',
}

export interface UseVCardConfigReturn {
  vcardConfig: VCardConfig
  vcardString: string
  setFirstName: (v: string) => void
  setLastName: (v: string) => void
  setPhone: (v: string) => void
  setEmail: (v: string) => void
  setCompany: (v: string) => void
  setJobTitle: (v: string) => void
  setWebsite: (v: string) => void
}

export function useVCardConfig(): UseVCardConfigReturn {
  const [vcardConfig, setVCardConfig] = usePersistedConfig<VCardConfig>(
    'qr-generator:draft:vcard',
    DEFAULT_VCARD_CONFIG,
  )

  const setFirstName = (firstName: string) => setVCardConfig(prev => ({ ...prev, firstName }))
  const setLastName = (lastName: string) => setVCardConfig(prev => ({ ...prev, lastName }))
  const setPhone = (phone: string) => setVCardConfig(prev => ({ ...prev, phone }))
  const setEmail = (email: string) => setVCardConfig(prev => ({ ...prev, email }))
  const setCompany = (company: string) => setVCardConfig(prev => ({ ...prev, company }))
  const setJobTitle = (jobTitle: string) => setVCardConfig(prev => ({ ...prev, jobTitle }))
  const setWebsite = (website: string) => setVCardConfig(prev => ({ ...prev, website }))

  const vcardString = useMemo(() => buildVCardString(vcardConfig), [vcardConfig])

  return { vcardConfig, vcardString, setFirstName, setLastName, setPhone, setEmail, setCompany, setJobTitle, setWebsite }
}
