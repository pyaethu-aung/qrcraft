import { useState, useId } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '../../common/Input'
import { Callout } from '../../common/Callout'
import { PillGroup } from '../../common/PillGroup'
import { Tooltip } from '../../common/Tooltip'
import { useLocaleContext } from '../../../hooks/LocaleProvider'
import type { WiFiConfig, WiFiSecurity } from '../../../types/qr'

interface WiFiFormProps {
  config: WiFiConfig
  onSsidChange: (ssid: string) => void
  onPasswordChange: (password: string) => void
  onSecurityChange: (security: WiFiSecurity) => void
  onHiddenChange: (hidden: boolean) => void
}

export function WiFiForm({ config, onSsidChange, onPasswordChange, onSecurityChange, onHiddenChange }: WiFiFormProps) {
  const { translate } = useLocaleContext()
  const [showPassword, setShowPassword] = useState(false)
  const securityLabelId = useId()
  const hiddenCheckboxId = useId()
  const passwordId = useId()

  const securityOptions: { value: WiFiSecurity; label: string }[] = [
    { value: 'WPA', label: translate('controls.wifiSecurityWpa') },
    { value: 'WEP', label: translate('controls.wifiSecurityWep') },
    { value: 'nopass', label: translate('controls.wifiSecurityNone') },
  ]

  return (
    <div className="flex flex-col gap-4">
      <Input
        label={translate('controls.wifiSsidLabel')}
        placeholder={translate('controls.wifiSsidPlaceholder')}
        value={config.ssid}
        onChange={(e) => onSsidChange(e.target.value)}
        autoComplete="off"
        required
      />

      {/* Security type pills */}
      <div className="flex flex-col gap-1">
        <label id={securityLabelId} className="text-sm font-medium text-text-primary">
          {translate('controls.wifiSecurityLabel')}
        </label>
        <PillGroup
          options={securityOptions}
          value={config.security}
          onChange={onSecurityChange}
          aria-labelledby={securityLabelId}
        />
        {config.security === 'WEP' && (
          <Callout>{translate('controls.wifiWepWarning')}</Callout>
        )}
      </div>

      {config.security !== 'nopass' && (
        <div className="flex flex-col gap-1">
          <label htmlFor={passwordId} className="text-sm font-medium text-text-primary">
            {translate('controls.wifiPasswordLabel')}
            <abbr title={translate('controls.requiredFieldLabel')} className="ml-0.5 text-error no-underline" aria-hidden>*</abbr>
          </label>
          <div className="relative">
            <input
              id={passwordId}
              type={showPassword ? 'text' : 'password'}
              placeholder={translate('controls.wifiPasswordPlaceholder')}
              value={config.password}
              onChange={(e) => onPasswordChange(e.target.value)}
              autoComplete="off"
              className="block h-11 w-full rounded-lg border border-border-strong bg-surface-inset px-3 pr-10 text-sm text-text-primary placeholder:text-text-secondary focus:border-focus-ring focus:outline-none focus:ring-2 focus:ring-focus-ring"
            />
            <button
              type="button"
              aria-label={showPassword ? translate('controls.wifiHidePassword') : translate('controls.wifiShowPassword')}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-1 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring rounded"
            >
              {showPassword ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
            </button>
          </div>
          <p className="text-xs text-text-secondary">{translate('controls.wifiPasswordHint')}</p>
        </div>
      )}

      {/* Hidden network checkbox */}
      <div className="flex items-center gap-2.5">
        <input
          id={hiddenCheckboxId}
          type="checkbox"
          checked={config.hidden}
          onChange={(e) => onHiddenChange(e.target.checked)}
          className="h-4 w-4 rounded border-border-strong accent-action cursor-pointer"
        />
        <label htmlFor={hiddenCheckboxId} className="flex min-h-[44px] items-center text-sm text-text-primary cursor-pointer select-none">
          {translate('controls.wifiHiddenLabel')}
        </label>
        <Tooltip
          content={translate('controls.wifiHiddenTooltip')}
          ariaLabel={translate('controls.wifiHiddenTooltipAriaLabel')}
        />
      </div>
    </div>
  )
}
