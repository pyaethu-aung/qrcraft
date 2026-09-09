import { useState, useId, useMemo } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from '../../common/Input'
import { Textarea } from '../../common/Textarea'
import { Callout } from '../../common/Callout'
import { useLocaleContext } from '../../../hooks/LocaleProvider'
import { isEndBeforeStart, veventDraftLength, VEVENT_PAYLOAD_WARN } from '../../../utils/vevent'
import type { VEventConfig } from '../../../types/qr'

interface VEventFormProps {
  config: VEventConfig
  onSummaryChange: (v: string) => void
  onStartChange: (v: string) => void
  onEndChange: (v: string) => void
  onAllDayChange: (v: boolean) => void
  onLocationChange: (v: string) => void
  onDescriptionChange: (v: string) => void
}

/**
 * Calendar event (vEvent) form: title plus start/end, with all-day switching the
 * native pickers from datetime-local to date. Native inputs are deliberate — the
 * platform's own date picker (especially on phones) beats any custom calendar for
 * this audience. The end field is optional; when present it must not precede the
 * start, enforced both by the picker's `min` and by an inline error for values
 * typed past it. Description mirrors the email form's collapsible optional block,
 * including its long-payload warning, so the two modes feel like one tool.
 */
export function VEventForm({
  config,
  onSummaryChange,
  onStartChange,
  onEndChange,
  onAllDayChange,
  onLocationChange,
  onDescriptionChange,
}: VEventFormProps) {
  const { translate } = useLocaleContext()
  const hintId = useId()
  const allDayCheckboxId = useId()
  const descriptionId = useId()
  const descriptionToggleId = useId()
  const descriptionRegionId = useId()
  // Starts open when a description already exists, but the user can still
  // collapse it afterwards — the content is kept in state, only hidden.
  const [descriptionOpen, setDescriptionOpen] = useState(!!config.description)
  const [endTouched, setEndTouched] = useState(false)

  // Deferred until either date field is blurred once, so mid-entry typing doesn't
  // flash red before the user is done choosing both dates.
  const endError = endTouched && isEndBeforeStart(config)

  // The QR only exists once both required fields are filled. When the user has
  // started elsewhere (the other required field, or an optional one like the
  // description), say what's missing — a dead preview with no words is where
  // first-timers stall.
  const summaryFilled = !!config.summary.trim()
  const startFilled = !!config.start.trim()
  const hasOptionalContent = !!config.location.trim() || !!config.description.trim()
  const summaryHint = !summaryFilled
    ? startFilled
      ? translate('controls.veventNeedTitleHint')
      : hasOptionalContent
        ? translate('controls.veventNeedBothHint')
        : undefined
    : undefined
  const startHint =
    summaryFilled && !startFilled ? translate('controls.veventNeedStartHint') : undefined

  const payloadLength = useMemo(() => veventDraftLength(config), [config])

  const isPayloadLong = payloadLength > VEVENT_PAYLOAD_WARN

  return (
    <div className="flex flex-col gap-4">
      <p id={hintId} className="text-xs text-text-secondary">
        {translate('controls.veventModeHint')}
      </p>

      <Input
        label={translate('controls.veventSummaryLabel')}
        placeholder={translate('controls.veventSummaryPlaceholder')}
        aria-describedby={hintId}
        value={config.summary}
        onChange={(e) => onSummaryChange(e.target.value)}
        helperText={summaryHint}
        autoComplete="off"
        required
      />

      {/* All-day sits above the pickers it reshapes, so the date-shape decision
          comes before time entry instead of after both times are typed. */}
      <div className="flex items-center gap-2.5">
        <input
          id={allDayCheckboxId}
          type="checkbox"
          checked={config.allDay}
          onChange={(e) => onAllDayChange(e.target.checked)}
          className="h-4 w-4 rounded border-border-strong accent-action cursor-pointer"
        />
        <label
          htmlFor={allDayCheckboxId}
          className="flex min-h-[44px] items-center text-sm text-text-primary cursor-pointer select-none"
        >
          {translate('controls.veventAllDayLabel')}
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={translate('controls.veventStartLabel')}
          type={config.allDay ? 'date' : 'datetime-local'}
          aria-describedby={hintId}
          value={config.start}
          onChange={(e) => onStartChange(e.target.value)}
          onBlur={() => setEndTouched(true)}
          helperText={startHint}
          required
        />
        <Input
          label={translate('controls.veventEndLabel')}
          type={config.allDay ? 'date' : 'datetime-local'}
          aria-describedby={hintId}
          value={config.end}
          onChange={(e) => onEndChange(e.target.value)}
          onBlur={() => setEndTouched(true)}
          min={config.start || undefined}
          error={endError ? translate('controls.veventEndError') : undefined}
        />
      </div>

      <Input
        label={translate('controls.veventLocationLabel')}
        placeholder={translate('controls.veventLocationPlaceholder')}
        value={config.location}
        onChange={(e) => onLocationChange(e.target.value)}
        autoComplete="off"
      />

      {/* Description — collapsible, optional */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          id={descriptionToggleId}
          onClick={() => setDescriptionOpen((prev) => !prev)}
          className="flex min-h-[44px] items-center justify-between w-full text-sm font-medium text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring rounded"
          aria-expanded={descriptionOpen}
          aria-controls={descriptionRegionId}
        >
          <span>{translate('controls.veventDescriptionLabel')}</span>
          {descriptionOpen ? (
            <ChevronUp size={15} aria-hidden className="text-text-secondary" />
          ) : (
            <ChevronDown size={15} aria-hidden className="text-text-secondary" />
          )}
        </button>
        {descriptionOpen && (
          <div id={descriptionRegionId}>
            <Textarea
              id={descriptionId}
              aria-labelledby={descriptionToggleId}
              placeholder={translate('controls.veventDescriptionPlaceholder')}
              value={config.description}
              onChange={(e) => onDescriptionChange(e.target.value)}
            />
          </div>
        )}
      </div>

      {isPayloadLong && (
        <Callout role="status">{translate('controls.veventPayloadWarning')}</Callout>
      )}
    </div>
  )
}
