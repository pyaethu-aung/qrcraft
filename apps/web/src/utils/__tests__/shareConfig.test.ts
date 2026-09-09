import { describe, it, expect, beforeEach } from 'vitest'
import {
  encodeShareConfig,
  decodeShareConfig,
  buildShareUrl,
  hydrateShareConfig,
  getHydratedAppearance,
  getHydratedSecrets,
  type ShareConfigInput,
} from '../shareConfig'
import type { QRDesignConfig, QRFrameConfig } from '../../types/qr'
import { DEFAULT_QR_CONFIG } from '../../data/defaults'

const design: QRDesignConfig = {
  eyeFrameShape: 'Circle',
  eyeCenterShape: 'Dot',
  eyeFrameColor: '#ff0000',
  eyeCenterColor: null,
  pixelPattern: 'Dots',
  fgGradient: null,
}

const frame: QRFrameConfig = {
  style: 'Banner',
  text: 'SCAN ME',
  color: '#A04D28',
  position: 'top',
}

const baseInput: ShareConfigInput = {
  mode: 'text',
  content: 'https://example.com',
  ecLevel: 'Q',
  fgColor: '#123456',
  bgColor: '#ffffff',
  design,
  frame,
}

/** Encode an arbitrary object the same way the module does, to forge hostile tokens. */
function tokenFor(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value))
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

describe('encode / decode round trip', () => {
  it('round-trips a text config', () => {
    const decoded = decodeShareConfig(encodeShareConfig(baseInput))
    expect(decoded).not.toBeNull()
    expect(decoded?.mode).toBe('text')
    expect(decoded?.content).toBe('https://example.com')
    expect(decoded?.appearance).toEqual({ ecLevel: 'Q', fgColor: '#123456', bgColor: '#ffffff' })
    expect(decoded?.design).toEqual(design)
    expect(decoded?.frame).toEqual(frame)
  })

  it('round-trips a structured wifi config including the password and Unicode', () => {
    const input: ShareConfigInput = {
      ...baseInput,
      mode: 'wifi',
      content: { ssid: 'ကော်ဖီ', password: 'pä$$ 🔒', security: 'WPA', hidden: true },
    }
    const decoded = decodeShareConfig(encodeShareConfig(input))
    expect(decoded?.mode).toBe('wifi')
    expect(decoded?.content).toEqual({ ssid: 'ကော်ဖီ', password: 'pä$$ 🔒', security: 'WPA', hidden: true })
  })

  it('round-trips a foreground gradient', () => {
    const input: ShareConfigInput = {
      ...baseInput,
      design: { ...design, fgGradient: { type: 'linear', from: '#112233', to: '#445566', direction: 'to-r' } },
    }
    const decoded = decodeShareConfig(encodeShareConfig(input))
    expect(decoded?.design.fgGradient).toEqual({ type: 'linear', from: '#112233', to: '#445566', direction: 'to-r' })
  })

  it('drops a hostile gradient back to solid (null)', () => {
    const decoded = decodeShareConfig(tokenFor({
      v: 1, m: 'text', d: 'hi',
      g: { eyeFrameShape: 'Square', fgGradient: { type: 'evil', from: 'javascript:alert(1)', to: '#000000', direction: 'to-r' } },
    }))
    expect(decoded?.design.fgGradient).toBeNull()
  })

  it('defaults a gradient with an unknown direction to to-br', () => {
    const decoded = decodeShareConfig(tokenFor({
      v: 1, m: 'text', d: 'hi',
      g: { fgGradient: { type: 'radial', from: '#000000', to: '#ffffff', direction: 'diagonal' } },
    }))
    expect(decoded?.design.fgGradient).toEqual({ type: 'radial', from: '#000000', to: '#ffffff', direction: 'to-br' })
  })

  it('round-trips every structured mode shape', () => {
    const samples: ShareConfigInput[] = [
      { ...baseInput, mode: 'vcard', content: { firstName: 'A', lastName: 'B', phone: '1', email: 'e', company: 'c', jobTitle: 'j', website: 'w' } },
      { ...baseInput, mode: 'email', content: { to: 'a@b.c', subject: 's', body: 'b' } },
      { ...baseInput, mode: 'sms', content: { number: '+1', message: 'm' } },
      { ...baseInput, mode: 'tel', content: { number: '+1' } },
      { ...baseInput, mode: 'geo', content: { latitude: '1.5', longitude: '2.5' } },
      { ...baseInput, mode: 'vevent', content: { summary: 's', start: '2026-01-01T10:00', end: '', allDay: false, location: 'l', description: 'd' } },
      { ...baseInput, mode: 'crypto', content: { network: 'ethereum', address: '0xabc', amount: '1.5', label: 'tip' } },
    ]
    for (const input of samples) {
      const decoded = decodeShareConfig(encodeShareConfig(input))
      expect(decoded?.mode).toBe(input.mode)
      expect(decoded?.content).toEqual(input.content)
    }
  })
})

