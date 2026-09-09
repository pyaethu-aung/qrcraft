import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LocaleProvider } from '../../../hooks/LocaleProvider'
import { CountryCodeSelect } from '../CountryCodeSelect'

const labels = {
  label: 'Country code',
  searchPlaceholder: 'Search country or code',
  noResultsLabel: 'No countries match',
  triggerPlaceholder: '+ Code',
}

const setup = (value: string | null = null, onChange = vi.fn()) => {
  const utils = render(
    <LocaleProvider>
      <CountryCodeSelect value={value} onChange={onChange} {...labels} />
    </LocaleProvider>
  )
  return { ...utils, onChange }
}

const trigger = () => screen.getByRole('button', { name: /country code/i })
const search = () => screen.getByRole('combobox', { name: /search country or code/i })

describe('CountryCodeSelect', () => {
  it('shows the placeholder when nothing is selected', () => {
    setup(null)
    expect(trigger()).toHaveTextContent('+ Code')
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
  })

  it('shows the flag and dial code of the selected country', () => {
    setup('MM')
    expect(trigger()).toHaveTextContent('+95')
    expect(trigger()).toHaveTextContent('🇲🇲')
  })

  it('opens the popover with a focused search field', () => {
    setup(null)
    fireEvent.click(trigger())
    expect(trigger()).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('listbox', { name: /country code/i })).toBeInTheDocument()
    expect(search()).toHaveFocus()
  })

  it('filters countries by name', () => {
    setup(null)
    fireEvent.click(trigger())
    fireEvent.change(search(), { target: { value: 'myanmar' } })
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(1)
    expect(options[0]).toHaveTextContent('Myanmar')
    expect(options[0]).toHaveTextContent('+95')
  })

  it('filters countries by dial code', () => {
    setup(null)
    fireEvent.click(trigger())
    fireEvent.change(search(), { target: { value: '+95' } })
    expect(screen.getAllByRole('option')[0]).toHaveTextContent('Myanmar')
  })

  it('shows the no-results message for an unmatched query', () => {
    setup(null)
    fireEvent.click(trigger())
    fireEvent.change(search(), { target: { value: 'zzzzzz' } })
    expect(screen.queryAllByRole('option')).toHaveLength(0)
    expect(screen.getByText('No countries match')).toBeInTheDocument()
  })

  it('selects a country on click, closes, and refocuses the trigger', async () => {
    vi.useFakeTimers()
    try {
      const { onChange } = setup(null)
      fireEvent.click(trigger())
      fireEvent.change(search(), { target: { value: 'myanmar' } })
      fireEvent.click(screen.getByRole('option'))
      expect(onChange).toHaveBeenCalledWith('MM')
      await act(() => vi.advanceTimersByTime(150))
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
      expect(trigger()).toHaveFocus()
    } finally {
      vi.useRealTimers()
    }
  })

  it('supports keyboard navigation and Enter to select', () => {
    const { onChange } = setup(null)
    fireEvent.click(trigger())
    fireEvent.change(search(), { target: { value: 'united' } })
    // Results are alphabetical; ArrowDown moves the active option to the second row.
    const options = screen.getAllByRole('option')
    expect(options.length).toBeGreaterThan(1)
    fireEvent.keyDown(search(), { key: 'ArrowDown' })
    fireEvent.keyDown(search(), { key: 'Enter' })
    expect(onChange).toHaveBeenCalledTimes(1)
    const selectedIso = onChange.mock.calls[0][0] as string
    expect(options[1].id.endsWith(selectedIso)).toBe(true)
  })

  it('jumps to the first and last option with Home and End', () => {
    setup(null)
    fireEvent.click(trigger())
    fireEvent.change(search(), { target: { value: 'united' } })
    const options = screen.getAllByRole('option')
    fireEvent.keyDown(search(), { key: 'End' })
    expect(search()).toHaveAttribute('aria-activedescendant', options[options.length - 1].id)
    fireEvent.keyDown(search(), { key: 'Home' })
    expect(search()).toHaveAttribute('aria-activedescendant', options[0].id)
  })

  it('moves the active option on hover', () => {
    setup(null)
    fireEvent.click(trigger())
    fireEvent.change(search(), { target: { value: 'united' } })
    const options = screen.getAllByRole('option')
    fireEvent.mouseEnter(options[1])
    expect(search()).toHaveAttribute('aria-activedescendant', options[1].id)
  })

  it('marks the selected country with aria-selected', () => {
    setup('MM')
    fireEvent.click(trigger())
    fireEvent.change(search(), { target: { value: 'myanmar' } })
    expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'true')
  })

  it('closes on Escape and refocuses the trigger', async () => {
    vi.useFakeTimers()
    try {
      setup(null)
      fireEvent.click(trigger())
      fireEvent.keyDown(search(), { key: 'Escape' })
      await act(() => vi.advanceTimersByTime(150))
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
      expect(trigger()).toHaveFocus()
    } finally {
      vi.useRealTimers()
    }
  })

  it('closes when the search input loses focus to an outside element', async () => {
    vi.useFakeTimers()
    try {
      setup(null)
      fireEvent.click(trigger())
      expect(screen.getByRole('listbox')).toBeInTheDocument()
      fireEvent.blur(search())
      await act(() => vi.advanceTimersByTime(150))
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('closes when clicking outside', async () => {
    vi.useFakeTimers()
    try {
      setup(null)
      fireEvent.click(trigger())
      expect(screen.getByRole('listbox')).toBeInTheDocument()
      fireEvent.mouseDown(document.body)
      await act(() => vi.advanceTimersByTime(150))
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})
