import type { VCardConfig } from '../types/qr'
import { EMAIL_REGEX } from './email'
import { PHONE_REGEX } from './phone'
import { URL_REGEX } from './url'

function escapeVCardField(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n')
}

export function buildVCardString(config: VCardConfig): string {
  const { firstName, lastName, phone, email, company, jobTitle, website } = config

  const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
  if (!fullName) return ''

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeVCardField(fullName)}`,
    `N:${escapeVCardField(lastName.trim())};${escapeVCardField(firstName.trim())};;;`,
  ]

  if (PHONE_REGEX.test(phone.trim())) lines.push(`TEL;TYPE=CELL:${phone.trim()}`)
  if (EMAIL_REGEX.test(email.trim())) lines.push(`EMAIL:${escapeVCardField(email.trim())}`)
  if (company.trim()) lines.push(`ORG:${escapeVCardField(company.trim())}`)
  if (jobTitle.trim()) lines.push(`TITLE:${escapeVCardField(jobTitle.trim())}`)
  if (URL_REGEX.test(website.trim())) lines.push(`URL:${website.trim()}`)

  lines.push('END:VCARD')

  return lines.join('\n')
}
