import { useId, useMemo, useState } from 'react'
import { Input } from '../../common/Input'
import { Callout } from '../../common/Callout'
import { PillGroup } from '../../common/PillGroup'
import { useLocaleContext } from '../../../hooks/LocaleProvider'
import { CRYPTO_PAYLOAD_WARN, cryptoDraftLength, cryptoUnit, isValidAmount, isValidCryptoAddress } from '../../../utils/crypto'
import type { CryptoConfig } from '../../../types/qr'

interface CryptoFormProps {
  config: CryptoConfig
  onChange: <K extends keyof CryptoConfig>(key: K, value: CryptoConfig[K]) => void
}

/**
 * Cryptocurrency payment form: a network toggle (Bitcoin / Ethereum) plus a wallet
 * address, with an optional amount and label. The address is the only required field;
 * the QR stays empty until it's valid, so an in-progress form behaves like an empty
 * text field. A non-empty address that fails its network format shows an inline error,
 * while a blank one stays quiet — the geo/vevent validation convention.
 *
 * Bitcoin encodes BIP-21 (`bitcoin:`), Ethereum encodes EIP-681 (`ethereum:`). The
 * label is a BIP-21 field with no EIP-681 equivalent, so it's hidden for Ethereum
 * rather than collected and silently dropped.
 */
export function CryptoForm({ config, onChange }: CryptoFormProps) {
  const { translate } = useLocaleContext()
  const hintId = useId()
  const networkLabelId = useId()

  const [addressTouched, setAddressTouched] = useState(false)
  const [amountTouched, setAmountTouched] = useState(false)

  const addressFilled = !!config.address.trim()
  const addressValid = isValidCryptoAddress(config.network, config.address)
  // Deferred until the field is blurred once, so a mid-typo character doesn't flash
  // red before the user is done; live thereafter so a fix clears the error immediately.
  const addressError = addressTouched && addressFilled && !addressValid
  const otherFilled = !!config.amount.trim() || !!config.label.trim()
  // Mirror vevent: when the user filled an optional field first, say what's still missing.
  const addressHint = !addressFilled && otherFilled
    ? translate('controls.cryptoAddressNeededHint')
    : undefined

  const amountFilled = !!config.amount.trim()
  const amountError = amountTouched && amountFilled && !isValidAmount(config.amount)

  const unit = cryptoUnit(config.network)
  const isBitcoin = config.network === 'bitcoin'

  // A pasted essay in the Bitcoin label can make the matrix too dense to scan; warn the
  // same way the email/vEvent modes do. Measured even before the address is valid so the
  // caution tracks the label, not the address.
  const isPayloadLong = useMemo(() => cryptoDraftLength(config) > CRYPTO_PAYLOAD_WARN, [config])

  const previewText = addressValid
    ? amountFilled && !amountError
      ? translate('controls.cryptoPreviewWithAmount').replace('{amount}', config.amount.trim()).replace('{unit}', unit)
      : translate('controls.cryptoPreviewNoAmount')
    : undefined

  return (
    <div className="flex flex-col gap-4">
      <p id={hintId} className="text-xs text-text-secondary">
        {translate('controls.cryptoModeHint')}
      </p>

      <div className="flex flex-col gap-1">
        <span id={networkLabelId} className="text-sm font-medium text-text-primary">
          {translate('controls.cryptoNetworkLabel')}
        </span>
        <PillGroup
          size="sm"
          options={[
            { value: 'bitcoin', label: translate('controls.cryptoNetworkBitcoin') },
            { value: 'ethereum', label: translate('controls.cryptoNetworkEthereum') },
          ]}
          value={config.network}
          onChange={(v) => onChange('network', v)}
          aria-labelledby={networkLabelId}
        />
      </div>

      <Input
        label={translate('controls.cryptoAddressLabel')}
        placeholder={isBitcoin
          ? translate('controls.cryptoAddressPlaceholderBitcoin')
          : translate('controls.cryptoAddressPlaceholderEthereum')}
        aria-describedby={hintId}
        value={config.address}
        onChange={(e) => onChange('address', e.target.value)}
        onBlur={() => setAddressTouched(true)}
        error={addressError
          ? isBitcoin
            ? translate('controls.cryptoAddressErrorBitcoin')
            : translate('controls.cryptoAddressErrorEthereum')
          : undefined}
        helperText={addressHint}
        autoComplete="off"
        spellCheck={false}
        required
      />

      <Input
        label={`${translate('controls.cryptoAmountLabel')} (${unit})`}
        placeholder={isBitcoin
          ? translate('controls.cryptoAmountPlaceholderBitcoin')
          : translate('controls.cryptoAmountPlaceholderEthereum')}
        value={config.amount}
        onChange={(e) => onChange('amount', e.target.value)}
        onBlur={() => setAmountTouched(true)}
        error={amountError ? translate('controls.cryptoAmountError') : undefined}
        inputMode="decimal"
        autoComplete="off"
      />

      {/* BIP-21 carries a label; EIP-681 has no equivalent, so it's Bitcoin-only. */}
      {isBitcoin && (
        <Input
          label={translate('controls.cryptoLabelLabel')}
          placeholder={translate('controls.cryptoLabelPlaceholder')}
          value={config.label}
          onChange={(e) => onChange('label', e.target.value)}
          autoComplete="off"
        />
      )}

      <p className="text-xs text-text-secondary">{translate('controls.cryptoIrreversibleCaution')}</p>

      {isPayloadLong && (
        <Callout role="status">{translate('controls.cryptoPayloadWarning')}</Callout>
      )}

      {previewText && (
        <p role="status" className="text-xs text-text-secondary">{previewText}</p>
      )}
    </div>
  )
}
