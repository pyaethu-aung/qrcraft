import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, beforeEach } from 'vitest'

import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import { LocaleProvider } from './hooks/LocaleProvider'
import { ThemeProvider } from './hooks/ThemeProvider'
import { locales } from './data/i18n'
import { vi } from 'vitest'

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

describe('App integration', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.clearAllMocks()
  })

  it('updates UI copy and metadata when the language dropdown switches to Spanish', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <HelmetProvider>
          <LocaleProvider>
            <App />
          </LocaleProvider>
        </HelmetProvider>
      </ThemeProvider>,
    )

    expect(screen.getByRole('heading', { name: /sculpt standout qr codes/i })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe(locales.en.locale.code)

    await user.selectOptions(
      screen.getByRole('combobox', { name: locales.en.locale.toggleLabel }),
      'es',
    )

    await waitFor(() => {
      expect(document.documentElement.lang).toBe(locales.es.locale.code)
      expect(screen.getByRole('heading', { name: locales.es.hero.title })).toBeInTheDocument()
    })
  })

  it('switches between the Generate and Scan views via the toggle', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <HelmetProvider>
          <LocaleProvider>
            <App />
          </LocaleProvider>
        </HelmetProvider>
      </ThemeProvider>,
    )

    expect(screen.getByRole('heading', { name: /sculpt standout qr codes/i })).toBeInTheDocument()

    // The Scan view is lazy-loaded, so it resolves through a Suspense boundary.
    await user.click(screen.getByRole('button', { name: /^scan$/i }))
    expect(await screen.findByRole('heading', { name: /scan a qr code/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^generate$/i }))
    expect(screen.queryByRole('heading', { name: /scan a qr code/i })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /sculpt standout qr codes/i })).toBeInTheDocument()
  })

  it('derives initial locale from localStorage on load', () => {
    window.localStorage.setItem('qr-generator:locale-preference', 'es')

    render(
      <ThemeProvider>
        <HelmetProvider>
          <LocaleProvider>
            <App />
          </LocaleProvider>
        </HelmetProvider>
      </ThemeProvider>,
    )

    expect(document.documentElement.lang).toBe('es')
    expect(screen.getByRole('heading', { name: locales.es.hero.title })).toBeInTheDocument()
    expect(document.title).toBe(locales.es.seo.title)
  })
})
