import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LocaleProvider } from '../../../../hooks/LocaleProvider'
import { CryptoForm } from '../CryptoForm'
import type { CryptoConfig } from '../../../../types/qr'

const BTC = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'
const ETH = '0x52908400098527886E0F7030069857D2E4169EE7'

const defaultConfig: CryptoConfig = { network: 'bitcoin', address: '', amount: '', label: '' }

const setup = (config: Partial<CryptoConfig> = {}) => {
  const onChange = vi.fn()
  const utils = render(
    <LocaleProvider>
      <CryptoForm config={{ ...defaultConfig, ...config }} onChange={onChange} />
    </LocaleProvider>,
  )
  return { ...utils, onChange }
}

const addressInput = () => screen.getByRole('textbox', { name: /wallet address/i })

describe('CryptoForm', () => {
  it('renders the network toggle and the address field', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Bitcoin' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ethereum' })).toBeInTheDocument()
    expect(addressInput()).toBeInTheDocument()
  })

  it('reports address edits upward', () => {
    const { onChange } = setup()
    fireEvent.change(addressInput(), { target: { value: BTC } })
    expect(onChange).toHaveBeenCalledWith('address', BTC)
  })

  it('switches network when the Ethereum pill is pressed', () => {
    const { onChange } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Ethereum' }))
    expect(onChange).toHaveBeenCalledWith('network', 'ethereum')
  })

  it('shows an address error only once a non-empty value fails its network format and the field is blurred', () => {
    setup({ address: 'nonsense' })
    expect(screen.queryByText(/doesn't look like a Bitcoin address/i)).not.toBeInTheDocument()
    fireEvent.blur(addressInput())
    expect(screen.getByText(/doesn't look like a Bitcoin address/i)).toBeInTheDocument()
  })

  it('stays quiet on a blank address', () => {
    setup()
    fireEvent.blur(addressInput())
    expect(screen.queryByText(/doesn't look like/i)).not.toBeInTheDocument()
  })

  it('shows the label field for Bitcoin but hides it for Ethereum', () => {
    const { rerender } = setup({ address: BTC })
    expect(screen.getByRole('textbox', { name: /label/i })).toBeInTheDocument()
    rerender(
      <LocaleProvider>
        <CryptoForm config={{ ...defaultConfig, network: 'ethereum', address: ETH }} onChange={vi.fn()} />
      </LocaleProvider>,
    )
    expect(screen.queryByRole('textbox', { name: /label/i })).not.toBeInTheDocument()
  })

  it('flags an amount that is not greater than zero once the field is blurred', () => {
    setup({ address: BTC, amount: '0' })
    const amountInput = screen.getByRole('textbox', { name: /amount/i })
    expect(screen.queryByText(/greater than zero/i)).not.toBeInTheDocument()
    fireEvent.blur(amountInput)
    expect(screen.getByText(/greater than zero/i)).toBeInTheDocument()
  })

  it('confirms the payment once the address is valid', () => {
    setup({ address: BTC, amount: '0.001' })
    expect(screen.getByText(/payment of 0\.001 BTC/i)).toBeInTheDocument()
  })

  it('always shows the irreversibility caution', () => {
    setup()
    expect(screen.getByText(/can't be reversed/i)).toBeInTheDocument()
  })

  it('warns when the label makes the payload dense', () => {
    setup({ address: BTC, label: 'x'.repeat(200) })
    expect(screen.getByText(/makes the code dense/i)).toBeInTheDocument()
  })

  it('does not warn for a short label', () => {
    setup({ address: BTC, label: 'Coffee' })
    expect(screen.queryByText(/makes the code dense/i)).not.toBeInTheDocument()
  })
})
