import type { KeyboardEvent } from 'react'
import { useId, useMemo, useState } from 'react'
import { Input } from '../../common/Input'
import { CountryCodeSelect } from '../../common/CountryCodeSelect'
import { PhoneNumberFeedback } from './PhoneNumberFeedback'
import { useLocaleContext } from '../../../hooks/LocaleProvider'
import { phoneFeedback } from '../../../utils/phone'
import { findCountry, matchDialCode } from '../../../utils/country'

interface PhoneNumberFieldProps {
  /** The combined number owned upstream (dial code + local part, or free text). */
  value: string
  onChange: (v: string) => void
  /** Shape check applied to the combined number on blur (TEL/SMS regex). */
  numberRegex: RegExp
  label: string
  /** Placeholder while no country is selected (full international example). */
  placeholder: string
  errorMessage: string
  /** Mode-level hint rendered above the field and wired via aria-describedby. */
  hint: string
  /** Preview template with a `{number}` placeholder, e.g. "Will dial: {number}". */
  previewLabel: string
}

/** Joins the dial code and local part into the upstream number string. */
function compose(iso: string | null, local: string): string {
  if (!local.trim()) return ''
  const dialCode = iso ? findCountry(iso)?.dialCode : undefined
  return dialCode ? `${dialCode} ${local}` : local
}

/**
 * Phone-number field shared by the Phone (tel:) and SMS forms: a country dial-code
 * selector fused to the number input, plus the normalized-number preview and
 * missing-country-code caution. Upstream state stays a single string (`value`);
 * the dial-code/local split lives here. Typing or pasting a full "+..." number
 * syncs the selector (two-way), and Backspace in an empty input clears it.
 */
export function PhoneNumberField({
  value,
  onChange,
  numberRegex,
  label,
  placeholder,
  errorMessage,
  hint,
  previewLabel,
}: PhoneNumberFieldProps) {
  const { translate } = useLocaleContext()
  const hintId = useId()
  const groupLabelId = useId()
  const previewId = useId()
  const errorId = useId()
  const inputId = useId()

  // Derive the initial split once from the upstream value: a "+..." value maps onto
  // selector + local part; anything else starts with no country selected. After
  // mount this field is the only writer of `value`.
  const [iso, setIso] = useState<string | null>(() => matchDialCode(value)?.country.iso ?? null)
  const [local, setLocal] = useState(() => matchDialCode(value)?.rest ?? value)

  const [numberError, setNumberError] = useState<string | undefined>()
  const [touched, setTouched] = useState(false)

  const combined = compose(iso, local)

  // Only point the field's description at the preview line when it's actually shown,
  // to avoid a dangling aria-describedby reference.
  const { showPreview } = useMemo(() => phoneFeedback(combined), [combined])
  const describedBy = [hintId, showPreview ? previewId : null, numberError ? errorId : null]
    .filter(Boolean)
    .join(' ')

  const validate = (composed: string) => {
    const trimmed = composed.trim()
    if (!trimmed) {
      setNumberError(undefined)
      return
    }
    setNumberError(numberRegex.test(trimmed) ? undefined : errorMessage)
  }

  const apply = (nextIso: string | null, nextLocal: string) => {
    setIso(nextIso)
    setLocal(nextLocal)
    const composed = compose(nextIso, nextLocal)
    onChange(composed)
    // Once the field has been blurred at least once, keep validating live so the
    // error clears the instant the number becomes valid (and returns if broken again).
    if (touched) validate(composed)
    else if (numberError) setNumberError(undefined)
  }

  const handleLocalChange = (raw: string) => {
    // Pasting or typing a full "+..." number moves the dial code into the selector.
    const match = matchDialCode(raw)
    if (match) apply(match.country.iso, match.rest)
    else apply(iso, raw)
  }

  const handleLocalKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // Backspace at an empty input releases the selected country, mirroring how the
    // dial code was absorbed on the way in.
    if (event.key === 'Backspace' && local === '' && iso) apply(null, '')
  }

  return (
    <div className="flex flex-col gap-4">
      <p id={hintId} className="text-xs text-text-secondary">{hint}</p>
      <div role="group" aria-labelledby={groupLabelId} className="flex flex-col gap-1.5">
        <div className="flex w-full flex-col gap-1">
          <label id={groupLabelId} htmlFor={inputId} className="text-sm font-medium text-text-primary">
            {label}
            <span className="ml-0.5 text-error" aria-hidden="true">*</span>
            <span className="sr-only">required</span>
          </label>
          <div className="flex w-full">
            <CountryCodeSelect
              value={iso}
              onChange={(nextIso) => apply(nextIso, local)}
              label={translate('controls.phoneCountryLabel')}
              searchPlaceholder={translate('controls.phoneCountrySearchPlaceholder')}
              noResultsLabel={translate('controls.phoneCountryNoResults')}
              triggerPlaceholder={translate('controls.phoneCountryTriggerEmpty')}
            />
            <div className="relative z-[1] min-w-0 flex-1 focus-within:z-10">
              <Input
                id={inputId}
                placeholder={iso ? translate('controls.phoneNumberLocalPlaceholder') : placeholder}
                aria-describedby={describedBy}
                aria-invalid={numberError ? true : undefined}
                value={local}
                onChange={(e) => handleLocalChange(e.target.value)}
                onKeyDown={handleLocalKeyDown}
                onBlur={() => {
                  setTouched(true)
                  validate(combined)
                }}
                className={
                  numberError
                    ? 'rounded-l-none border-l-0 border-error focus-visible:border-error focus-visible:ring-error'
                    : 'rounded-l-none border-l-0'
                }
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
              />
            </div>
          </div>
          {numberError && (
            <span id={errorId} role="alert" className="text-sm text-error">{numberError}</span>
          )}
        </div>
        <PhoneNumberFeedback
          rawNumber={combined}
          previewId={previewId}
          previewLabel={previewLabel}
          noCountryCodeCaution={translate('controls.phoneNoCountryCodeCaution')}
        />
      </div>
    </div>
  )
}
