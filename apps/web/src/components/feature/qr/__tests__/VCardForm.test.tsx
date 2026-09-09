import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LocaleProvider } from '../../../../hooks/LocaleProvider'
import { VCardForm } from '../VCardForm'
import type { VCardConfig } from '../../../../types/qr'

const defaultConfig: VCardConfig = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  company: '',
  jobTitle: '',
  website: '',
}

const setup = (config: VCardConfig = defaultConfig, overrides: Partial<{
  onFirstNameChange: (v: string) => void
  onLastNameChange: (v: string) => void
  onPhoneChange: (v: string) => void
  onEmailChange: (v: string) => void
  onCompanyChange: (v: string) => void
  onJobTitleChange: (v: string) => void
  onWebsiteChange: (v: string) => void
}> = {}) => {
  const handlers = {
    onFirstNameChange: overrides.onFirstNameChange ?? vi.fn(),
    onLastNameChange: overrides.onLastNameChange ?? vi.fn(),
    onPhoneChange: overrides.onPhoneChange ?? vi.fn(),
    onEmailChange: overrides.onEmailChange ?? vi.fn(),
    onCompanyChange: overrides.onCompanyChange ?? vi.fn(),
    onJobTitleChange: overrides.onJobTitleChange ?? vi.fn(),
    onWebsiteChange: overrides.onWebsiteChange ?? vi.fn(),
  }

  const utils = render(
    <LocaleProvider>
      <VCardForm config={config} {...handlers} />
    </LocaleProvider>
  )

  return { ...utils, ...handlers }
}

describe('VCardForm', () => {
  it('renders first and last name fields', () => {
    setup()
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument()
  })

  it('calls onFirstNameChange when first name is typed', () => {
    const { onFirstNameChange } = setup()
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'Jane' } })
    expect(onFirstNameChange).toHaveBeenCalledWith('Jane')
  })

  it('calls onLastNameChange when last name is typed', () => {
    const { onLastNameChange } = setup()
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Smith' } })
    expect(onLastNameChange).toHaveBeenCalledWith('Smith')
  })

  it('renders phone and email fields', () => {
    setup()
    expect(screen.getByLabelText(/Phone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
  })

  it('calls onPhoneChange when phone is typed', () => {
    const { onPhoneChange } = setup()
    fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: '+1234567890' } })
    expect(onPhoneChange).toHaveBeenCalledWith('+1234567890')
  })

  it('calls onEmailChange when email is typed', () => {
    const { onEmailChange } = setup()
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'jane@example.com' } })
    expect(onEmailChange).toHaveBeenCalledWith('jane@example.com')
  })

  it('hides professional fields by default', () => {
    setup()
    expect(screen.queryByLabelText(/Company/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Job Title/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Website/i)).not.toBeInTheDocument()
  })

  it('shows professional fields when toggle is clicked', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: /Professional details/i }))
    expect(screen.getByLabelText(/Company/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Job Title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Website/i)).toBeInTheDocument()
  })

  it('auto-opens professional section when config has data', () => {
    setup({ ...defaultConfig, company: 'Acme Corp' })
    expect(screen.getByLabelText(/Company/i)).toBeInTheDocument()
  })

  it('calls onCompanyChange when company is typed', () => {
    const { onCompanyChange } = setup({ ...defaultConfig, company: 'Acme' })
    fireEvent.change(screen.getByLabelText(/Company/i), { target: { value: 'NewCo' } })
    expect(onCompanyChange).toHaveBeenCalledWith('NewCo')
  })

  it('calls onJobTitleChange when job title is typed', () => {
    const { onJobTitleChange } = setup({ ...defaultConfig, jobTitle: 'Dev' })
    fireEvent.change(screen.getByLabelText(/Job Title/i), { target: { value: 'Designer' } })
    expect(onJobTitleChange).toHaveBeenCalledWith('Designer')
  })

  it('calls onWebsiteChange when website is typed', () => {
    const { onWebsiteChange } = setup({ ...defaultConfig, website: 'https://a.com' })
    fireEvent.change(screen.getByLabelText(/Website/i), { target: { value: 'https://b.com' } })
    expect(onWebsiteChange).toHaveBeenCalledWith('https://b.com')
  })

  it('shows an error when an invalid phone number is blurred', () => {
    setup({ ...defaultConfig, phone: 'abc' })
    fireEvent.blur(screen.getByLabelText(/Phone/i))
    expect(screen.getByRole('alert')).toHaveTextContent(/phone number/i)
  })

  it('does not show a phone error for an empty field', () => {
    setup()
    fireEvent.blur(screen.getByLabelText(/Phone/i))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('clears the phone error once the field is fixed', () => {
    const { rerender } = setup({ ...defaultConfig, phone: 'abc' })
    fireEvent.blur(screen.getByLabelText(/Phone/i))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    rerender(
      <LocaleProvider>
        <VCardForm
          config={{ ...defaultConfig, phone: '+1234567890' }}
          onFirstNameChange={vi.fn()}
          onLastNameChange={vi.fn()}
          onPhoneChange={vi.fn()}
          onEmailChange={vi.fn()}
          onCompanyChange={vi.fn()}
          onJobTitleChange={vi.fn()}
          onWebsiteChange={vi.fn()}
        />
      </LocaleProvider>,
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows an error when an invalid email is blurred', () => {
    setup({ ...defaultConfig, email: 'not-an-email' })
    fireEvent.blur(screen.getByLabelText(/Email/i))
    expect(screen.getByRole('alert')).toHaveTextContent(/valid email/i)
  })

  it('shows an error when an invalid website is blurred', () => {
    setup({ ...defaultConfig, website: 'not a url' })
    fireEvent.blur(screen.getByLabelText(/Website/i))
    expect(screen.getByRole('alert')).toHaveTextContent(/valid website/i)
  })

  it('does not show a website error for a valid bare domain', () => {
    setup({ ...defaultConfig, website: 'example.com' })
    fireEvent.blur(screen.getByLabelText(/Website/i))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
