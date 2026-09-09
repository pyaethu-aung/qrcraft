import { test, expect } from '@playwright/test'

// The live capacity counter under the text content field. It counts the content
// against the QR byte-mode capacity for the active error-correction level
// (Medium/2331 by default, Highest/1273, Low/2953), and warns as it fills up.

test('counter reflects content length and tracks the EC level', async ({ page }) => {
  await page.goto('/')

  const count = page.getByTestId('capacity-count')
  await page.getByRole('textbox').first().fill('hello')

  // 5 bytes against the default Medium capacity.
  await expect(count).toHaveText('5 / 2331')

  // Lowering reliability shrinks the capacity; raising it shrinks it further.
  await page.getByRole('button', { name: /Highest/ }).click()
  await expect(count).toHaveText('5 / 1273')

  await page.getByRole('button', { name: /Low/ }).click()
  await expect(count).toHaveText('5 / 2953')
})

test('counter warns near the limit and flags going over', async ({ page }) => {
  await page.goto('/')

  const count = page.getByTestId('capacity-count')
  const warning = page.getByTestId('capacity-warning')
  const textbox = page.getByRole('textbox').first()

  // Highest reliability gives the smallest capacity (1273), easiest to fill.
  await page.getByRole('button', { name: /Highest/ }).click()

  // Comfortably under: no warning shown.
  await textbox.fill('a'.repeat(100))
  await expect(warning).toHaveCount(0)

  // Within the warning band but still encodable: amber "Approaching limit".
  await textbox.fill('a'.repeat(1200))
  await expect(warning).toHaveText('Approaching limit')
  await expect(count).toHaveText('1200 / 1273')

  // Past capacity: "Over capacity".
  await textbox.fill('a'.repeat(1300))
  await expect(warning).toHaveText('Over capacity')
  await expect(count).toHaveText('1300 / 1273')
})

// ── Non-text content types ───────────────────────────────────────────────────
// The counter appears below every non-text form. It counts the bytes of the
// raw typed field values (not the formatted QR payload), so it starts at 0,
// increments by 1 per character typed, and stays live even when required
// fields are still missing.

test('Wi-Fi mode: counter reflects raw typed field bytes', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Wi-Fi' }).click()

  const count = page.getByTestId('capacity-count')

  // Empty form → 0 bytes. Non-text modes default to Highest (1273).
  await expect(count).toHaveText('0 / 1273')

  // Filling SSID only (password still missing) shows 1 byte — counter is
  // live even before all required fields are filled.
  await page.getByPlaceholder('Your Wi-Fi name').fill('A')
  await expect(count).toHaveText('1 / 1273')

  // Adding a password adds its bytes to the count.
  await page.getByPlaceholder('Network password').fill('B')
  await expect(count).toHaveText('2 / 1273')
})

test('Wi-Fi mode: counter tracks the EC level', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Wi-Fi' }).click()
  await page.getByPlaceholder('Your Wi-Fi name').fill('A')
  await page.getByPlaceholder('Network password').fill('B')

  const count = page.getByTestId('capacity-count')
  await expect(count).toHaveText('2 / 1273')

  // Switching to Medium expands capacity; the raw byte count stays the same.
  await page.getByRole('button', { name: /Medium/ }).click()
  await expect(count).toHaveText('2 / 2331')
})

// The `WIFI:…;;` wrapper adds 18 bytes the typed fields don't show. When that
// pushes the payload over the limit, the counter must read a number that truly
// exceeds the max — not sit at "1273 / 1273" beside an "Over capacity" label.
test('Wi-Fi mode: over-capacity counter reports the true payload size', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Wi-Fi' }).click()

  const count = page.getByTestId('capacity-count')
  const warning = page.getByTestId('capacity-warning')

  // 1264 raw bytes is under the 1273 cap, but `WIFI:T:WPA;S:…;P:…;;` adds 18,
  // so the encoded payload is 1282 bytes — over the limit.
  await page.getByPlaceholder('Your Wi-Fi name').fill('A'.repeat(1260))
  await page.getByPlaceholder('Network password').fill('pass')

  await expect(warning).toHaveText('Over capacity')
  await expect(count).toHaveText('1282 / 1273')
  await expect(page.getByRole('button', { name: 'Download PNG' })).toBeDisabled()
})

test('Contact mode: counter reflects raw typed field bytes', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Contact' }).click()

  const count = page.getByTestId('capacity-count')

  // Empty form → 0 bytes. Non-text modes default to Highest (1273).
  await expect(count).toHaveText('0 / 1273')

  // First name alone is enough for a vCard, so the counter is live straight away.
  await page.getByRole('textbox', { name: 'First Name' }).fill('Jane')
  await expect(count).toHaveText('4 / 1273')

  // Each filled field adds its raw bytes to the count.
  await page.getByRole('textbox', { name: 'Last Name' }).fill('Smith')
  await expect(count).toHaveText('9 / 1273')
})

// The warning state tracks the formatted QR payload, not the raw field bytes.
// A vCard wraps every field in scaffolding (BEGIN:VCARD … END:VCARD, and the
// name appears in both FN and N), so the payload outruns the raw field bytes.
// Once that payload is too big to encode, the counter goes red — and it reports
// the payload's true size, never a number at or below the max next to an "Over
// capacity" label.
test('Contact mode: over-capacity counter reports the true payload size', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Contact' }).click()

  const count = page.getByTestId('capacity-count')
  const warning = page.getByTestId('capacity-warning')

  // 620 raw bytes is ~49% of the 1273 capacity, but the built vCard payload
  // (44 bytes of scaffolding + the name counted twice = 1284 bytes) is over it.
  await page.getByRole('textbox', { name: 'First Name' }).fill('A'.repeat(620))

  // The counter flags "Over capacity" and shows the payload's real byte count —
  // a number that genuinely exceeds the max, not the raw 620 sitting under it.
  await expect(warning).toHaveText('Over capacity')
  await expect(count).toHaveText('1284 / 1273')
  // Downloads disable in lock-step.
  await expect(page.getByRole('button', { name: 'Download PNG' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Download SVG' })).toBeDisabled()
})

// The mirror case: a phone number is normalized to `+`/digits before encoding, so
// formatting characters (spaces, hyphens) inflate the raw field count but never the
// payload. The verdict must follow the payload — the counter must NOT cry "Over
// capacity" while the QR still generates fine and downloads stay enabled.
test('Phone mode: a heavily formatted number does not trigger a false over-capacity', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Phone' }).click()

  const count = page.getByTestId('capacity-count')

  // 1400 raw characters (700 digits + 700 hyphens), but the payload is `tel:` + the
  // 700 stripped digits = 704 bytes, comfortably under the 1273 cap.
  await page.getByRole('textbox').first().fill('1-'.repeat(700))

  await expect(count).toHaveText('1400 / 1273')
  // No warning, and the download stays enabled because the payload encodes fine.
  await expect(page.getByTestId('capacity-warning')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Download PNG' })).toBeEnabled()
})
