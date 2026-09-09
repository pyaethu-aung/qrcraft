import { test, expect } from '@playwright/test'

// ── helpers ────────────────────────────────────────────────────────────────

/** Wait for the QR canvas to appear with the expected payload. */
async function expectQr(page: import('@playwright/test').Page, value: string) {
  const canvas = page.getByTestId('qr-code-canvas')
  await expect(canvas).toBeVisible({ timeout: 5_000 })
  await expect(canvas).toHaveAttribute('data-value', value)
}

// ── URL / text QR ──────────────────────────────────────────────────────────

test('URL: typing a link renders a QR code', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox').first().fill('https://example.com')
  await expectQr(page, 'https://example.com')
})

// ── Wi-Fi QR ───────────────────────────────────────────────────────────────

test('Wi-Fi: SSID + password renders a Wi-Fi QR code', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Wi-Fi' }).click()
  await page.getByPlaceholder('Your Wi-Fi name').fill('OfficeNet')
  await page.getByPlaceholder('Network password').fill('s3cr3t!')

  // Wi-Fi QR payload starts with the MECARD-style prefix.
  const canvas = page.getByTestId('qr-code-canvas')
  await expect(canvas).toBeVisible({ timeout: 5_000 })
  await expect(canvas).toHaveAttribute('data-value', /^WIFI:/)
})

// ── Contact (vCard) QR ─────────────────────────────────────────────────────

test('Contact: first + last name renders a vCard QR code', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Contact' }).click()
  await page.getByLabel('First Name').fill('Jane')
  await page.getByLabel('Last Name').fill('Smith')

  const canvas = page.getByTestId('qr-code-canvas')
  await expect(canvas).toBeVisible({ timeout: 5_000 })
  await expect(canvas).toHaveAttribute('data-value', /^BEGIN:VCARD/)
})

test('Contact: invalid email is flagged and omitted from the vCard', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Contact' }).click()
  await page.getByLabel('First Name').fill('Jane')
  const email = page.getByLabel('Email')
  await email.fill('not-an-email')
  await email.blur()

  await expect(page.getByRole('alert')).toContainText(/valid email/i)

  const canvas = page.getByTestId('qr-code-canvas')
  await expect(canvas).toBeVisible({ timeout: 5_000 })
  await expect(canvas).not.toHaveAttribute('data-value', /EMAIL:/)
})

test('Contact: invalid phone number is flagged and omitted from the vCard', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Contact' }).click()
  await page.getByLabel('First Name').fill('Jane')
  const phone = page.getByLabel('Phone')
  await phone.fill('abc')
  await phone.blur()

  await expect(page.getByRole('alert')).toContainText(/phone number/i)

  const canvas = page.getByTestId('qr-code-canvas')
  await expect(canvas).toBeVisible({ timeout: 5_000 })
  await expect(canvas).not.toHaveAttribute('data-value', /TEL/)
})

test('Contact: fixing an invalid website clears the error and includes it in the vCard', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Contact' }).click()
  await page.getByLabel('First Name').fill('Jane')
  await page.getByRole('button', { name: /Professional details/i }).click()

  const website = page.getByLabel('Website')
  await website.fill('not a url')
  await website.blur()
  await expect(page.getByRole('alert')).toContainText(/valid website/i)

  await website.fill('https://example.com')
  await expect(page.getByRole('alert')).not.toBeVisible()

  const canvas = page.getByTestId('qr-code-canvas')
  await expect(canvas).toHaveAttribute('data-value', /URL:https:\/\/example\.com/)
})

// ── Location (geo) QR ───────────────────────────────────────────────────────

test('Location: invalid latitude is flagged only after the field is blurred', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Location' }).click()
  const latitude = page.getByLabel('Latitude')
  await latitude.fill('91')
  await expect(page.getByRole('alert')).not.toBeVisible()

  await latitude.blur()
  await expect(page.getByRole('alert')).toContainText(/between -90 and 90/i)

  await latitude.fill('45')
  await expect(page.getByRole('alert')).not.toBeVisible()
})

// ── Crypto QR ────────────────────────────────────────────────────────────────

test('Crypto: invalid address is flagged only after the field is blurred', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Crypto' }).click()
  const address = page.getByLabel('Wallet address')
  await address.fill('nonsense')
  await expect(page.getByRole('alert')).not.toBeVisible()

  await address.blur()
  await expect(page.getByRole('alert')).toContainText(/doesn't look like a Bitcoin address/i)

  await address.fill('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
  await expect(page.getByRole('alert')).not.toBeVisible()
})

// ── Event (vEvent) QR ────────────────────────────────────────────────────────

test('Event: end before start is flagged only once a date field has been left', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Event' }).click()
  const start = page.getByLabel('Starts')
  const end = page.getByLabel('Ends')

  // Fill the end date first — with no start yet, there's nothing to compare and no field
  // has been left, so the check hasn't armed.
  await end.fill('2026-07-01T18:00')
  await expect(page.getByRole('alert')).not.toBeVisible()

  // Filling start moves focus off End, which blurs it and arms the check.
  await start.fill('2026-07-01T19:00')
  await expect(page.getByRole('alert')).toContainText(/can't be before the start/i)

  await end.fill('2026-07-01T21:00')
  await expect(page.getByRole('alert')).not.toBeVisible()
})

// ── Download ───────────────────────────────────────────────────────────────

test('Download PNG: clicking Download PNG starts a file download', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox').first().fill('https://yomafleet.com')
  await expectQr(page, 'https://yomafleet.com')

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /download png/i }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/\.png$/)
})

test('Download SVG: clicking Download SVG starts a file download', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox').first().fill('https://yomafleet.com')
  await expectQr(page, 'https://yomafleet.com')

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /download svg/i }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/\.svg$/)
})

// ── Copy link ──────────────────────────────────────────────────────────────

test('Copy link: button shows success feedback after clicking', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox').first().fill('https://example.com')
  await expectQr(page, 'https://example.com')

  // Grant clipboard-write permission so navigator.clipboard.writeText succeeds.
  await page.context().grantPermissions(['clipboard-write'])

  await page.getByRole('button', { name: /copy link/i }).click()
  // The button label changes to "Link copied" on success.
  await expect(page.getByRole('button', { name: /copied/i })).toBeVisible({ timeout: 3_000 })
})
