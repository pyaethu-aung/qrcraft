import { test, expect } from '@playwright/test'

// ── Batch generation ────────────────────────────────────────────────────────

test('Batch: pasting URLs and clicking Generate ZIP downloads a ZIP', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Batch' }).click()
  await expect(page.getByText('Generate in bulk')).toBeVisible()

  const textarea = page.getByRole('textbox')
  await textarea.fill('https://example.com\nhttps://yomafleet.com\nhttps://anthropic.com')

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /generate zip/i }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/\.zip$/)
})

test('Batch: shows truncation warning when input exceeds the limit', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Batch' }).click()

  // BATCH_MAX_LINES is 200. Paste 201 unique URLs to trigger the warning.
  const lines = Array.from({ length: 201 }, (_, i) => `https://example.com/item-${i}`)
  await page.getByRole('textbox').fill(lines.join('\n'))

  await expect(page.getByRole('status')).toContainText(/limit|first/i)
})
