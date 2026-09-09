import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isSharePayload, isMobileDevice, supportsNavigatorShare, supportsClipboardImage, payloadToFile } from '../share'

describe('share utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  describe('isSharePayload', () => {
    it('returns true for valid payload', () => {
      const payload = { blob: new Blob(['test']), filename: 'qr-code.png' as const }
      expect(isSharePayload(payload)).toBe(true)
    })

    it('returns false for invalid values', () => {
      expect(isSharePayload(null)).toBe(false)
      expect(isSharePayload({})).toBe(false)
      expect(isSharePayload({ blob: 'not a blob' })).toBe(false)
    })
  })

  describe('isMobileDevice', () => {
    it('detects mobile devices from user agent', () => {
      const originalUserAgent = navigator.userAgent
      
      const mockUA = (ua: string) => {
        Object.defineProperty(navigator, 'userAgent', {
          value: ua,
          configurable: true
        })
      }

      mockUA('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1')
      expect(isMobileDevice()).toBe(true)

      mockUA('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36')
      expect(isMobileDevice()).toBe(false)

      mockUA(originalUserAgent)
    })
  })

  describe('supportsNavigatorShare', () => {
    it('checks if navigator.share is available', () => {
      const originalShare = (navigator as Partial<Navigator>).share
      
      const mockedShare = vi.fn().mockImplementation(function(this: void) {
        return Promise.resolve()
      })
      navigator.share = mockedShare
      expect(supportsNavigatorShare()).toBe(true)

      delete (navigator as Partial<Navigator>).share
      expect(supportsNavigatorShare()).toBe(false)

      if (originalShare) {
        navigator.share = originalShare
      }
    })
  })

  describe('supportsClipboardImage', () => {
    it('checks if clipboard image sharing is supported', () => {
      const originalClipboard = navigator.clipboard
      const originalClipboardItem = global.ClipboardItem

      Object.defineProperty(navigator, 'clipboard', {
        value: { write: vi.fn() },
        configurable: true
      })
      // @ts-expect-error - ClipboardItem might not be in the global type
      global.ClipboardItem = vi.fn()

      expect(supportsClipboardImage()).toBe(true)

      Object.defineProperty(navigator, 'clipboard', { 
        value: undefined, 
        configurable: true 
      })
      expect(supportsClipboardImage()).toBe(false)

      Object.defineProperty(navigator, 'clipboard', { value: originalClipboard, configurable: true })
      global.ClipboardItem = originalClipboardItem
    })
  })

  describe('payloadToFile', () => {
    it('converts payload to File object', () => {
      const blob = new Blob(['test data'], { type: 'image/png' })
      const payload = { blob, filename: 'qr-code.png' as const, lastUpdated: new Date() }
      
      const file = payloadToFile(payload)
      expect(file).toBeInstanceOf(File)
      expect(file.name).toBe('qr-code.png')
      expect(file.type).toBe('image/png')
    })
  })
})
