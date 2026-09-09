import { getCapacityStatus } from '../../../utils/qrCapacity'
import type { QRErrorCorrectionLevel } from '../../../types/qr'

export interface CapacityCounterProps {
  /** Current content of the text field — supplies the displayed `used / max` count. */
  value: string
  /**
   * The formatted payload the QR actually encodes, when it differs from `value`.
   * Non-text modes wrap the typed fields in format scaffolding (e.g. `WIFI:…;;`,
   * a vCard body), so the payload runs larger than the raw fields. Driving the
   * near/over warning off this keeps the colour and word truthful — they flip
   * exactly when generation is blocked, not when the raw field bytes hit the
   * limit. Defaults to `value` (text mode, where the two are identical).
   */
  payloadValue?: string
  /** Active error-correction level — sets the capacity the content counts against. */
  ecLevel: QRErrorCorrectionLevel
  /** Screen-reader usage summary, with {used} and {max} placeholders. */
  usageLabel?: string
  /** Shown beside the count once content approaches the limit. */
  nearLimitLabel?: string
  /** Shown beside the count once content exceeds the limit. */
  overLimitLabel?: string
}

/**
 * A live count of how much of a QR code's capacity the content uses (e.g.
 * `42 / 2953`) for the active error-correction level. It turns amber as the
 * content nears the limit and red once it exceeds it — and because lowering the
 * correction level shrinks the capacity, the denominator updates with it.
 */
export function CapacityCounter({
  value,
  payloadValue,
  ecLevel,
  usageLabel = '{used} of {max} characters used',
  nearLimitLabel = 'Approaching limit',
  overLimitLabel = 'Over capacity',
}: CapacityCounterProps) {
  // The verdict must mirror what the generator actually encodes: in non-text
  // modes that is the formatted payload (`builtValue`), which the generator's
  // own capacity guard blocks on. The raw field count only differs there and
  // can mislead in both directions — larger than the payload (a phone number's
  // formatting is stripped) or smaller (URL-encoding, vCard scaffolding) — so
  // it never decides the warning. Text mode passes no payload, where the field
  // value *is* the payload, so the raw status stands in.
  const raw = getCapacityStatus(value, ecLevel)
  const basis = payloadValue !== undefined ? getCapacityStatus(payloadValue, ecLevel) : raw
  const max = raw.max
  const isOverLimit = basis.isOverLimit
  const isNearLimit = !isOverLimit && basis.isNearLimit

  // The displayed number tracks the friendly, live raw field count until the
  // limit looms, then switches to the count the verdict is about so the two
  // never contradict — no "Over capacity" beside a number sitting at the max.
  const used = isOverLimit || isNearLimit ? basis.used : raw.used

  const tone = isOverLimit
    ? 'text-error'
    : isNearLimit
      ? 'text-warning'
      : 'text-text-secondary'

  // A word backs the colour so the limit is not signalled by colour alone.
  const warning = isOverLimit ? overLimitLabel : isNearLimit ? nearLimitLabel : null
  const srText = usageLabel.replace('{used}', String(used)).replace('{max}', String(max))

  return (
    <div className="flex items-center justify-end gap-2 text-xs">
      {warning && (
        <span className={`font-medium ${tone}`} data-testid="capacity-warning">
          {warning}
        </span>
      )}
      <span
        className={`font-['Geist_Mono'] tabular-nums ${tone}`}
        aria-hidden="true"
        data-testid="capacity-count"
      >
        {used} / {max}
      </span>
      <span className="sr-only">{srText}</span>
    </div>
  )
}

export default CapacityCounter
