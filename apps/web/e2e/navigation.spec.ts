import { test, expect } from '@playwright/test'

// ── Tab navigation ──────────────────────────────────────────────────────────

test('Navigation: switching tabs shows the right view', async ({ page }) => {
  await page.goto('/')

  // Batch tab
  await page.getByRole('button', { name: 'Batch' }).click()
  await expect(page.getByText('Generate in bulk')).toBeVisible()

  // Scan tab
  await page.getByRole('button', { name: 'Scan' }).click()
  await expect(page.getByText('Scan a QR code')).toBeVisible()

  // Back to Generate — the QR form should be visible.
  await page.getByRole('button', { name: 'Generate' }).click()
  // The Generate view is always mounted (hidden class toggles), so the textbox is
  // always in the DOM; assert it is visible rather than just present.
  await expect(page.getByRole('textbox').first()).toBeVisible()
})

// ── Theme toggle ────────────────────────────────────────────────────────────

test('Theme toggle: switches between light and dark mode', async ({ page }) => {
  // Start in light mode (colorScheme is set per-project in playwright.config.ts;
  // this spec only runs assertions that are valid regardless of the starting theme).
  await page.goto('/')

  const html = page.locator('html')
  const isDarkInitially = await html.evaluate((el) => el.classList.contains('dark'))

  if (isDarkInitially) {
    // Currently dark — toggle to light.
    await page.getByRole('button', { name: /switch to light/i }).click()
    await expect(html).not.toHaveClass(/\bdark\b/)
    // Toggle back to dark.
    await page.getByRole('button', { name: /switch to dark/i }).click()
    await expect(html).toHaveClass(/\bdark\b/)
  } else {
    // Currently light — toggle to dark.
    await page.getByRole('button', { name: /switch to dark/i }).click()
    await expect(html).toHaveClass(/\bdark\b/)
    // Toggle back to light.
    await page.getByRole('button', { name: /switch to light/i }).click()
    await expect(html).not.toHaveClass(/\bdark\b/)
  }
})