describe('decode rejects malformed or hostile tokens', () => {
  it('returns null for an empty token', () => {
    expect(decodeShareConfig('')).toBeNull()
  })

  it('returns null for garbage that is not valid base64/JSON', () => {
    expect(decodeShareConfig('!!!not-base64!!!')).toBeNull()
  })

  it('returns null for valid base64 that is not JSON', () => {
    expect(decodeShareConfig(tokenFor(undefined))).toBeNull()
  })

  it('returns null for an unsupported schema version', () => {
    expect(decodeShareConfig(tokenFor({ v: 2, m: 'text', d: 'x' }))).toBeNull()
  })

  it('returns null for an unknown content mode', () => {
    expect(decodeShareConfig(tokenFor({ v: 1, m: 'malware', d: 'x' }))).toBeNull()
  })
})

describe('decode sanitizes attacker-controlled fields', () => {
  it('drops a non-hex foreground/background color to the safe default', () => {
    const token = tokenFor({ v: 1, m: 'text', d: 'hi', e: 'M', f: 'red;url(x)', b: 'javascript:1', g: design, r: frame })
    const decoded = decodeShareConfig(token)
    expect(decoded?.appearance.fgColor).toBe(DEFAULT_QR_CONFIG.fgColor)
    expect(decoded?.appearance.bgColor).toBe(DEFAULT_QR_CONFIG.bgColor)
  })

  it('drops an invalid EC level to M', () => {
    const decoded = decodeShareConfig(tokenFor({ v: 1, m: 'text', d: 'hi', e: 'Z' }))
    expect(decoded?.appearance.ecLevel).toBe('M')
  })

  it('falls back unknown design shapes and a bad eye color', () => {
    const decoded = decodeShareConfig(tokenFor({
      v: 1, m: 'text', d: 'hi',
      g: { eyeFrameShape: 'Triangle', eyeCenterShape: 'Blob', eyeFrameColor: 'evil', eyeCenterColor: '#00ff00', pixelPattern: 'Spiral' },
    }))
    expect(decoded?.design).toEqual({
      eyeFrameShape: 'Square', eyeCenterShape: 'Square', eyeFrameColor: null, eyeCenterColor: '#00ff00', pixelPattern: 'Square', fgGradient: null,
    })
  })

  it('caps the frame caption length and validates frame fields', () => {
    const decoded = decodeShareConfig(tokenFor({
      v: 1, m: 'text', d: 'hi',
      r: { style: 'Nope', text: 'x'.repeat(100), color: 'not-a-color', position: 'sideways' },
    }))
    expect(decoded?.frame.style).toBe('None')
    expect(decoded?.frame.text.length).toBe(24)
    expect(decoded?.frame.color).toBe('#A04D28')
    expect(decoded?.frame.position).toBe('bottom')
  })

  it('caps free text at the input length limit', () => {
    const decoded = decodeShareConfig(tokenFor({ v: 1, m: 'text', d: 'a'.repeat(5000) }))
    expect((decoded?.content as string).length).toBe(2000)
  })

  it('coerces a non-string text payload to empty', () => {
    const decoded = decodeShareConfig(tokenFor({ v: 1, m: 'text', d: { not: 'a string' } }))
    expect(decoded?.content).toBe('')
  })
})

