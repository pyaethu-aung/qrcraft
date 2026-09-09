import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LocaleProvider } from '../../../../hooks/LocaleProvider'
import { WiFiForm } from '../WiFiForm'
import type { WiFiConfig } from '../../../../types/qr'

const defaultConfig: WiFiConfig = {
  ssid: '',
  password: '',
  security: 'WPA',
  hidden: false,
}

const setup = (config: WiFiConfig = defaultConfig, overrides: Partial<{
  onSsidChange: (v: string) => void
  onPasswordChange: (v: string) => void
  onSecurityChange: (v: WiFiConfig['security']) => void
  onHiddenChange: (v: boolean) => void
}> = {}) => {
  const onSsidChange = overrides.onSsidChange ?? vi.fn()
  const onPasswordChange = overrides.onPasswordChange ?? vi.fn()
  const onSecurityChange = overrides.onSecurityChange ?? vi.fn()
  const onHiddenChange = overrides.onHiddenChange ?? vi.fn()

  const utils = render(
    <LocaleProvider>
      <WiFiForm
        config={config}
        onSsidChange={onSsidChange}
        onPasswordChange={onPasswordChange}
        onSecurityChange={onSecurityChange}
        onHiddenChange={onHiddenChange}
      />
    </LocaleProvider>
  )

  return { ...utils, onSsidChange, onPasswordChange, onSecurityChange, onHiddenChange }
}

describe('WiFiForm', () => {
  it('renders the SSID field', () => {
    setup()
    expect(screen.getByLabelText(/Network Name/i)).toBeInTheDocument()
  })

  it('calls onSsidChange when SSID is typed', () => {
    const { onSsidChange } = setup()
    fireEvent.change(screen.getByLabelText(/Network Name/i), { target: { value: 'MyNet' } })
    expect(onSsidChange).toHaveBeenCalledWith('MyNet')
  })

  it('renders WPA, WEP, and None security options', () => {
    setup()
    expect(screen.getByRole('button', { name: 'WPA/WPA2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'WEP' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'None' })).toBeInTheDocument()
  })

  it('marks active security with aria-pressed=true', () => {
    setup({ ...defaultConfig, security: 'WEP' })
    expect(screen.getByRole('button', { name: 'WEP' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'WPA/WPA2' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onSecurityChange when security pill is clicked', () => {
    const { onSecurityChange } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'WEP' }))
    expect(onSecurityChange).toHaveBeenCalledWith('WEP')
  })

  it('renders password field for WPA security', () => {
    setup({ ...defaultConfig, security: 'WPA' })
    expect(screen.getByPlaceholderText(/Network password/i)).toBeInTheDocument()
  })

  it('hides password field when security is None', () => {
    setup({ ...defaultConfig, security: 'nopass' })
    expect(screen.queryByPlaceholderText(/Network password/i)).not.toBeInTheDocument()
  })

  it('calls onPasswordChange when password is typed', () => {
    const { onPasswordChange } = setup({ ...defaultConfig, security: 'WPA' })
    fireEvent.change(screen.getByPlaceholderText(/Network password/i), { target: { value: 'secret' } })
    expect(onPasswordChange).toHaveBeenCalledWith('secret')
  })

  it('toggles password visibility', () => {
    setup({ ...defaultConfig, security: 'WPA', password: 'secret' })
    const passwordInput = screen.getByPlaceholderText(/Network password/i)
    expect(passwordInput).toHaveAttribute('type', 'password')

    fireEvent.click(screen.getByRole('button', { name: /Show password/i }))
    expect(passwordInput).toHaveAttribute('type', 'text')

    fireEvent.click(screen.getByRole('button', { name: /Hide password/i }))
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('renders the hidden network checkbox', () => {
    setup()
    expect(screen.getByRole('checkbox', { name: /Hidden network/i })).toBeInTheDocument()
  })

  it('calls onHiddenChange when checkbox is toggled', () => {
    const { onHiddenChange } = setup()
    fireEvent.click(screen.getByRole('checkbox', { name: /Hidden network/i }))
    expect(onHiddenChange).toHaveBeenCalledWith(true)
  })
})
