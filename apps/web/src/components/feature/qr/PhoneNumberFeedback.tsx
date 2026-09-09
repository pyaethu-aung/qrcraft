import { useMemo } from 'react'
import { phoneFeedback } from '../../../utils/phone'

interface PhoneNumberFeedbackProps {
  /** The raw, user-typed number (formatting preserved). */
  rawNumber: string
  /** Stable id for the preview line, so the field's aria-describedby can reference it. */
  previewId: string
  /** Preview template with a `{number}` placeholder, e.g. "Will dial: {number}". */
  previewLabel: string
  /** Verb-neutral nudge shown when a previewable number has no country code. */
  noCountryCodeCaution: string
}

/**
 * Shared confirmation + caution for phone-number fields (Phone and SMS): shows the
 * normalized number that will actually be encoded, and a soft nudge when it lacks a
 * country code. Logic lives in `phoneFeedback` so both forms stay in lockstep.
 */
export function PhoneNumberFeedback({ rawNumber, previewId, previewLabel, noCountryCodeCaution }: PhoneNumberFeedbackProps) {
  const { normalized, showPreview, missingCountryCode } = useMemo(() => phoneFeedback(rawNumber), [rawNumber])

  if (!showPreview) return null

  return (
    <>
      <p id={previewId} className="text-xs text-text-secondary">
        {previewLabel.replace('{number}', normalized!)}
      </p>
      {missingCountryCode && (
        <p aria-live="polite" className="text-xs text-warning">
          {noCountryCodeCaution}
        </p>
      )}
    </>
  )
}
