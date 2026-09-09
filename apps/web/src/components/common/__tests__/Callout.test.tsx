import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Callout } from '../Callout'

describe('Callout', () => {
  it('renders body text with an alert role by default', () => {
    render(<Callout>Keep it concise.</Callout>)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Keep it concise.')
  })

  it('renders an optional title', () => {
    render(<Callout title="Readability Risk">High density shapes may affect readability.</Callout>)
    expect(screen.getByText('Readability Risk')).toBeInTheDocument()
    expect(screen.getByText('High density shapes may affect readability.')).toBeInTheDocument()
  })

  it('supports a polite status role', () => {
    render(<Callout role="status">Heads up.</Callout>)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders no dismiss button when onDismiss is omitted', () => {
    render(<Callout>No dismiss.</Callout>)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders a dismiss button and calls onDismiss when clicked', () => {
    const onDismiss = vi.fn()
    render(<Callout onDismiss={onDismiss} dismissLabel="Dismiss warning">Dismiss me.</Callout>)
    const button = screen.getByRole('button', { name: 'Dismiss warning' })
    fireEvent.click(button)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
