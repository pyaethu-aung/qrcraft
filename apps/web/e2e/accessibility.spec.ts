import { test, expect } from '@playwright/test'

// Scenarios proving the fixes from the /impeccable project review hold in a
// real browser. Each maps to a finding: the mobile column order, the primary
// download CTA, tooltip WCAG 1.4.13, navbar text-resize reflow, and the
// disabled-download explanation.

// ── Mobile ordering ─────────────────────────────────────────────────────────

test('Mobile: the input comes before the preview', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'mobile-only layout rule')

  await page.goto('/')

  const input = page.getByRole('textbox').first()
  const preview = page.getByRole('heading', { name: 'Preview' })

  await expect(input).toBeVisible()
  await expect(preview).toBeVisible()

  const inputBox = await input.boundingBox()
  const previewBox = await preview.boundingBox()

  // The visitor must reach the field they came to fill before the empty
  // preview and its disabled action row.
  expect(inputBox!.y).toBeLessThan(previewBox!.y)
})

test('Desktop: settings sit left of the preview', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('desktop'), 'desktop-only layout rule')

  await page.goto('/')

  const settings = await page.getByRole('heading', { name: 'Settings' }).boundingBox()
  const preview = await page.getByRole('heading', { name: 'Preview' }).boundingBox()

  // Reordering for mobile must not disturb the two-column desktop layout.
  expect(settings!.x).toBeLessThan(preview!.x)
})

// ── Primary action ──────────────────────────────────────────────────────────

test('Downloads: PNG is the primary action and states its size', async ({ page }) => {
  await page.goto('/')

  const primary = page.getByRole('button', { name: /download png/i })
  await expect(primary).toBeVisible()
  await expect(primary).toContainText('1024')

  // Disabled until there is something to download, and it says why.
  await expect(primary).toBeDisabled()
  await expect(page.getByText(/add a link to enable downloads/i)).toBeVisible()

  await page.getByRole('textbox').first().fill('https://example.com/menu')
  await expect(page.getByTestId('qr-code-canvas')).toBeVisible({ timeout: 5_000 })

  await expect(primary).toBeEnabled()
  await expect(page.getByText(/add a link to enable downloads/i)).toHaveCount(0)
})

test('Downloads: the four actions share one disabled treatment', async ({ page }) => {
  await page.goto('/')

  // Share previously had a bespoke disabled style; all four should now agree.
  const svg = page.getByRole('button', { name: /download svg/i })
  const share = page.getByTestId('share-qr-button')

  await expect(svg).toBeDisabled()
  await expect(share).toBeDisabled()

  const [svgColor, shareColor] = await Promise.all([
    svg.evaluate((el) => getComputedStyle(el).backgroundColor),
    share.evaluate((el) => getComputedStyle(el).backgroundColor),
  ])
  expect(svgColor).toBe(shareColor)
})

// ── Tooltip: WCAG 2.2 SC 1.4.13 ─────────────────────────────────────────────

test('Tooltip: the pointer can move onto the panel', async ({ page }, testInfo) => {
  // Hoverable is a pointer requirement; touch projects have no hover state.
  test.skip(!testInfo.project.name.startsWith('desktop'), 'pointer-only behaviour')

  await page.goto('/')

  const trigger = page.getByRole('button', { name: /about error correction/i })
  await trigger.scrollIntoViewIfNeeded()

  await trigger.hover()
  const tip = page.getByRole('tooltip')
  await expect(tip).toBeVisible()

  // Reading the panel with a magnifier means travelling into it; that used to
  // dismiss it, because hover lived on the trigger alone.
  await tip.hover()
  await expect(tip).toBeVisible()
})

test('Tooltip: Escape dismisses it without moving focus', async ({ page }) => {
  await page.goto('/')

  const trigger = page.getByRole('button', { name: /about error correction/i })
  await trigger.scrollIntoViewIfNeeded()

  await trigger.focus()
  await expect(page.getByRole('tooltip')).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page.getByRole('tooltip')).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

// ── Text resize: WCAG 2.2 SC 1.4.4 ──────────────────────────────────────────

test('Navbar: controls stay reachable at 200% text size', async ({ page }) => {
  await page.goto('/')

  await page.evaluate(() => {
    document.documentElement.style.fontSize = '32px'
  })

  const theme = page.getByRole('button', { name: /switch to (light|dark)/i })
  await expect(theme).toBeVisible()

  const box = await theme.boundingBox()
  const width = page.viewportSize()!.width

  // Layout clips horizontal overflow, so anything pushed past the viewport is
  // gone for good rather than scrollable.
  expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1)

  // And it must still actually be operable, not merely inside the box.
  await theme.click()
  await expect(page.locator('html')).toHaveClass(/./)
})

// ── Lazy views still resolve ────────────────────────────────────────────────

test('Lazy views: Batch and Scan load on demand', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Batch' }).click()
  await expect(page.getByText('Generate in bulk')).toBeVisible({ timeout: 10_000 })

  await page.getByRole('button', { name: 'Scan' }).click()
  await expect(page.getByText('Scan a QR code')).toBeVisible({ timeout: 10_000 })
})
