import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ScanHistory } from '../ScanHistory'
import type { ScanHistoryEntry } from '../../../../hooks/useScanHistory'
import type { DecodedContentType } from '../../../../utils/qrClassify'

const typeLabel = (type: DecodedContentType) => type.toUpperCase()

const entry = (over: Partial<ScanHistoryEntry> = {}): ScanHistoryEntry => ({
  id: '1',
  savedAt: 1,
  label: 'https://example.com',
  value: 'https://example.com',
  type: 'url',
  ...over,
})

function setup(history: ScanHistoryEntry[], over: Partial<Parameters<typeof ScanHistory>[0]> = {}) {
  const onRestore = vi.fn()
  const onRemove = vi.fn()
  const onClear = vi.fn()
  render(
    <ScanHistory
      history={history}
      onRestore={onRestore}
      onRemove={onRemove}
      onClear={onClear}
      sectionLabel="Recently scanned"
      clearAriaLabel="Clear scan history"
      removeAriaLabel="Remove from scan history"
      typeLabel={typeLabel}
      {...over}
    />,
  )
  return { onRestore, onRemove, onClear }
}

describe('ScanHistory', () => {
  it('renders nothing when history is empty', () => {
    const { container } = render(
      <ScanHistory
        history={[]}
        onRestore={vi.fn()}
        onRemove={vi.fn()}
        onClear={vi.fn()}
        sectionLabel="Recently scanned"
        clearAriaLabel="Clear scan history"
        removeAriaLabel="Remove from scan history"
        typeLabel={typeLabel}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders an entry with its label and type badge', () => {
    setup([entry()])
    expect(screen.getByText('Recently scanned')).toBeInTheDocument()
    expect(screen.getByText('https://example.com')).toBeInTheDocument()
    expect(screen.getByText('URL')).toBeInTheDocument()
  })

  it('calls onRestore with the entry when a row is clicked', () => {
    const { onRestore } = setup([entry({ value: 'restore-me', label: 'restore-me' })])
    fireEvent.click(screen.getByRole('button', { name: /url: restore-me/i }))
    expect(onRestore).toHaveBeenCalledWith(expect.objectContaining({ value: 'restore-me' }))
  })

  it('announces the restored entry to assistive tech', () => {
    setup([entry({ label: 'restored value' })])
    fireEvent.click(screen.getByRole('button', { name: /url: restored value/i }))
    expect(screen.getByText('restored value', { selector: '.sr-only' })).toBeInTheDocument()
  })

  it('renders a remove button for each entry', () => {
    setup([
      entry({ id: '1', value: 'one', label: 'one' }),
      entry({ id: '2', value: 'two', label: 'two' }),
    ])
    expect(
      screen.getAllByRole('button', { name: /remove from scan history/i }),
    ).toHaveLength(2)
  })

  it('calls onRemove with the entry when its remove button is clicked', () => {
    const { onRemove, onRestore } = setup([entry({ value: 'drop-me', label: 'drop-me' })])
    fireEvent.click(
      screen.getByRole('button', { name: /remove from scan history: drop-me/i }),
    )
    expect(onRemove).toHaveBeenCalledWith(expect.objectContaining({ value: 'drop-me' }))
    expect(onRestore).not.toHaveBeenCalled()
  })

  it('calls onClear when the clear button is pressed', () => {
    const { onClear } = setup([entry()])
    fireEvent.click(screen.getByRole('button', { name: /clear scan history/i }))
    expect(onClear).toHaveBeenCalled()
  })

  it('shows distinct labels for differing content types', () => {
    setup([
      entry({ id: '1', type: 'wifi', value: 'WIFI:S:net;;', label: 'WIFI:S:net;;' }),
      entry({ id: '2', type: 'tel', value: 'tel:+100', label: 'tel:+100' }),
    ])
    expect(screen.getByText('WIFI')).toBeInTheDocument()
    expect(screen.getByText('TEL')).toBeInTheDocument()
  })
})
