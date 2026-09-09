import type { EmailConfig } from '../types/qr'

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function buildEmailString(config: EmailConfig): string {
  const to = config.to.trim()
  if (!to || !EMAIL_REGEX.test(to)) return ''

  const params: string[] = []
  if (config.subject.trim()) params.push(`subject=${encodeURIComponent(config.subject.trim())}`)
  if (config.body.trim()) params.push(`body=${encodeURIComponent(config.body.trim())}`)

  return params.length ? `mailto:${to}?${params.join('&')}` : `mailto:${to}`
}
