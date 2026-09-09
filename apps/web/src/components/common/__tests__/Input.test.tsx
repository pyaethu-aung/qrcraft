import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Input } from '../Input'

describe('Input', () => {
  it('renders label and helper text', async () => {
    render(<Input label="Name" helperText="Enter your name" />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Enter your name')).toBeInTheDocument()
    const input = screen.getByLabelText('Name')
    expect(input).toBeEnabled()
    await userEvent.type(input, 'Alice')
    expect((input as HTMLInputElement).value).toBe('Alice')
  })

  it('shows error message and disabled styles', () => {
    render(<Input label="Email" error="Invalid" disabled />)
    const input = screen.getByLabelText('Email')
    expect(screen.getByText('Invalid')).toBeInTheDocument()
    expect(input).toBeDisabled()
    expect(input).toHaveClass('cursor-not-allowed')
  })

  it('associates helper text with the input and announces it politely', () => {
    render(<Input label="Name" helperText="Enter your name" />)
    const helper = screen.getByText('Enter your name')
    expect(helper).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByLabelText('Name').getAttribute('aria-describedby')).toContain(helper.id)
  })

  it('merges helper id with a caller-supplied describedby', () => {
    render(<Input label="Name" helperText="Enter your name" aria-describedby="outer-hint" />)
    const describedBy = screen.getByLabelText('Name').getAttribute('aria-describedby')
    expect(describedBy).toContain('outer-hint')
    expect(describedBy).toContain(screen.getByText('Enter your name').id)
  })
})
