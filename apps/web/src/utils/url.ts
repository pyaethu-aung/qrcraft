// Loose website shape: optional scheme, one or more dot-separated labels ending in an
// alphabetic TLD, optional port/path/query/fragment. Deliberately permissive, mirroring
// EMAIL_REGEX/PHONE_REGEX — the goal is to reject obvious garbage, not enforce RFC 3986.
export const URL_REGEX = /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(:\d+)?([/?#]\S*)?$/i

export function isValidUrl(raw: string): boolean {
  return URL_REGEX.test(raw.trim())
}
