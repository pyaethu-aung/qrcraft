import { test, expect } from '@playwright/test'

test('Location: "Use my location" fills coordinates from the Geolocation API', async ({ page, context }) => {
  await context.grantPermissions(['geolocation'])
  await context.setGeolocation({ latitude: 37.7749, longitude: -122.4194 })

  await page.goto('/')
  await page.getByRole('button', { name: 'Location' }).click()
  await page.getByRole('button', { name: /use my location/i }).click()

  await expect(page.getByLabel('Latitude')).toHaveValue('37.7749')
  await expect(page.getByLabel('Longitude')).toHaveValue('-122.4194')

  const canvas = page.getByTestId('qr-code-canvas')
  await expect(canvas).toBeVisible({ timeout: 5_000 })
  await expect(canvas).toHaveAttribute('data-value', /^geo:37\.7749,-122\.4194/)
})

test('Location: geolocation failure shows an error and leaves fields editable', async ({ page, context }) => {
  // No permission granted — the browser denies the request, so the app should show its
  // own error rather than hang or crash.
  await context.clearPermissions()

  await page.goto('/')
  await page.getByRole('button', { name: 'Location' }).click()
  await page.getByRole('button', { name: /use my location/i }).click()

  await expect(page.getByRole('alert')).toContainText(/couldn't get your location/i, { timeout: 5_000 })

  // Manual entry still works after a failed locate attempt.
  await page.getByLabel('Latitude').fill('10')
  await page.getByLabel('Longitude').fill('20')
  await expect(page.getByRole('alert')).toBeHidden()
})
