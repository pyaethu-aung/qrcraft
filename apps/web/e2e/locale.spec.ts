import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

const html = (page: Page) => page.locator('html')
// Scope to the navbar landmark: the select's accessible name is the localized
// toggle label (Language / Idioma), so a name-based selector would stop matching
// after the locale changes. The navbar holds exactly one combobox.
const languageSelect = (page: Page) => page.getByRole('navigation').getByRole('combobox')

// ── Locale switcher: English ↔ Spanish via the dropdown ─────────────────────

test('Locale: switches between English and Spanish via the dropdown', async ({ page }) => {
  await page.goto('/')

  // Default locale is English.
  await expect(page.getByRole('heading', { name: 'Sculpt standout QR codes' })).toBeVisible()
  await expect(html(page)).toHaveAttribute('lang', 'en')

  // Pick Spanish from the dropdown.
  await languageSelect(page).selectOption('es')
  await expect(html(page)).toHaveAttribute('lang', 'es')
  await expect(page.getByRole('heading', { name: 'Crea códigos QR que destacan' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Escanear' })).toBeVisible()

  // Switch back to English.
  await languageSelect(page).selectOption('en')
  await expect(html(page)).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('heading', { name: 'Sculpt standout QR codes' })).toBeVisible()
})

// ── Burmese is gone: the dropdown offers only English and Spanish ────────────

test('Locale: dropdown lists only English and Spanish', async ({ page }) => {
  await page.goto('/')

  const options = languageSelect(page).locator('option')
  await expect(options).toHaveText(['English', 'Español'])
})

// ── Spanish preference persists across a reload ─────────────────────────────

test('Locale: Spanish selection persists across reload', async ({ page }) => {
  await page.goto('/')

  await languageSelect(page).selectOption('es')
  await expect(html(page)).toHaveAttribute('lang', 'es')

  await page.reload()

  await expect(html(page)).toHaveAttribute('lang', 'es')
  await expect(page.getByRole('heading', { name: 'Crea códigos QR que destacan' })).toBeVisible()
})
