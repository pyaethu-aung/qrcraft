import { describe, it, expect } from 'vitest'
import { buildWifiString } from '../wifi'

describe('buildWifiString', () => {
  it('returns empty string when SSID is empty', () => {
    expect(buildWifiString({ ssid: '', password: 'pass', security: 'WPA', hidden: false })).toBe('')
  })

  it('returns empty string when SSID is whitespace only', () => {
    expect(buildWifiString({ ssid: '   ', password: 'pass', security: 'WPA', hidden: false })).toBe('')
  })

  it('builds a basic WPA network string', () => {
    expect(buildWifiString({ ssid: 'HomeNetwork', password: 'secret123', security: 'WPA', hidden: false })).toBe(
      'WIFI:T:WPA;S:HomeNetwork;P:secret123;;'
    )
  })

  it('builds a WEP network string', () => {
    expect(buildWifiString({ ssid: 'OldNet', password: 'abc123', security: 'WEP', hidden: false })).toBe(
      'WIFI:T:WEP;S:OldNet;P:abc123;;'
    )
  })

  it('builds an open network string (nopass) — omits password field', () => {
    expect(buildWifiString({ ssid: 'GuestWifi', password: 'ignored', security: 'nopass', hidden: false })).toBe(
      'WIFI:T:nopass;S:GuestWifi;;'
    )
  })

  it('includes H:true for hidden networks', () => {
    expect(buildWifiString({ ssid: 'SecretNet', password: 'pw', security: 'WPA', hidden: true })).toBe(
      'WIFI:T:WPA;S:SecretNet;P:pw;H:true;;'
    )
  })

  it('returns empty string when WPA selected but password is empty', () => {
    expect(buildWifiString({ ssid: 'MyNet', password: '', security: 'WPA', hidden: false })).toBe('')
  })

  it('returns empty string when WPA selected and password is whitespace only', () => {
    expect(buildWifiString({ ssid: 'MyNet', password: '   ', security: 'WPA', hidden: false })).toBe('')
  })

  it('escapes backslash in SSID', () => {
    expect(buildWifiString({ ssid: 'Net\\Work', password: 'pass', security: 'WPA', hidden: false })).toBe(
      'WIFI:T:WPA;S:Net\\\\Work;P:pass;;'
    )
  })

  it('escapes semicolons in SSID', () => {
    expect(buildWifiString({ ssid: 'A;B', password: 'pass', security: 'WPA', hidden: false })).toBe(
      'WIFI:T:WPA;S:A\\;B;P:pass;;'
    )
  })

  it('escapes double-quotes in password', () => {
    expect(buildWifiString({ ssid: 'Net', password: 'p"ass', security: 'WPA', hidden: false })).toBe(
      'WIFI:T:WPA;S:Net;P:p\\"ass;;'
    )
  })

  it('escapes commas in password', () => {
    expect(buildWifiString({ ssid: 'Net', password: 'a,b', security: 'WPA', hidden: false })).toBe(
      'WIFI:T:WPA;S:Net;P:a\\,b;;'
    )
  })

  it('nopass with empty password builds valid string', () => {
    expect(buildWifiString({ ssid: 'OpenNet', password: '', security: 'nopass', hidden: false })).toBe(
      'WIFI:T:nopass;S:OpenNet;;'
    )
  })

  it('handles hidden open network', () => {
    expect(buildWifiString({ ssid: 'Hidden', password: '', security: 'nopass', hidden: true })).toBe(
      'WIFI:T:nopass;S:Hidden;H:true;;'
    )
  })
})
