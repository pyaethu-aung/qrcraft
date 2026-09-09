import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LocaleProvider } from '../../../../hooks/LocaleProvider'
import { TelForm } from '../TelForm'
import type { TelConfig } from '../../../../types/qr'

const defaultConfig: TelConfig = {
  number: '',
}

const setup = (config: TelConfig = defaultConfig, overrides: Partial<{
  onNumberChange: (v: string) => void
}> = {}) => {
  const handlers = {
    onNumberChange: overrides.onNumberChange ?? vi.fn(),
  }

  const utils = render(
    <LocaleProvider>
      <TelForm config={config} {...handlers} />
    </LocaleProvider>
  )

  return { ...utils, ...handlers }
}

describe('TelForm', () => {
  it('renders the phone number field', () => {
    setup()
    expect(screen.getByRole('textbox', { name: /phone number/i })).toBeInTheDocument()
  })

  it('calls onNumberChange with the dial code absorbed into the selector', () => {
    const { onNumberChange } = setup()
    fireEvent.change(screen.getByRole('textbox', { name: /phone number/i }), { target: { value: '+15551234567' } })
    expect(onNumberChange).toHaveBeenCalledWith('+1 5551234567')
  })

  it('splits the config value between selector and input', () => {
    setup({ number: '+15551234567' })
    expect(screen.getByRole('button', { name: /country code/i })).toHaveTextContent('+1')
    expect(screen.getByRole('textbox', { name: /phone number/i })).toHaveValue('5551234567')
  })

  it('phone number field has type tel', () => {
    setup()
    expect(screen.getByRole('textbox', { name: /phone number/i })).toHaveAttribute('type', 'tel')
  })

  it('shows a validation error on blur with an invalid number', () => {
    setup({ number: 'call me' })
    fireEvent.blur(screen.getByRole('textbox', { name: /phone number/i }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('clears the number error on change after a blur error', () => {
    setup({ number: 'call me' })
    const numberInput = screen.getByRole('textbox', { name: /phone number/i })
    fireEvent.blur(numberInput)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    fireEvent.change(numberInput, { target: { value: '+15551234567' } })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('previews the normalized number that will be dialed', () => {
    setup({ number: '+1 (555) 123-4567' })
    expect(screen.getByText(/will dial: \+15551234567/i)).toBeInTheDocument()
  })

  it('shows no dial preview when the number is empty or invalid', () => {
    const { rerender } = setup({ number: '' })
    expect(screen.queryByText(/will dial:/i)).not.toBeInTheDocument()
    rerender(
      <LocaleProvider>
        <TelForm config={{ number: 'call me' }} onNumberChange={vi.fn()} />
      </LocaleProvider>
    )
    expect(screen.queryByText(/will dial:/i)).not.toBeInTheDocument()
  })

  it('cautions when a valid number has no country code', () => {
    setup({ number: '09 123 456 789' })
    expect(screen.getByText(/no country code/i)).toBeInTheDocument()
  })

  it('does not caution when the number has a country code', () => {
    setup({ number: '+95 9 123 456 789' })
    expect(screen.queryByText(/no country code/i)).not.toBeInTheDocument()
  })
})
