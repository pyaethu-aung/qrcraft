/**
 * Derives a safe, human-readable, collision-free filename for one QR in a batch.
 *
 * The name is `NNN-<slug>.<ext>`: a 1-based, zero-padded ordinal (so files sort in the
 * order they were pasted and stay unique even when two slugs collide) followed by a
 * short slug derived from the value. A `used` set guards against the rare case where
 * two entries still produce the same name.
 *
 * When `nameOverride` is supplied (a mapped CSV filename column), its slug names the
 * file directly — no ordinal prefix, since the user picked that column expecting clean
 * id-style names (e.g. `truck-12.png`). The `used` set still appends `-2`, `-3`… on
 * collision. A blank or all-symbol override falls back to the ordinal+value name.
 */

const MAX_SLUG_LENGTH = 40

/**
 * Reduces an arbitrary QR value to a lowercase, filesystem-safe slug: drops the URL
 * scheme and `www.`, replaces every run of non-alphanumeric characters with a single
 * hyphen, trims stray hyphens, and clamps the length. Falls back to `qr` when nothing
 * usable remains (e.g. a value of only symbols).
 */
export function slugifyValue(value: string): string {
  const withoutScheme = value
    .trim()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
    .replace(/^www\./i, '')

  const slug = withoutScheme
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, '')

  return slug || 'qr'
}

export function batchFilename(
  value: string,
  index: number,
  extension: string,
  used: Set<string>,
  nameOverride?: string,
): string {
  const ordinal = String(index + 1).padStart(3, '0')
  // Use the override only when it has usable characters; otherwise fall back so an
  // all-symbol cell does not collapse every file onto the "qr" slug.
  const overrideSlug =
    nameOverride && /[a-z0-9]/i.test(nameOverride) ? slugifyValue(nameOverride) : ''
  const base = overrideSlug || `${ordinal}-${slugifyValue(value)}`

  let candidate = `${base}.${extension}`
  let suffix = 2
  while (used.has(candidate)) {
    candidate = `${base}-${suffix}.${extension}`
    suffix += 1
  }
  used.add(candidate)
  return candidate
}
