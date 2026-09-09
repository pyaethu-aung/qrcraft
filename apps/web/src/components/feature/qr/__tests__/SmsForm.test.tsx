import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LocaleProvider } from '../../../../hooks/LocaleProvider'
import { SmsForm } from '../SmsForm'
import type { SmsConfig } from '../../../../types/qr'

const defaultConfig: SmsConfig = {
  number: '',
  message: '',
}

const setup = (config: SmsConfig = defaultConfig, overrides: Partial<{
  onNumberChange: (v: string) => void
  onMessageChange: (v: string) => void
}> = {}) => {
  const handlers = {
    onNumberChange: overrides.onNumberChange ?? vi.fn(),
    onMessageChange: overrides.onMessageChange ?? vi.fn(),
  }

  const utils = render(
    <LocaleProvider>
      <SmsForm config={config} {...handlers} />
    </LocaleProvider>
  )

  return { ...utils, ...handlers }
}

describe('SmsForm', () => {
  it('renders the phone number field and Message toggle', () => {
    setup()
    expect(screen.getByRole('textbox', { name: /phone number/i })).toBeInTheDocument()
    // Message is collapsible — the toggle button is always visible
    expect(screen.getByRole('button', { name: /message/i })).toBeInTheDocument()
  })

  it('calls onNumberChange with the dial code absorbed into the selector', () => {
    const { onNumberChange } = setup()
    fireEvent.change(screen.getByRole('textbox', { name: /phone number/i }), { target: { value: '+15551234567' } })
    expect(onNumberChange).toHaveBeenCalledWith('+1 5551234567')
  })

  it('calls onMessageChange when the Message is typed', () => {
    const { onMessageChange } = setup()
    fireEvent.click(screen.getByRole('button', { name: /message/i }))
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'See you at 7pm' } })
    expect(onMessageChange).toHaveBeenCalledWith('See you at 7pm')
  })

  it('reflects config values in inputs', () => {
    setup({ number: '+15551234567', message: 'Hi' })
    // The dial code moves into the selector; the input keeps the local part.
    expect(screen.getByRole('button', { name: /country code/i })).toHaveTextContent('+1')
    expect(screen.getByRole('textbox', { name: /phone number/i })).toHaveValue('5551234567')
    // message='Hi' → hasMessage=true → textarea auto-expands
    expect(screen.getByLabelText(/message/i)).toHaveValue('Hi')
  })

  it('phone number field has type tel', () => {
    setup()
    expect(screen.getByRole('textbox', { name: /phone number/i })).toHaveAttribute('type', 'tel')
  })

  it('Message field is a textarea', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: /message/i }))
    expect(screen.getByLabelText(/message/i).tagName).toBe('TEXTAREA')
  })

  it('shows a validation error on blur with an invalid number', () => {
    setup({ number: 'call me', message: '' })
    fireEvent.blur(screen.getByRole('textbox', { name: /phone number/i }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('clears the number error on change after a blur error', () => {
    setup({ number: 'call me', message: '' })
    const numberInput = screen.getByRole('textbox', { name: /phone number/i })
    fireEvent.blur(numberInput)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    fireEvent.change(numberInput, { target: { value: '+15551234567' } })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('warns when the message makes the payload long', () => {
    setup({ number: '+15551234567', message: 'x'.repeat(220) })
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('previews the normalized number that will be texted', () => {
    setup({ number: '+1 (555) 123-4567', message: '' })
    expect(screen.getByText(/will text: \+15551234567/i)).toBeInTheDocument()
  })

  it('cautions when a valid number has no country code', () => {
    setup({ number: '09 123 456 789', message: '' })
    expect(screen.getByText(/no country code/i)).toBeInTheDocument()
  })
})
