import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PhoneNumberFeedback } from '../PhoneNumberFeedback'

const labels = {
  previewId: 'preview-x',
  previewLabel: 'Will dial: {number}',
  noCountryCodeCaution: 'No country code yet.',
}

describe('PhoneNumberFeedback', () => {
  it('renders nothing for an empty or too-short number', () => {
    const { container, rerender } = render(<PhoneNumberFeedback rawNumber="" {...labels} />)
    expect(container).toBeEmptyDOMElement()
    rerender(<PhoneNumberFeedback rawNumber="123" {...labels} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('previews the normalized number once it has enough digits', () => {
    render(<PhoneNumberFeedback rawNumber="+1 (555) 123-4567" {...labels} />)
    const preview = screen.getByText('Will dial: +15551234567')
    expect(preview).toHaveAttribute('id', 'preview-x')
  })

  it('shows the caution when a previewable number lacks a country code', () => {
    render(<PhoneNumberFeedback rawNumber="09 123 456 789" {...labels} />)
    expect(screen.getByText('Will dial: 09123456789')).toBeInTheDocument()
    expect(screen.getByText('No country code yet.')).toBeInTheDocument()
  })

  it('hides the caution when the number has a country code', () => {
    render(<PhoneNumberFeedback rawNumber="+95 9 123 456 789" {...labels} />)
    expect(screen.getByText(/will dial:/i)).toBeInTheDocument()
    expect(screen.queryByText('No country code yet.')).not.toBeInTheDocument()
  })
})
