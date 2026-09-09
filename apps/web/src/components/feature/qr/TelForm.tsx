import { PhoneNumberField } from './PhoneNumberField'
import { useLocaleContext } from '../../../hooks/LocaleProvider'
import { TEL_PHONE_REGEX } from '../../../utils/tel'
import type { TelConfig } from '../../../types/qr'

interface TelFormProps {
  config: TelConfig
  onNumberChange: (v: string) => void
}

export function TelForm({ config, onNumberChange }: TelFormProps) {
  const { translate } = useLocaleContext()

  return (
    <PhoneNumberField
      value={config.number}
      onChange={onNumberChange}
      numberRegex={TEL_PHONE_REGEX}
      label={translate('controls.telNumberLabel')}
      placeholder={translate('controls.telNumberPlaceholder')}
      errorMessage={translate('controls.telNumberError')}
      hint={translate('controls.telModeHint')}
      previewLabel={translate('controls.telDialPreview')}
    />
  )
}
