import { z } from 'zod'
import {
  buildWifiString,
  buildVCardString,
  buildEmailString,
  buildSmsString,
  buildTelString,
  buildGeoString,
  buildVEventString,
  buildCryptoString,
} from '@qrcraft/core'
import { renderQr, CapacityExceededError } from '../render.js'

const appearanceSchema = {
  ecLevel: z.enum(['L', 'M', 'Q', 'H']).default('M'),
  format: z.enum(['png', 'svg']).default('png'),
  size: z.number().int().min(64).max(2048).default(512),
  margin: z.number().int().min(0).max(20).default(4),
  dark: z.string().default('#000000'),
  light: z.string().default('#ffffff'),
}

const payloadSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('wifi'),
    ssid: z.string(),
    password: z.string().default(''),
    security: z.enum(['WPA', 'WEP', 'nopass']).default('WPA'),
    hidden: z.boolean().default(false),
  }),
  z.object({
    type: z.literal('vcard'),
    firstName: z.string().default(''),
    lastName: z.string().default(''),
    phone: z.string().default(''),
    email: z.string().default(''),
    company: z.string().default(''),
    jobTitle: z.string().default(''),
    website: z.string().default(''),
  }),
  z.object({
    type: z.literal('email'),
    to: z.string(),
    subject: z.string().default(''),
    body: z.string().default(''),
  }),
  z.object({
    type: z.literal('sms'),
    number: z.string(),
    message: z.string().default(''),
  }),
  z.object({
    type: z.literal('tel'),
    number: z.string(),
  }),
  z.object({
    type: z.literal('geo'),
    latitude: z.string(),
    longitude: z.string(),
  }),
  z.object({
    type: z.literal('vevent'),
    summary: z.string(),
    start: z.string(),
    end: z.string().default(''),
    allDay: z.boolean().default(false),
    location: z.string().default(''),
    description: z.string().default(''),
  }),
  z.object({
    type: z.literal('crypto'),
    network: z.enum(['bitcoin', 'ethereum']),
    address: z.string(),
    amount: z.string().default(''),
    label: z.string().default(''),
  }),
])

export const generateStructuredQrInputSchema = {
  payload: payloadSchema,
  ...appearanceSchema,
}

export type StructuredPayload = z.infer<typeof payloadSchema>

export interface GenerateStructuredQrInput {
  payload: StructuredPayload
  ecLevel: 'L' | 'M' | 'Q' | 'H'
  format: 'png' | 'svg'
  size: number
  margin: number
  dark: string
  light: string
}

function buildPayloadString(payload: StructuredPayload): string {
  switch (payload.type) {
    case 'wifi':
      return buildWifiString(payload)
    case 'vcard':
      return buildVCardString(payload)
    case 'email':
      return buildEmailString(payload)
    case 'sms':
      return buildSmsString(payload)
    case 'tel':
      return buildTelString(payload)
    case 'geo':
      return buildGeoString(payload)
    case 'vevent':
      return buildVEventString(payload)
    case 'crypto':
      return buildCryptoString(payload)
  }
}

export async function handleGenerateStructuredQr(input: GenerateStructuredQrInput) {
  const content = buildPayloadString(input.payload)
  if (!content) {
    return {
      content: [
        { type: 'text' as const, text: `${input.payload.type}: missing a required field for this content type` },
      ],
      isError: true,
    }
  }

  try {
    const result = await renderQr(content, input)
    if ('svg' in result) {
      return { content: [{ type: 'text' as const, text: result.svg }] }
    }
    return {
      content: [{ type: 'image' as const, data: result.png.toString('base64'), mimeType: 'image/png' }],
    }
  } catch (error) {
    if (error instanceof CapacityExceededError) {
      return { content: [{ type: 'text' as const, text: error.message }], isError: true }
    }
    throw error
  }
}
