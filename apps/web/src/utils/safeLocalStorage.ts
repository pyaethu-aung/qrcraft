/**
 * localStorage is unavailable in private-browsing/quota-exceeded edge cases and its
 * contents are attacker/user-editable, so every read can throw or return malformed JSON.
 * These wrappers centralize the try/catch so call sites just supply a fallback.
 */

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function readRaw(key: string, fallback = ''): string {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore if localStorage is unavailable
  }
}

export function writeRaw(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Ignore if localStorage is unavailable
  }
}

export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // Ignore if localStorage is unavailable
  }
}
