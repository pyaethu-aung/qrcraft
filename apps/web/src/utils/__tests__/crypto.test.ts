import { describe, it, expect } from 'vitest'
import { buildCryptoString, CRYPTO_PAYLOAD_WARN, cryptoDraftLength, cryptoUnit, isValidAmount, isValidCryptoAddress } from '../crypto'
import type { CryptoConfig } from '../../types/qr'

// Well-formed sample addresses (not associated with any real wallet).
const BTC_BECH32 = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'
const BTC_LEGACY = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
const ETH = '0x52908400098527886E0F7030069857D2E4169EE7'

const btc = (over: Partial<CryptoConfig> = {}): CryptoConfig => ({
  network: 'bitcoin', address: BTC_BECH32, amount: '', label: '', ...over,
})
const eth = (over: Partial<CryptoConfig> = {}): CryptoConfig => ({
  network: 'ethereum', address: ETH, amount: '', label: '', ...over,
})

describe('isValidCryptoAddress', () => {
  it('accepts bech32 and legacy Bitcoin addresses', () => {
    expect(isValidCryptoAddress('bitcoin', BTC_BECH32)).toBe(true)
    expect(isValidCryptoAddress('bitcoin', BTC_LEGACY)).toBe(true)
  })

  it('accepts a 40-hex Ethereum address', () => {
    expect(isValidCryptoAddress('ethereum', ETH)).toBe(true)
  })

  it('rejects an Ethereum address pasted under the Bitcoin network and vice versa', () => {
    expect(isValidCryptoAddress('bitcoin', ETH)).toBe(false)
    expect(isValidCryptoAddress('ethereum', BTC_BECH32)).toBe(false)
  })

  it('rejects empty, truncated, and malformed input', () => {
    expect(isValidCryptoAddress('bitcoin', '')).toBe(false)
    expect(isValidCryptoAddress('ethereum', '0x123')).toBe(false)
    expect(isValidCryptoAddress('ethereum', '0xZZ908400098527886E0F7030069857D2E4169EE7')).toBe(false)
  })

  it('trims surrounding whitespace before validating', () => {
    expect(isValidCryptoAddress('ethereum', `  ${ETH}  `)).toBe(true)
  })

  it('verifies the bech32 checksum, rejecting a format-valid bc1 typo', () => {
    // Flip one character of the valid test vector — regex still passes, checksum must not.
    expect(isValidCryptoAddress('bitcoin', 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t5')).toBe(false)
    expect(isValidCryptoAddress('bitcoin', BTC_BECH32)).toBe(true)
  })

  it('rejects a mixed-case bech32 address per BIP-173', () => {
    expect(isValidCryptoAddress('bitcoin', 'bc1QW508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')).toBe(false)
  })
})

describe('isValidAmount', () => {
  it('accepts positive decimals', () => {
    expect(isValidAmount('0.001')).toBe(true)
    expect(isValidAmount('12')).toBe(true)
  })

  it('rejects zero, negatives, blanks, and non-numbers', () => {
    expect(isValidAmount('0')).toBe(false)
    expect(isValidAmount('-1')).toBe(false)
    expect(isValidAmount('')).toBe(false)
    expect(isValidAmount('1.2.3')).toBe(false)
    expect(isValidAmount('abc')).toBe(false)
  })
})

describe('cryptoUnit', () => {
  it('maps networks to their main unit', () => {
    expect(cryptoUnit('bitcoin')).toBe('BTC')
    expect(cryptoUnit('ethereum')).toBe('ETH')
  })
})

describe('buildCryptoString — Bitcoin (BIP-21)', () => {
  it('returns empty string until the address is valid', () => {
    expect(buildCryptoString(btc({ address: '' }))).toBe('')
    expect(buildCryptoString(btc({ address: 'not-an-address' }))).toBe('')
  })

  it('encodes a bare address with no query when amount and label are absent', () => {
    expect(buildCryptoString(btc())).toBe(`bitcoin:${BTC_BECH32}`)
  })

  it('appends a valid amount', () => {
    expect(buildCryptoString(btc({ amount: '0.001' }))).toBe(`bitcoin:${BTC_BECH32}?amount=0.001`)
  })

  it('omits an invalid or zero amount', () => {
    expect(buildCryptoString(btc({ amount: '0' }))).toBe(`bitcoin:${BTC_BECH32}`)
    expect(buildCryptoString(btc({ amount: 'lots' }))).toBe(`bitcoin:${BTC_BECH32}`)
  })

  it('URI-encodes the label', () => {
    expect(buildCryptoString(btc({ label: 'Coffee fund' }))).toBe(`bitcoin:${BTC_BECH32}?label=Coffee%20fund`)
  })

  it('orders amount before label', () => {
    expect(buildCryptoString(btc({ amount: '0.5', label: 'Tip' }))).toBe(`bitcoin:${BTC_BECH32}?amount=0.5&label=Tip`)
  })
})

describe('buildCryptoString — Ethereum (EIP-681)', () => {
  it('returns empty string until the address is valid', () => {
    expect(buildCryptoString(eth({ address: '0xabc' }))).toBe('')
  })

  it('encodes a bare address with no query when amount is absent', () => {
    expect(buildCryptoString(eth())).toBe(`ethereum:${ETH}`)
  })

  it('converts the amount to wei via scientific notation', () => {
    expect(buildCryptoString(eth({ amount: '1.5' }))).toBe(`ethereum:${ETH}?value=1.5e18`)
  })

  it('drops the label — EIP-681 has no equivalent field', () => {
    expect(buildCryptoString(eth({ amount: '2', label: 'ignored' }))).toBe(`ethereum:${ETH}?value=2e18`)
  })
})

describe('cryptoDraftLength', () => {
  it('measures the real payload once the address is valid', () => {
    expect(cryptoDraftLength(btc())).toBe(`bitcoin:${BTC_BECH32}`.length)
  })

  it('measures a long label even before the address lands, so the warning fires early', () => {
    const longLabel = 'x'.repeat(200)
    expect(cryptoDraftLength(btc({ address: '', label: longLabel }))).toBeGreaterThan(CRYPTO_PAYLOAD_WARN)
  })

  it('stays well under the cap for a bare Ethereum address (no label field)', () => {
    expect(cryptoDraftLength(eth({ address: '' }))).toBeLessThan(CRYPTO_PAYLOAD_WARN)
  })
})
