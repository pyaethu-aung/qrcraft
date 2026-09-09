import { test, expect } from '@playwright/test'

// Successful-generation coverage for the content modes generate.spec.ts only exercises
// via their validation-error paths (SMS/Tel aren't touched there at all).

test('SMS: number + message renders an SMS QR code', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'SMS' }).click()
  await page.getByRole('textbox', { name: 'Phone number' }).fill('+1 234 567 8900')
  await page.getByRole('button', { name: 'Message' }).click()
  await page.getByPlaceholder('Message text (optional)').fill('Hello there')

  const canvas = page.getByTestId('qr-code-canvas')
  await expect(canvas).toBeVisible({ timeout: 5_000 })
  await expect(canvas).toHaveAttribute('data-value', /^SMSTO:/)
})

test('Phone: a number renders a tel QR code', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Phone' }).click()
  await page.getByRole('textbox', { name: 'Phone number' }).fill('+1 234 567 8900')

  const canvas = page.getByTestId('qr-code-canvas')
  await expect(canvas).toBeVisible({ timeout: 5_000 })
  await expect(canvas).toHaveAttribute('data-value', /^tel:/)
})

test('Location: valid coordinates render a geo QR code', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Location' }).click()
  await page.getByLabel('Latitude').fill('37.7749')
  await page.getByLabel('Longitude').fill('-122.4194')

  const canvas = page.getByTestId('qr-code-canvas')
  await expect(canvas).toBeVisible({ timeout: 5_000 })
  await expect(canvas).toHaveAttribute('data-value', /^geo:37\.7749,-122\.4194/)
})

test('Event: a summary and start time render a vEvent QR code', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Event' }).click()
  await page.getByLabel('Event title').fill('Launch party')
  await page.getByLabel('Starts').fill('2026-08-01T18:00')

  const canvas = page.getByTestId('qr-code-canvas')
  await expect(canvas).toBeVisible({ timeout: 5_000 })
  await expect(canvas).toHaveAttribute('data-value', /^BEGIN:VCALENDAR/)
})

test('Crypto: a valid Bitcoin address renders a crypto QR code', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Crypto' }).click()
  await page.getByLabel('Wallet address').fill('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')

  const canvas = page.getByTestId('qr-code-canvas')
  await expect(canvas).toBeVisible({ timeout: 5_000 })
  await expect(canvas).toHaveAttribute('data-value', /^bitcoin:/)
})
