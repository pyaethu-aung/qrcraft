import { test, expect } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const LOGO_FIXTURE = fileURLToPath(new URL('./fixtures/logo.png', import.meta.url))

async function openLogoSection(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.getByRole('textbox').first().fill('https://example.com')
  await page.getByRole('button', { name: 'Logo' }).click()
}

test('Logo: uploading via the file picker shows the filename and a remove button', async ({ page }) => {
  await openLogoSection(page)

  await page.locator('input[type="file"]').setInputFiles(LOGO_FIXTURE)

  await expect(page.getByText('logo.png')).toBeVisible()
  await expect(page.getByRole('button', { name: /remove logo/i })).toBeVisible()
})

test('Logo: dropping an image file onto the dropzone uploads it', async ({ page }) => {
  await openLogoSection(page)

  const dropzone = page.getByRole('button', { name: /upload logo image/i }).first()
  const dataTransfer = await page.evaluateHandle(() => {
    const dt = new DataTransfer()
    const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
    const file = new File([bytes], 'dropped-logo.png', { type: 'image/png' })
    dt.items.add(file)
    return dt
  })

  await dropzone.dispatchEvent('drop', { dataTransfer })

  await expect(page.getByText('dropped-logo.png')).toBeVisible()
})

test('Logo: removing an uploaded logo restores the dropzone', async ({ page }) => {
  await openLogoSection(page)

  await page.locator('input[type="file"]').setInputFiles(LOGO_FIXTURE)
  await expect(page.getByRole('button', { name: /remove logo/i })).toBeVisible()

  await page.getByRole('button', { name: /remove logo/i }).click()

  await expect(page.getByRole('button', { name: /remove logo/i })).toBeHidden()
  await expect(page.getByRole('button', { name: /upload logo image/i }).first()).toBeVisible()
})
