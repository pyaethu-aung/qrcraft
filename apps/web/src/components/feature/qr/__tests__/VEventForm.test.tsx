import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LocaleProvider } from '../../../../hooks/LocaleProvider'
import { VEventForm } from '../VEventForm'
import type { VEventConfig } from '../../../../types/qr'

const defaultConfig: VEventConfig = {
  summary: '',
  start: '',
  end: '',
  allDay: false,
  location: '',
  description: '',
}

const setup = (config: VEventConfig = defaultConfig) => {
  const handlers = {
    onSummaryChange: vi.fn(),
    onStartChange: vi.fn(),
    onEndChange: vi.fn(),
    onAllDayChange: vi.fn(),
    onLocationChange: vi.fn(),
    onDescriptionChange: vi.fn(),
  }
  const utils = render(
    <LocaleProvider>
      <VEventForm config={config} {...handlers} />
    </LocaleProvider>,
  )
  return { ...utils, ...handlers }
}

const titleInput = () => screen.getByLabelText(/event title/i)
const startInput = () => screen.getByLabelText(/starts/i)
const endInput = () => screen.getByLabelText(/ends/i)
const allDayCheckbox = () => screen.getByRole('checkbox', { name: /all-day/i })

describe('VEventForm', () => {
  it('renders title, start, end, all-day, and location fields', () => {
    setup()
    expect(titleInput()).toBeInTheDocument()
    expect(startInput()).toBeInTheDocument()
    expect(endInput()).toBeInTheDocument()
    expect(allDayCheckbox()).toBeInTheDocument()
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument()
  })

  it('reports field edits upward', () => {
    const { onSummaryChange, onStartChange, onEndChange, onLocationChange } = setup()
    fireEvent.change(titleInput(), { target: { value: 'Team dinner' } })
    fireEvent.change(startInput(), { target: { value: '2026-07-01T19:00' } })
    fireEvent.change(endInput(), { target: { value: '2026-07-01T21:30' } })
    fireEvent.change(screen.getByLabelText(/location/i), { target: { value: 'City Hall' } })
    expect(onSummaryChange).toHaveBeenCalledWith('Team dinner')
    expect(onStartChange).toHaveBeenCalledWith('2026-07-01T19:00')
    expect(onEndChange).toHaveBeenCalledWith('2026-07-01T21:30')
    expect(onLocationChange).toHaveBeenCalledWith('City Hall')
  })

  it('uses datetime pickers for timed events and date pickers for all-day', () => {
    setup()
    expect(startInput()).toHaveAttribute('type', 'datetime-local')
    expect(endInput()).toHaveAttribute('type', 'datetime-local')
  })

  it('switches to date-only pickers when all-day is set', () => {
    setup({ ...defaultConfig, allDay: true })
    expect(startInput()).toHaveAttribute('type', 'date')
    expect(endInput()).toHaveAttribute('type', 'date')
  })

  it('reports the all-day toggle upward', () => {
    const { onAllDayChange } = setup()
    fireEvent.click(allDayCheckbox())
    expect(onAllDayChange).toHaveBeenCalledWith(true)
  })

  it('floors the end picker at the chosen start', () => {
    setup({ ...defaultConfig, start: '2026-07-01T19:00' })
    expect(endInput()).toHaveAttribute('min', '2026-07-01T19:00')
  })

  it('shows an error when the end precedes the start once a date field is blurred', () => {
    setup({ ...defaultConfig, start: '2026-07-01T19:00', end: '2026-07-01T18:00' })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    fireEvent.blur(endInput())
    expect(screen.getByRole('alert')).toHaveTextContent(/can't be before the start/i)
  })

  it('shows no error while the end field is empty', () => {
    setup({ ...defaultConfig, start: '2026-07-01T19:00' })
    fireEvent.blur(startInput())
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('keeps the description collapsed until opened, then reports edits', () => {
    const { onDescriptionChange } = setup()
    expect(screen.queryByRole('textbox', { name: /description/i })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /description/i }))
    const textarea = screen.getByRole('textbox', { name: /description/i })
    fireEvent.change(textarea, { target: { value: 'Bring the deck' } })
    expect(onDescriptionChange).toHaveBeenCalledWith('Bring the deck')
  })

  it('keeps the description open when it already has content', () => {
    setup({ ...defaultConfig, description: 'Agenda attached' })
    expect(screen.getByRole('textbox', { name: /description/i })).toBeInTheDocument()
  })

  it('warns when the payload grows long enough to strain scanning', () => {
    setup({
      ...defaultConfig,
      summary: 'Quarterly planning offsite',
      start: '2026-07-01T09:00',
      description: 'x'.repeat(400),
    })
    expect(screen.getByRole('status')).toHaveTextContent(/easier to scan/i)
  })

  it('warns about a long description even before the title exists', () => {
    setup({ ...defaultConfig, description: 'x'.repeat(400) })
    expect(screen.getByRole('status')).toHaveTextContent(/easier to scan/i)
  })

  it('describes the date fields with the on-screen mode hint', () => {
    setup()
    const hint = screen.getByText(/add your event to their calendar/i)
    expect(startInput().getAttribute('aria-describedby')).toContain(hint.id)
    expect(endInput().getAttribute('aria-describedby')).toContain(hint.id)
  })

  it('does not warn for a typical event', () => {
    setup({ ...defaultConfig, summary: 'Team dinner', start: '2026-07-01T19:00' })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('describes the title field with the on-screen mode hint', () => {
    setup()
    const hint = screen.getByText(/add your event to their calendar/i)
    expect(titleInput().getAttribute('aria-describedby')).toContain(hint.id)
  })

  it('prompts for the missing start once a title exists', () => {
    setup({ ...defaultConfig, summary: 'Team dinner' })
    expect(screen.getByText(/add a start date to finish/i)).toBeInTheDocument()
  })

  it('prompts for the missing title once a start exists', () => {
    setup({ ...defaultConfig, start: '2026-07-01T19:00' })
    expect(screen.getByText(/add an event title to finish/i)).toBeInTheDocument()
  })

  it('prompts for both required fields when only an optional one is filled', () => {
    setup({ ...defaultConfig, description: 'Bring the deck' })
    expect(screen.getByText(/add an event title and start date to finish/i)).toBeInTheDocument()
  })

  it('shows no completion prompts while the form is pristine or complete', () => {
    const { unmount } = setup()
    expect(screen.queryByText(/to finish your qr code/i)).not.toBeInTheDocument()
    unmount()
    setup({ ...defaultConfig, summary: 'Team dinner', start: '2026-07-01T19:00' })
    expect(screen.queryByText(/to finish your qr code/i)).not.toBeInTheDocument()
  })
})
