import { test, expect } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const QR_FIXTURE = fileURLToPath(new URL('./fixtures/scan-history-url.png', import.meta.url))

// Decoding a real QR image (not a camera) is the deterministic way to exercise scan history
// end-to-end: upload the fixture, confirm the result, then assert it was remembered.
async function scanFixture(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Scan' }).click()
  await expect(page.getByText('Scan a QR code')).toBeVisible()
  await page.locator('input[type="file"]').setInputFiles(QR_FIXTURE)
  await expect(
    page.getByRole('region', { name: /scan result/i }).getByText('https://history.example'),
  ).toBeVisible()
}

test('Scan history: a decoded scan is remembered and can be restored', async ({ page }) => {
  await scanFixture(page)

  // The decoded value now appears under "Recently scanned".
  await expect(page.getByText('Recently scanned')).toBeVisible()
  const entry = page.getByRole('button', { name: /Link: https:\/\/history\.example/i })
  await expect(entry).toBeVisible()

  // Move past the result, then restore it from history.
  await page.getByRole('button', { name: /scan another/i }).click()
  await expect(page.getByRole('region', { name: /scan result/i })).toBeHidden()

  await entry.click()
  await expect(
    page.getByRole('region', { name: /scan result/i }).getByText('https://history.example'),
  ).toBeVisible()
})

test('Scan history: removing one entry forgets just that scan', async ({ page }) => {
  await scanFixture(page)
  await expect(page.getByText('Recently scanned')).toBeVisible()

  // Delete the single remembered scan via its per-entry remove button.
  await page
    .getByRole('button', { name: /Remove from scan history: https:\/\/history\.example/i })
    .click()

  // With nothing left, the whole section disappears.
  await expect(page.getByText('Recently scanned')).toBeHidden()
})

test('Scan history: clearing removes the remembered scans', async ({ page }) => {
  await scanFixture(page)
  await expect(page.getByText('Recently scanned')).toBeVisible()

  await page.getByRole('button', { name: /clear scan history/i }).click()
  await expect(page.getByText('Recently scanned')).toBeHidden()
})

test('Scan history: persists across a reload', async ({ page }) => {
  await scanFixture(page)
  await expect(page.getByText('Recently scanned')).toBeVisible()

  await page.reload()
  await page.getByRole('button', { name: 'Scan' }).click()
  await expect(page.getByText('Recently scanned')).toBeVisible()
  await expect(page.getByRole('button', { name: /Link: https:\/\/history\.example/i })).toBeVisible()
})
