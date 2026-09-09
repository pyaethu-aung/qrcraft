import type { WiFiConfig } from '../types/qr'

function escapeWifiField(value: string): string {
  return value.replace(/[\\;,"]/g, (c) => `\\${c}`)
}

export function buildWifiString(config: WiFiConfig): string {
  const { ssid, password, security, hidden } = config
  if (!ssid.trim()) return ''
  if (security !== 'nopass' && !password.trim()) return ''

  const parts = [`T:${security}`, `S:${escapeWifiField(ssid)}`]
  if (security !== 'nopass' && password) {
    parts.push(`P:${escapeWifiField(password)}`)
  }
  if (hidden) {
    parts.push('H:true')
  }

  return `WIFI:${parts.join(';')};;`
}
