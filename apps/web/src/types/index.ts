export interface QRConfig {
  value: string
  level: 'L' | 'M' | 'Q' | 'H'
  size: number
  bgColor: string
  fgColor: string
}

export interface ValidationResult {
  isURL: boolean
  isValidText: boolean
  warning?: string
}
