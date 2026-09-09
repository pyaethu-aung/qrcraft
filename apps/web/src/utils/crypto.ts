import type { CryptoConfig, CryptoNetwork } from '../types/qr'

/**
 * Past this payload length the QR matrix gets dense enough that small prints scan
 * unreliably. Crypto URIs are normally short; the one field that can bloat is the
 * Bitcoin label, so this guards against a pasted essay producing an unscannable code.
 */
export const CRYPTO_PAYLOAD_WARN = 150

// Bitcoin: legacy/P2SH base58 (1.../3...) or bech32 (bc1...). The regex is the first gate;
// bech32 addresses get a second, stronger checksum gate (see isValidBech32).
const BTC_ADDRESS_RE = /^(bc1[a-z0-9]{6,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/
// Ethereum: 0x followed by 40 hex characters. Mixed-case checksums are accepted as-is.
const ETH_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/

const DECIMAL_RE = /^\d+(\.\d+)?$/

const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'

/** BIP-173 polymod over the HRP-expanded data; 1 == bech32, 0x2bc830a3 == bech32m. */
function bech32Polymod(values: number[]): number {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]
  let chk = 1
  for (const v of values) {
    const top = chk >> 25
    chk = ((chk & 0x1ffffff) << 5) ^ v
    for (let i = 0; i < 5; i++) if ((top >> i) & 1) chk ^= GEN[i]
  }
  return chk
}

function bech32HrpExpand(hrp: string): number[] {
  const high: number[] = []
  const low: number[] = []
  for (let i = 0; i < hrp.length; i++) {
    high.push(hrp.charCodeAt(i) >> 5)
    low.push(hrp.charCodeAt(i) & 31)
  }
  return [...high, 0, ...low]
}

/**
 * Verifies a bech32 / bech32m address checksum (BIP-173 / BIP-350). Pure arithmetic —
 * no hashing — so it catches the single-character typos a plain regex waves through,
 * which matters when a wrong address means irreversibly lost funds. Mixed case is
 * rejected per BIP-173. Legacy base58 and Ethereum addresses are not handled here:
 * their checksums need SHA-256 / keccak, a dependency disproportionate to a QR tool,
 * and those addresses are near-always pasted from a wallet rather than typed.
 */
function isValidBech32(address: string): boolean {
  // BIP-173 forbids mixing upper and lower case within one address.
  if (address !== address.toLowerCase() && address !== address.toUpperCase()) return false
  const lower = address.toLowerCase()
  const sep = lower.lastIndexOf('1')
  if (sep < 1) return false
  const hrp = lower.slice(0, sep)
  const dataChars = lower.slice(sep + 1)
  if (dataChars.length < 6) return false
  const data: number[] = []
  for (const ch of dataChars) {
    const d = BECH32_CHARSET.indexOf(ch)
    if (d === -1) return false
    data.push(d)
  }
  const polymod = bech32Polymod([...bech32HrpExpand(hrp), ...data])
  return polymod === 1 || polymod === 0x2bc830a3
}

/**
 * True when `network`'s address format accepts `raw` (trimmed). Bitcoin bech32 (bc1…)
 * addresses additionally must pass their checksum; legacy base58 and all Ethereum
 * addresses are validated by format only (see isValidBech32 for why).
 */
export function isValidCryptoAddress(network: CryptoNetwork, raw: string): boolean {
  const trimmed = raw.trim()
  if (network === 'ethereum') return ETH_ADDRESS_RE.test(trimmed)
  if (!BTC_ADDRESS_RE.test(trimmed)) return false
  if (/^bc1/i.test(trimmed)) return isValidBech32(trimmed)
  return true
}

/**
 * A positive decimal amount. Empty is not valid here — callers treat a blank amount as
 * "omit it", not "invalid". No decimal-place cap: wallets keep their full precision
 * (8 places for BTC, 18 for ETH).
 */
export function isValidAmount(raw: string): boolean {
  const trimmed = raw.trim()
  return DECIMAL_RE.test(trimmed) && Number(trimmed) > 0
}

/** The display unit for a crypto network's main amount. */
export function cryptoUnit(network: CryptoNetwork): string {
  return network === 'bitcoin' ? 'BTC' : 'ETH'
}

/**
 * Builds a cryptocurrency payment URI. Returns '' until the address is valid for the
 * chosen network, so an in-progress form behaves like an empty text field.
 *
 * - Bitcoin → BIP-21: `bitcoin:<address>?amount=<btc>&label=<text>`. `amount` is the
 *   decimal BTC value as-is; `label` is the BIP-21 human label (URI-encoded).
 * - Ethereum → EIP-681: `ethereum:<address>?value=<wei>`. The amount is converted to
 *   wei using scientific notation (`<eth>e18`), which the spec permits and avoids the
 *   precision loss of multiplying an 18-decimal float. EIP-681 has no `label` field, so
 *   the label is intentionally dropped for Ethereum (the form hides it there too).
 */
export function buildCryptoString(config: CryptoConfig): string {
  const address = config.address.trim()
  if (!isValidCryptoAddress(config.network, address)) return ''

  const amount = config.amount.trim()
  const amountValid = amount !== '' && isValidAmount(amount)

  if (config.network === 'bitcoin') {
    const params: string[] = []
    if (amountValid) params.push(`amount=${amount}`)
    const label = config.label.trim()
    if (label) params.push(`label=${encodeURIComponent(label)}`)
    return params.length ? `bitcoin:${address}?${params.join('&')}` : `bitcoin:${address}`
  }

  // ethereum
  return amountValid ? `ethereum:${address}?value=${amount}e18` : `ethereum:${address}`
}

/**
 * Length the payload will have once the address is valid, usable while it is still
 * incomplete: a long Bitcoin label typed before the address should trigger the size
 * warning immediately, not only once a valid address lands. Falls back to a known-good
 * placeholder address (a BIP-173 test-vector / all-zero) so the label's contribution is
 * still measured. (Ethereum has no label, so its draft length never approaches the cap.)
 */
export function cryptoDraftLength(config: CryptoConfig): number {
  const real = buildCryptoString(config)
  if (real) return real.length
  const placeholder = config.network === 'bitcoin'
    ? 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'
    : '0x0000000000000000000000000000000000000000'
  return buildCryptoString({ ...config, address: placeholder }).length
}