describe('buildShareUrl', () => {
  it('builds a #c= URL on an explicit base that decodes back', () => {
    const url = buildShareUrl(baseInput, 'https://qr.example/app')
    expect(url.startsWith('https://qr.example/app#c=')).toBe(true)
    const token = url.split('#c=')[1]
    expect(decodeShareConfig(token)?.content).toBe('https://example.com')
  })

  it('defaults the base to the current page without its hash', () => {
    const url = buildShareUrl(baseInput)
    expect(url).toContain('#c=')
    expect(url).not.toContain('##')
  })
})

describe('hydrateShareConfig', () => {
  let store: Map<string, string>
  let storage: Pick<Storage, 'setItem'>

  beforeEach(() => {
    store = new Map()
    storage = { setItem: (k, v) => store.set(k, v) }
    window.location.hash = ''
  })

  it('returns null and writes nothing when no token is present', () => {
    expect(hydrateShareConfig(storage, '')).toBeNull()
    expect(store.size).toBe(0)
  })

  it('writes the text draft, design, frame and caches appearance', () => {
    const token = encodeShareConfig(baseInput)
    const decoded = hydrateShareConfig(storage, `#c=${token}`)
    expect(decoded?.mode).toBe('text')
    expect(store.get('qr-generator:draft:content-mode')).toBe('text')
    expect(store.get('qr-generator:draft:text')).toBe('https://example.com')
    expect(JSON.parse(store.get('qr-generator-design-config')!)).toEqual(design)
    expect(JSON.parse(store.get('qr-generator-frame-config')!)).toEqual(frame)
    expect(getHydratedAppearance()).toEqual({ ecLevel: 'Q', fgColor: '#123456', bgColor: '#ffffff' })
  })

  it('writes a structured mode draft as JSON under its own key', () => {
    const input: ShareConfigInput = { ...baseInput, mode: 'sms', content: { number: '+1', message: 'hi' } }
    hydrateShareConfig(storage, `#c=${encodeShareConfig(input)}`)
    expect(store.get('qr-generator:draft:content-mode')).toBe('sms')
    expect(JSON.parse(store.get('qr-generator:draft:sms')!)).toEqual({ number: '+1', message: 'hi' })
    expect(store.has('qr-generator:draft:text')).toBe(false)
  })

  it('keeps the Wi-Fi password out of localStorage and caches it in memory', () => {
    const input: ShareConfigInput = {
      ...baseInput,
      mode: 'wifi',
      content: { ssid: 'Cafe', password: 'hunter2', security: 'WPA', hidden: false },
    }
    hydrateShareConfig(storage, `#c=${encodeShareConfig(input)}`)
    const raw = store.get('qr-generator:draft:wifi')!
    expect(JSON.parse(raw)).toEqual({ ssid: 'Cafe', password: '', security: 'WPA', hidden: false })
    expect(raw).not.toContain('hunter2')
    expect(getHydratedSecrets()?.wifiPassword).toBe('hunter2')
  })

  it('keeps geo coordinates out of localStorage and caches them in memory', () => {
    const input: ShareConfigInput = {
      ...baseInput,
      mode: 'geo',
      content: { latitude: '16.8409', longitude: '96.1735' },
    }
    hydrateShareConfig(storage, `#c=${encodeShareConfig(input)}`)
    expect(JSON.parse(store.get('qr-generator:draft:geo')!)).toEqual({ latitude: '', longitude: '' })
    expect(getHydratedSecrets()).toEqual({ geoLatitude: '16.8409', geoLongitude: '96.1735' })
  })

  it('returns null and writes nothing for a broken token but still consumes the hash', () => {
    window.location.hash = '#c=garbage'
    const decoded = hydrateShareConfig(storage, '#c=garbage')
    expect(decoded).toBeNull()
    expect(store.size).toBe(0)
  })
})
