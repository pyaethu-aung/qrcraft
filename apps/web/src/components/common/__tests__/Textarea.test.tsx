import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Textarea } from '../Textarea'

describe('Textarea', () => {
  it('renders label and accepts multiline input', async () => {
    render(<Textarea label="Message" helperText="Optional note" />)
    expect(screen.getByText('Message')).toBeInTheDocument()
    expect(screen.getByText('Optional note')).toBeInTheDocument()
    const field = screen.getByLabelText('Message')
    expect(field).toBeEnabled()
    await userEvent.type(field, 'line one')
    expect((field as HTMLTextAreaElement).value).toBe('line one')
  })

  it('shows error message and disabled styles', () => {
    render(<Textarea label="Body" error="Too long" disabled />)
    const field = screen.getByLabelText('Body')
    expect(screen.getByText('Too long')).toBeInTheDocument()
    expect(field).toBeDisabled()
    expect(field).toHaveClass('cursor-not-allowed')
    expect(field).toHaveAttribute('aria-invalid', 'true')
  })

  it('associates helper text and announces it politely', () => {
    render(<Textarea label="Body" helperText="Keep it short" />)
    const helper = screen.getByText('Keep it short')
    expect(helper).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByLabelText('Body').getAttribute('aria-describedby')).toContain(helper.id)
  })

  it('merges helper id with a caller-supplied describedby', () => {
    render(<Textarea label="Body" helperText="Keep it short" aria-describedby="outer-hint" />)
    const describedBy = screen.getByLabelText('Body').getAttribute('aria-describedby')
    expect(describedBy).toContain('outer-hint')
    expect(describedBy).toContain(screen.getByText('Keep it short').id)
  })

  it('supports being labelled externally via aria-labelledby (the collapsible-toggle usage)', () => {
    render(
      <>
        <button id="msg-toggle" type="button">Message</button>
        <Textarea aria-labelledby="msg-toggle" />
      </>,
    )
    // No internal <label> rendered, but the control is still named for AT.
    expect(screen.getByRole('textbox', { name: 'Message' })).toBeInTheDocument()
  })
})
