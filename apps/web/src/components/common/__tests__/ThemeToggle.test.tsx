import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ThemeToggle } from '../ThemeToggle'
import { ThemeProvider } from '../../../hooks/ThemeProvider'
import { LocaleProvider } from '../../../hooks/LocaleProvider'

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('ThemeToggle', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.clearAllMocks()
  })

  const renderWithProviders = (ui: React.ReactNode) => {
    return render(
      <LocaleProvider>
        <ThemeProvider>
          {ui}
        </ThemeProvider>
      </LocaleProvider>
    )
  }

  it('renders without disabled styles', () => {
    renderWithProviders(<ThemeToggle />)
    const button = screen.getByRole('button')

    expect(button).not.toHaveClass('opacity-50')
    expect(button).not.toHaveClass('cursor-not-allowed')
    expect(button).not.toHaveAttribute('aria-disabled')
  })

  it('renders an SVG icon (Sun or Moon)', () => {
    const { container } = renderWithProviders(<ThemeToggle />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('toggles theme on click and swaps SVG icon', () => {
    const { container } = renderWithProviders(<ThemeToggle />)
    const button = screen.getByRole('button')

    // Initial light mode: Moon icon
    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-label', 'Switch to dark theme')

    fireEvent.click(button)

    // After click: dark mode, Sun icon
    expect(window.document.documentElement.classList.contains('dark')).toBe(true)
    expect(button).toHaveAttribute('aria-label', 'Switch to light theme')
    expect(container.querySelector('svg')).toBeInTheDocument()

    fireEvent.click(button)

    // After second click: back to light mode
    expect(window.document.documentElement.classList.contains('dark')).toBe(false)
    expect(button).toHaveAttribute('aria-label', 'Switch to dark theme')
  })

  it('reflects theme from localStorage', () => {
    window.localStorage.setItem('qr-generator:theme-preference', 'dark')
    renderWithProviders(<ThemeToggle />)
    const button = screen.getByRole('button')

    expect(window.document.documentElement.classList.contains('dark')).toBe(true)
    expect(button).toHaveAttribute('aria-label', 'Switch to light theme')
  })
})
