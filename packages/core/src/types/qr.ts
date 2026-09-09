export type QRErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'

export type QRContentMode = 'text' | 'wifi' | 'vcard' | 'email' | 'sms' | 'tel' | 'geo' | 'vevent' | 'crypto'

/** Supported cryptocurrency networks. Bitcoin uses BIP-21, Ethereum uses EIP-681. */
export type CryptoNetwork = 'bitcoin' | 'ethereum'

export interface CryptoConfig {
  network: CryptoNetwork
  /** Wallet address. Validated per-network at the edges. */
  address: string
  /** Optional amount, as a decimal in the network's main unit (BTC / ETH). */
  amount: string
  /** Optional human label (BIP-21 `label`); Bitcoin only. */
  label: string
}

export interface EmailConfig {
  to: string
  subject: string
  body: string
}

export interface SmsConfig {
  number: string
  message: string
}

export interface TelConfig {
  number: string
}

export interface GeoConfig {
  /** Decimal-degree latitude as the user typed it (validated/parsed at the edges). */
  latitude: string
  /** Decimal-degree longitude as the user typed it (validated/parsed at the edges). */
  longitude: string
}

export interface VEventConfig {
  /** Event title (iCalendar SUMMARY). Required for a non-empty payload. */
  summary: string
  /** Native input value: `YYYY-MM-DDTHH:mm`, or `YYYY-MM-DD` when allDay. */
  start: string
  /** Same format as `start`. Empty means "no explicit end". */
  end: string
  allDay: boolean
  location: string
  description: string
}

export type WiFiSecurity = 'WPA' | 'WEP' | 'nopass'

export interface WiFiConfig {
  ssid: string
  password: string
  security: WiFiSecurity
  hidden: boolean
}

export interface VCardConfig {
  firstName: string
  lastName: string
  phone: string
  email: string
  company: string
  jobTitle: string
  website: string
}

export interface QRConfig {
  value: string
  ecLevel: QRErrorCorrectionLevel
  fgColor: string
  bgColor: string
  size?: number
}

export interface SharePayload {
  blob: Blob
  filename: 'qr-code.png'
  lastUpdated: Date
}

export type ShareMethod = 'navigator-share' | 'download' | 'clipboard'

export interface ShareRequest {
  method: ShareMethod
  targetSupported: boolean
  status: 'pending' | 'shared' | 'canceled' | 'failed'
  errorMessage?: string
}

/** @deprecated Superseded by QREyeFrameShape + QREyeCenterShape. Kept only for localStorage migration. */
export type QREyeShape = 'Square' | 'Rounded' | 'Diamond' | 'Leaf' | 'Hexagon'

export type QREyeFrameShape = 'Square' | 'Rounded' | 'Circle' | 'Leaf' | 'Hexagon' | 'SquareRound' | 'RoundSquare' | 'Diamond'
export type QREyeCenterShape = 'Square' | 'Rounded' | 'Dot' | 'Diamond' | 'Star' | 'Cross'
export type QRPixelPattern = 'Square' | 'Dots' | 'Rounded' | 'Diamond' | 'Vertical' | 'Classy' | 'Fluid' | 'Horizontal'

export type QRGradientType = 'linear' | 'radial'

/** The eight preset gradient directions, named for the edge/corner the gradient flows toward. */
export type QRGradientDirection = 'to-t' | 'to-tr' | 'to-r' | 'to-br' | 'to-b' | 'to-bl' | 'to-l' | 'to-tl'

/**
 * A two-stop foreground gradient. When set on {@link QRDesignConfig.fgGradient} it
 * replaces the solid foreground across the data modules and any eye part that inherits
 * the foreground (its own color is null). `direction` is ignored for radial gradients.
 */
export interface QRGradient {
  type: QRGradientType
  /** Start color (offset 0), hex. */
  from: string
  /** End color (offset 1), hex. */
  to: string
  direction: QRGradientDirection
}

export interface QRDesignConfig {
  eyeFrameShape: QREyeFrameShape
  eyeCenterShape: QREyeCenterShape
  /** null = inherit the foreground color */
  eyeFrameColor: string | null
  /** null = inherit the foreground color */
  eyeCenterColor: string | null
  pixelPattern: QRPixelPattern
  /**
   * Solid foreground (fgColor) when absent or null; otherwise the foreground fills with
   * this gradient. Optional so existing config literals and persisted/shared payloads
   * predating gradients remain valid.
   */
  fgGradient?: QRGradient | null
}

/**
 * Decorative frame wrapped around the QR with a call-to-action caption. All frames
 * are drawn from code (SVG primitives), never from licensed/raster artwork. `None`
 * is the default and renders the bare QR exactly as before.
 */
export type QRFrameStyle = 'None' | 'Banner' | 'Card' | 'Ticket' | 'Label' | 'Bubble' | 'Ticks' | 'Photo' | 'Circle'

/** Which edge the caption sits on, for caption-bearing frames. */
export type QRFramePosition = 'top' | 'bottom'

export interface QRFrameConfig {
  style: QRFrameStyle
  /** Caption text, e.g. "SCAN ME". Empty renders the frame without a label. */
  text: string
  /** Frame accent color (band / border / brackets). */
  color: string
  position: QRFramePosition
}
