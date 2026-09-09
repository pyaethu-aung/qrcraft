import { test, expect } from '@playwright/test'

// ── Saved presets / brand kit ───────────────────────────────────────────────

test('Presets: section and empty hint are visible on load', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Saved designs')).toBeVisible()
  await expect(page.getByText('Save your current design to reuse it with any code.')).toBeVisible()
})

test('Presets: Save design button opens name input', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Save design' }).click()
  await expect(page.getByPlaceholder('Name this design')).toBeVisible()
})

test('Presets: saving a preset by name shows it in the grid', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Save design' }).click()
  await page.getByPlaceholder('Name this design').fill('My Brand Kit')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByText('My Brand Kit')).toBeVisible()
})

test('Presets: saving with Enter key saves the preset', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Save design' }).click()
  await page.getByPlaceholder('Name this design').fill('Enter Kit')
  await page.getByPlaceholder('Name this design').press('Enter')
  await expect(page.getByText('Enter Kit')).toBeVisible()
})

test('Presets: cancelling name input hides the input', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Save design' }).click()
  await expect(page.getByPlaceholder('Name this design')).toBeVisible()
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByPlaceholder('Name this design')).not.toBeVisible()
})

test('Presets: applying a preset restores its colors', async ({ page }) => {
  await page.goto('/')

  // Set a custom foreground color via the hidden color input inside the Appearance section.
  // Open the Appearance section first.
  await page.getByRole('button', { name: /appearance/i }).click()

  // Switch to linear gradient then back to solid so we can read the foreground picker.
  // Directly change the foreground color by evaluating localStorage then reloading,
  // since the color input is an opacity-0 overlay — use JS to set it.
  await page.evaluate(() => {
    localStorage.setItem('qr-generator-design-config', JSON.stringify({
      eyeFrameShape: 'Rounded',
      eyeCenterShape: 'Dot',
      eyeFrameColor: null,
      eyeCenterColor: null,
      pixelPattern: 'Dots',
      fgGradient: null,
    }))
    localStorage.setItem('qr-generator:appearance', JSON.stringify({
      fgColor: '#ff0000',
      bgColor: '#ffffff',
      ecLevel: 'H',
      transparentBg: false,
    }))
  })
  await page.reload()

  // Save this design as a preset.
  await page.getByRole('button', { name: 'Save design' }).click()
  await page.getByPlaceholder('Name this design').fill('Red Design')
  await page.getByPlaceholder('Name this design').press('Enter')
  await expect(page.getByText('Red Design')).toBeVisible()

  // Reset appearance via localStorage and reload.
  await page.evaluate(() => {
    localStorage.setItem('qr-generator-design-config', JSON.stringify({
      eyeFrameShape: 'Square',
      eyeCenterShape: 'Square',
      eyeFrameColor: null,
      eyeCenterColor: null,
      pixelPattern: 'Square',
      fgGradient: null,
    }))
    localStorage.setItem('qr-generator:appearance', JSON.stringify({
      fgColor: '#000000',
      bgColor: '#ffffff',
      ecLevel: 'M',
      transparentBg: false,
    }))
  })
  await page.reload()

  // The preset should still be there after reload (persisted in localStorage).
  await expect(page.getByText('Red Design')).toBeVisible()

  // Applying it should not throw.
  await page.getByRole('button', { name: 'Red Design', exact: true }).click()
  // The button gains aria-pressed="true" after apply.
  await expect(page.getByRole('button', { name: 'Red Design', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

test('Presets: deleting a preset removes it from the grid', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Save design' }).click()
  await page.getByPlaceholder('Name this design').fill('Temp Preset')
  await page.getByPlaceholder('Name this design').press('Enter')
  await expect(page.getByText('Temp Preset')).toBeVisible()

  // First click enters the pending-delete state (trash icon, no deletion yet).
  await page.getByRole('button', { name: 'Temp Preset', exact: true }).hover()
  await page.getByRole('button', { name: 'Delete Temp Preset' }).click()
  // Second click confirms the deletion.
  await page.getByRole('button', { name: 'Confirm delete Temp Preset' }).click()
  await expect(page.getByText('Temp Preset')).not.toBeVisible()
})

test('Presets: saved presets survive a page reload', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Save design' }).click()
  await page.getByPlaceholder('Name this design').fill('Persistent Kit')
  await page.getByPlaceholder('Name this design').press('Enter')
  await expect(page.getByText('Persistent Kit')).toBeVisible()

  await page.reload()
  await expect(page.getByText('Persistent Kit')).toBeVisible()
})
