import { useState, useId, useMemo } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from '../../common/Input'
import { Textarea } from '../../common/Textarea'
import { Callout } from '../../common/Callout'
import { useLocaleContext } from '../../../hooks/LocaleProvider'
import { buildEmailString, EMAIL_REGEX } from '../../../utils/email'
import type { EmailConfig } from '../../../types/qr'

const EMAIL_PAYLOAD_WARN = 300

interface EmailFormProps {
  config: EmailConfig
  onToChange: (v: string) => void
  onSubjectChange: (v: string) => void
  onBodyChange: (v: string) => void
}

export function EmailForm({ config, onToChange, onSubjectChange, onBodyChange }: EmailFormProps) {
  const { translate } = useLocaleContext()
  const bodyId = useId()
  const bodyToggleId = useId()
  const bodyRegionId = useId()
  const hintId = useId()
  // Starts open when a message already exists, but the user can still
  // collapse it afterwards — the content is kept in state, only hidden.
  const [bodyOpen, setBodyOpen] = useState(!!config.body)
  const [toTouched, setToTouched] = useState(false)

  const payloadLength = useMemo(() => buildEmailString(config).length, [config])

  const isPayloadLong = payloadLength > EMAIL_PAYLOAD_WARN

  // Deferred until the field is blurred once, so a mid-typo character doesn't flash
  // red before the user is done; live thereafter so a fix clears the error immediately.
  const toTrimmed = config.to.trim()
  const toError = toTouched && toTrimmed !== '' && !EMAIL_REGEX.test(toTrimmed)
    ? translate('controls.emailToError')
    : undefined

  return (
    <div className="flex flex-col gap-4">
      <p id={hintId} className="text-xs text-text-secondary">{translate('controls.emailModeHint')}</p>
      <Input
        label={translate('controls.emailToLabel')}
        placeholder={translate('controls.emailToPlaceholder')}
        aria-describedby={hintId}
        value={config.to}
        onChange={(e) => onToChange(e.target.value)}
        onBlur={() => setToTouched(true)}
        error={toError}
        type="email"
        autoComplete="email"
        required
      />
      <Input
        label={translate('controls.emailSubjectLabel')}
        placeholder={translate('controls.emailSubjectPlaceholder')}
        value={config.subject}
        onChange={(e) => onSubjectChange(e.target.value)}
        autoComplete="off"
      />

      {/* Message — collapsible, optional */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          id={bodyToggleId}
          onClick={() => setBodyOpen(prev => !prev)}
          className="flex min-h-[44px] items-center justify-between w-full text-sm font-medium text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring rounded"
          aria-expanded={bodyOpen}
          aria-controls={bodyRegionId}
        >
          <span>{translate('controls.emailBodyLabel')}</span>
          {bodyOpen ? (
            <ChevronUp size={15} aria-hidden className="text-text-secondary" />
          ) : (
            <ChevronDown size={15} aria-hidden className="text-text-secondary" />
          )}
        </button>
        {bodyOpen && (
          <div id={bodyRegionId}>
            <Textarea
              id={bodyId}
              aria-labelledby={bodyToggleId}
              placeholder={translate('controls.emailBodyPlaceholder')}
              value={config.body}
              onChange={(e) => onBodyChange(e.target.value)}
            />
          </div>
        )}
      </div>

      {isPayloadLong && (
        <Callout role="status">{translate('controls.emailPayloadWarning')}</Callout>
      )}
    </div>
  )
}
