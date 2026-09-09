import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LocaleProvider } from '../../../../hooks/LocaleProvider'
import { EmailForm } from '../EmailForm'
import type { EmailConfig } from '../../../../types/qr'

const defaultConfig: EmailConfig = {
  to: '',
  subject: '',
  body: '',
}

const setup = (config: EmailConfig = defaultConfig, overrides: Partial<{
  onToChange: (v: string) => void
  onSubjectChange: (v: string) => void
  onBodyChange: (v: string) => void
}> = {}) => {
  const handlers = {
    onToChange: overrides.onToChange ?? vi.fn(),
    onSubjectChange: overrides.onSubjectChange ?? vi.fn(),
    onBodyChange: overrides.onBodyChange ?? vi.fn(),
  }

  const utils = render(
    <LocaleProvider>
      <EmailForm config={config} {...handlers} />
    </LocaleProvider>
  )

  return { ...utils, ...handlers }
}

describe('EmailForm', () => {
  it('renders To, Subject, and Message toggle', () => {
    setup()
    expect(screen.getByRole('textbox', { name: /To/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Subject/i)).toBeInTheDocument()
    // Message is collapsible — the toggle button is always visible
    expect(screen.getByRole('button', { name: /Message/i })).toBeInTheDocument()
  })

  it('calls onToChange when To is typed', () => {
    const { onToChange } = setup()
    fireEvent.change(screen.getByRole('textbox', { name: /To/i }), { target: { value: 'jane@example.com' } })
    expect(onToChange).toHaveBeenCalledWith('jane@example.com')
  })

  it('calls onSubjectChange when Subject is typed', () => {
    const { onSubjectChange } = setup()
    fireEvent.change(screen.getByLabelText(/Subject/i), { target: { value: 'Hello' } })
    expect(onSubjectChange).toHaveBeenCalledWith('Hello')
  })

  it('calls onBodyChange when Message is typed', () => {
    const { onBodyChange } = setup()
    fireEvent.click(screen.getByRole('button', { name: /Message/i }))
    fireEvent.change(screen.getByLabelText(/Message/i), { target: { value: 'Hi there' } })
    expect(onBodyChange).toHaveBeenCalledWith('Hi there')
  })

  it('reflects config values in inputs', () => {
    setup({ to: 'jane@example.com', subject: 'Hello', body: 'Hi' })
    expect(screen.getByRole('textbox', { name: /To/i })).toHaveValue('jane@example.com')
    expect(screen.getByLabelText(/Subject/i)).toHaveValue('Hello')
    // body='Hi' → hasBody=true → textarea auto-expands
    expect(screen.getByLabelText(/Message/i)).toHaveValue('Hi')
  })

  it('To field has type email', () => {
    setup()
    expect(screen.getByRole('textbox', { name: /To/i })).toHaveAttribute('type', 'email')
  })

  it('Message field is a textarea', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: /Message/i }))
    expect(screen.getByLabelText(/Message/i).tagName).toBe('TEXTAREA')
  })

  it('shows email validation error on blur with invalid address', () => {
    // Render with an already-invalid value so blur reads the correct DOM value
    setup({ to: 'notanemail', subject: '', body: '' })
    fireEvent.blur(screen.getByRole('textbox', { name: /To/i }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('clears the email error live once the field is fixed', () => {
    const { rerender } = setup({ to: 'notanemail', subject: '', body: '' })
    fireEvent.blur(screen.getByRole('textbox', { name: /To/i }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    rerender(
      <LocaleProvider>
        <EmailForm
          config={{ to: 'valid@example.com', subject: '', body: '' }}
          onToChange={vi.fn()}
          onSubjectChange={vi.fn()}
          onBodyChange={vi.fn()}
        />
      </LocaleProvider>,
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
