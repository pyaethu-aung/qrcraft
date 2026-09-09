import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LocaleProvider } from '../../../../hooks/LocaleProvider'
import { PhoneNumberField } from '../PhoneNumberField'
import { PHONE_REGEX } from '../../../../utils/phone'

const baseProps = {
  numberRegex: PHONE_REGEX,
  label: 'Phone number',
  placeholder: '+95 9 123 456 789',
  errorMessage: 'Enter a phone number using digits',
  hint: 'Scan to start a call.',
  previewLabel: 'Will dial: {number}',
}

const setup = (value = '', onChange = vi.fn()) => {
  const utils = render(
    <LocaleProvider>
      <PhoneNumberField value={value} onChange={onChange} {...baseProps} />
    </LocaleProvider>
  )
  return { ...utils, onChange }
}

const numberInput = () => screen.getByRole('textbox', { name: /phone number/i })

beforeEach(() => {
  window.localStorage.clear()
})

describe('PhoneNumberField', () => {
  it('starts with no country selected in the English locale', () => {
    setup('')
    expect(screen.getByRole('button', { name: /country code/i })).toHaveTextContent('Country')
    expect(numberInput()).toHaveAttribute('placeholder', '+95 9 123 456 789')
  })

  it('composes the dial code with the local number upward', () => {
    const { onChange } = setup('')
    fireEvent.click(screen.getByRole('button', { name: /country code/i }))
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'myanmar' } })
    fireEvent.click(screen.getByRole('option'))
    fireEvent.change(numberInput(), { target: { value: '9 123 456 789' } })
    expect(onChange).toHaveBeenLastCalledWith('+95 9 123 456 789')
  })

  it('switches to the local placeholder once a country is selected', () => {
    setup('')
    fireEvent.click(screen.getByRole('button', { name: /country code/i }))
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'myanmar' } })
    fireEvent.click(screen.getByRole('option'))
    expect(numberInput()).toHaveAttribute('placeholder', '9 123 456 789')
  })

  it('syncs the selector when a full + number is typed into the input', () => {
    const { onChange } = setup('')
    fireEvent.change(numberInput(), { target: { value: '+1 (555) 123-4567' } })
    expect(screen.getByRole('button', { name: /country code/i })).toHaveTextContent('+1')
    expect(numberInput()).toHaveValue('(555) 123-4567')
    expect(onChange).toHaveBeenLastCalledWith('+1 (555) 123-4567')
  })

  it('splits an initial +value into selector and local input', () => {
    setup('+95 9 123 456 789')
    expect(screen.getByRole('button', { name: /country code/i })).toHaveTextContent('+95')
    expect(numberInput()).toHaveValue('9 123 456 789')
  })

  it('keeps a value without a country code entirely in the input', () => {
    setup('09 123 456 789')
    expect(screen.getByRole('button', { name: /country code/i })).toHaveTextContent('Country')
    expect(numberInput()).toHaveValue('09 123 456 789')
  })

  it('clears the selected country on Backspace in an empty input', () => {
    const { onChange } = setup('+95 9123456')
    fireEvent.change(numberInput(), { target: { value: '' } })
    fireEvent.keyDown(numberInput(), { key: 'Backspace' })
    expect(screen.getByRole('button', { name: /country code/i })).toHaveTextContent('Country')
    expect(onChange).toHaveBeenLastCalledWith('')
  })

  it('does not emit a dial code alone when the local part is empty', () => {
    const { onChange } = setup('')
    fireEvent.click(screen.getByRole('button', { name: /country code/i }))
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'myanmar' } })
    fireEvent.click(screen.getByRole('option'))
    expect(onChange).toHaveBeenLastCalledWith('')
  })

  it('validates the combined number on blur and clears live after touch', () => {
    setup('not a number')
    fireEvent.blur(numberInput())
    expect(screen.getByRole('alert')).toBeInTheDocument()
    fireEvent.change(numberInput(), { target: { value: '+95 9 123 456 789' } })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows the caution only while the country code is missing', () => {
    setup('09 123 456 789')
    expect(screen.getByText(/no country code/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /country code/i }))
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'myanmar' } })
    fireEvent.click(screen.getByRole('option'))
    expect(screen.queryByText(/no country code/i)).not.toBeInTheDocument()
  })
})
