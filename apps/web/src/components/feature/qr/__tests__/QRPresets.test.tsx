import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QRPresets } from '../QRPresets'
import type { PresetEntry } from '../../../../hooks/useQRPresets'

const mockPreset: PresetEntry = {
  id: 'test-1',
  savedAt: Date.now(),
  name: 'My Brand',
  fgColor: '#000000',
  bgColor: '#ffffff',
  transparentBg: false,
  ecLevel: 'M',
  designConfig: {
    eyeFrameShape: 'Square',
    eyeCenterShape: 'Square',
    eyeFrameColor: null,
    eyeCenterColor: null,
    pixelPattern: 'Square',
    fgGradient: null,
  },
  frameConfig: {
    style: 'None',
    text: 'SCAN ME',
    color: '#000000',
    position: 'bottom',
  },
}

const defaultProps = {
  presets: [] as PresetEntry[],
  onApply: vi.fn(),
  onDelete: vi.fn(),
  onSave: vi.fn(),
  maxPresets: 10,
  sectionLabel: 'Saved designs',
  emptyHint: 'Save your design to reuse it.',
  saveButton: 'Save design',
  savedLabel: 'Design saved',
  saveNamePlaceholder: 'Name this design',
  saveNameAriaLabel: 'Design preset name',
  saveConfirmAriaLabel: 'Save',
  saveCancelAriaLabel: 'Cancel',
  deleteAriaLabel: 'Delete {name}',
  confirmDeleteAriaLabel: 'Confirm delete {name}',
  appliedLabel: 'Design applied',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('QRPresets', () => {
  it('shows the section label', () => {
    render(<QRPresets {...defaultProps} />)
    expect(screen.getByText('Saved designs')).toBeTruthy()
  })

  it('shows empty hint when there are no presets', () => {
    render(<QRPresets {...defaultProps} />)
    expect(screen.getByText('Save your design to reuse it.')).toBeTruthy()
  })

  it('shows Save design button when under the max', () => {
    render(<QRPresets {...defaultProps} />)
    expect(screen.getByText('Save design')).toBeTruthy()
  })

  it('hides Save design button when at max presets', () => {
    const full = Array.from({ length: 10 }, (_, i) => ({ ...mockPreset, id: `id-${i}`, name: `P ${i}` }))
    render(<QRPresets {...defaultProps} presets={full} />)
    expect(screen.queryByText('Save design')).toBeNull()
  })

  it('reveals name input when Save design is clicked', () => {
    render(<QRPresets {...defaultProps} />)
    fireEvent.click(screen.getByText('Save design'))
    expect(screen.getByPlaceholderText('Name this design')).toBeTruthy()
  })

  it('calls onSave with trimmed name when confirmed via button', () => {
    const onSave = vi.fn()
    render(<QRPresets {...defaultProps} onSave={onSave} />)
    fireEvent.click(screen.getByText('Save design'))
    fireEvent.change(screen.getByPlaceholderText('Name this design'), { target: { value: '  Dark Kit  ' } })
    fireEvent.click(screen.getByLabelText('Save'))
    expect(onSave).toHaveBeenCalledWith('Dark Kit')
  })

  it('calls onSave when Enter is pressed in name input', () => {
    const onSave = vi.fn()
    render(<QRPresets {...defaultProps} onSave={onSave} />)
    fireEvent.click(screen.getByText('Save design'))
    const input = screen.getByPlaceholderText('Name this design')
    fireEvent.change(input, { target: { value: 'Brand Kit' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSave).toHaveBeenCalledWith('Brand Kit')
  })

  it('does not call onSave when name is blank', () => {
    const onSave = vi.fn()
    render(<QRPresets {...defaultProps} onSave={onSave} />)
    fireEvent.click(screen.getByText('Save design'))
    fireEvent.click(screen.getByLabelText('Save'))
    expect(onSave).not.toHaveBeenCalled()
  })

  it('closes name input on Escape key', () => {
    render(<QRPresets {...defaultProps} />)
    fireEvent.click(screen.getByText('Save design'))
    fireEvent.keyDown(screen.getByPlaceholderText('Name this design'), { key: 'Escape' })
    expect(screen.queryByPlaceholderText('Name this design')).toBeNull()
  })

  it('closes name input on cancel button', () => {
    render(<QRPresets {...defaultProps} />)
    fireEvent.click(screen.getByText('Save design'))
    fireEvent.click(screen.getByLabelText('Cancel'))
    expect(screen.queryByPlaceholderText('Name this design')).toBeNull()
  })

  it('renders existing preset names', () => {
    render(<QRPresets {...defaultProps} presets={[mockPreset]} />)
    expect(screen.getByText('My Brand')).toBeTruthy()
  })

  it('calls onApply when a preset card is clicked', () => {
    const onApply = vi.fn()
    render(<QRPresets {...defaultProps} presets={[mockPreset]} onApply={onApply} />)
    fireEvent.click(screen.getByText('My Brand'))
    expect(onApply).toHaveBeenCalledWith(mockPreset)
  })

  it('requires two clicks to delete (first click enters pending state)', () => {
    const onDelete = vi.fn()
    render(<QRPresets {...defaultProps} presets={[mockPreset]} onDelete={onDelete} />)
    fireEvent.click(screen.getByLabelText('Delete My Brand'))
    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Confirm delete My Brand')).toBeTruthy()
  })

  it('calls onDelete on second click when in pending state', () => {
    const onDelete = vi.fn()
    render(<QRPresets {...defaultProps} presets={[mockPreset]} onDelete={onDelete} />)
    fireEvent.click(screen.getByLabelText('Delete My Brand'))
    fireEvent.click(screen.getByLabelText('Confirm delete My Brand'))
    expect(onDelete).toHaveBeenCalledWith('test-1')
  })

  it('marks confirm button disabled when name input is empty', () => {
    render(<QRPresets {...defaultProps} />)
    fireEvent.click(screen.getByText('Save design'))
    const saveBtn = screen.getByLabelText('Save')
    expect((saveBtn as HTMLButtonElement).disabled).toBe(true)
  })

  it('enables confirm button once name is entered', () => {
    render(<QRPresets {...defaultProps} />)
    fireEvent.click(screen.getByText('Save design'))
    fireEvent.change(screen.getByPlaceholderText('Name this design'), { target: { value: 'Kit' } })
    const saveBtn = screen.getByLabelText('Save')
    expect((saveBtn as HTMLButtonElement).disabled).toBe(false)
  })
})
