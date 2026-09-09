import { useState, useId, useMemo } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Callout } from '../../common/Callout'
import { Textarea } from '../../common/Textarea'
import { PhoneNumberField } from './PhoneNumberField'
import { useLocaleContext } from '../../../hooks/LocaleProvider'
import { buildSmsString, SMS_PHONE_REGEX } from '../../../utils/sms'
import type { SmsConfig } from '../../../types/qr'

const SMS_PAYLOAD_WARN = 200

interface SmsFormProps {
  config: SmsConfig
  onNumberChange: (v: string) => void
  onMessageChange: (v: string) => void
}

export function SmsForm({ config, onNumberChange, onMessageChange }: SmsFormProps) {
  const { translate } = useLocaleContext()
  const messageId = useId()
  const messageToggleId = useId()
  const messageRegionId = useId()
  const [messageOpen, setMessageOpen] = useState(false)

  const hasMessage = !!config.message

  const payloadLength = useMemo(() => buildSmsString(config).length, [config])
  const isPayloadLong = payloadLength > SMS_PAYLOAD_WARN

  return (
    <div className="flex flex-col gap-4">
      <PhoneNumberField
        value={config.number}
        onChange={onNumberChange}
        numberRegex={SMS_PHONE_REGEX}
        label={translate('controls.smsNumberLabel')}
        placeholder={translate('controls.smsNumberPlaceholder')}
        errorMessage={translate('controls.smsNumberError')}
        hint={translate('controls.smsModeHint')}
        previewLabel={translate('controls.smsTextPreview')}
      />

      {/* Message — collapsible, optional */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          id={messageToggleId}
          onClick={() => setMessageOpen(prev => !prev)}
          className="flex min-h-[44px] items-center justify-between w-full text-sm font-medium text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring rounded"
          aria-expanded={messageOpen || hasMessage}
          aria-controls={messageRegionId}
        >
          <span>{translate('controls.smsMessageLabel')}</span>
          {messageOpen || hasMessage ? (
            <ChevronUp size={15} aria-hidden className="text-action" />
          ) : (
            <ChevronDown size={15} aria-hidden className="text-action" />
          )}
        </button>
        {(messageOpen || hasMessage) && (
          <div id={messageRegionId}>
            <Textarea
              id={messageId}
              aria-labelledby={messageToggleId}
              placeholder={translate('controls.smsMessagePlaceholder')}
              value={config.message}
              onChange={(e) => onMessageChange(e.target.value)}
            />
          </div>
        )}
      </div>

      {isPayloadLong && (
        <Callout>{translate('controls.smsPayloadWarning')}</Callout>
      )}
    </div>
  )
}
