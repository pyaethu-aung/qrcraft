import { test, expect } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const QR_FIXTURE = fileURLToPath(new URL('./fixtures/scan-history-url.png', import.meta.url))

test('Scanner: dropping a QR image onto the dropzone decodes it', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Scan' }).click()
  await expect(page.getByText('Scan a QR code')).toBeVisible()

  const buffer = fs.readFileSync(QR_FIXTURE)
  const dropzone = page.getByRole('button', { name: /drop an image here/i })
  const dataTransfer = await page.evaluateHandle((base64) => {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const file = new File([bytes], 'scan-fixture.png', { type: 'image/png' })
    const dt = new DataTransfer()
    dt.items.add(file)
    return dt
  }, buffer.toString('base64'))

  await dropzone.dispatchEvent('drop', { dataTransfer })

  await expect(
    page.getByRole('region', { name: /scan result/i }).getByText('https://history.example'),
  ).toBeVisible()
})

test('Scanner: an unreadable image shows a decode error', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Scan' }).click()

  await page.locator('input[type="file"]').setInputFiles({
    name: 'not-a-qr.png',
    mimeType: 'image/png',
    // A structurally valid but content-less 1x1 PNG — decodes as an image, but has no QR code in it.
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    ),
  })

  await expect(page.getByText(/couldn't read that image|no qr code found/i)).toBeVisible()
})

test('Scanner: decoded result offers copy, open link, and edit-in-generator', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Scan' }).click()
  await page.locator('input[type="file"]').setInputFiles(QR_FIXTURE)
  await expect(
    page.getByRole('region', { name: /scan result/i }).getByText('https://history.example'),
  ).toBeVisible()

  // Copy
  await page.context().grantPermissions(['clipboard-write'])
  await page.getByRole('button', { name: /^copy$/i }).click()
  await expect(page.getByRole('button', { name: /copied/i })).toBeVisible({ timeout: 3_000 })

  // Open link points at the decoded URL
  await expect(page.getByRole('link', { name: /open link/i })).toHaveAttribute(
    'href',
    'https://history.example',
  )

  // Edit in generator switches to the Generate tab with the decoded value loaded
  await page.getByRole('button', { name: /edit in generator/i }).click()
  await expect(page.getByRole('textbox').first()).toHaveValue('https://history.example')
})
