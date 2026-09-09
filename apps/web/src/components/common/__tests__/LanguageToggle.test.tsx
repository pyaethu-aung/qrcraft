import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { LanguageToggle } from '../LanguageToggle'
import { LocaleProvider } from '../../../hooks/LocaleProvider'
import { localeCodes, locales } from '../../../data/i18n'

const renderToggle = () =>
  render(
    <LocaleProvider>
      <LanguageToggle />
    </LocaleProvider>,
  )

describe('LanguageToggle', () => {
  it('renders a labelled language dropdown', () => {
    renderToggle()
    expect(
      screen.getByRole('combobox', { name: locales.en.locale.toggleLabel }),
    ).toBeInTheDocument()
  })

  it('lists every supported locale as an option', () => {
    renderToggle()
    expect(screen.getAllByRole('option')).toHaveLength(localeCodes.length)
    for (const code of localeCodes) {
      expect(
        screen.getByRole('option', { name: locales[code].locale.name }),
      ).toBeInTheDocument()
    }
  })

  it('is focusable through keyboard navigation', async () => {
    const user = userEvent.setup()
    renderToggle()

    await user.tab()

    expect(screen.getByRole('combobox')).toHaveFocus()
  })

  it('switches the active locale when another option is selected', async () => {
    const user = userEvent.setup()
    renderToggle()

    const select = screen.getByRole('combobox')
    expect(select).toHaveValue('en')

    await user.selectOptions(select, 'es')
    expect(select).toHaveValue('es')
  })
})
