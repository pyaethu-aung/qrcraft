import type { QRContentMode, QRDesignConfig, QRErrorCorrectionLevel } from '@qrcraft/core';
import { createMMKV } from 'react-native-mmkv';

// Synchronous key-value storage (matches the web app's read-at-mount hook
// pattern — no async storage round-trip needed for small JSON blobs).
export const storage = createMMKV({ id: 'qrcraft-storage' });

const SAVED_CODES_KEY = 'saved-codes';
const SCAN_HISTORY_KEY = 'scan-history';
const SETTINGS_KEY = 'settings';

export interface SavedCode {
  id: string;
  value: string;
  contentMode: QRContentMode;
  ecLevel: QRErrorCorrectionLevel;
  fgColor: string;
  bgColor: string;
  design: QRDesignConfig;
  createdAt: number;
}

export interface ScanHistoryEntry {
  id: string;
  value: string;
  scannedAt: number;
}

export interface AppSettings {
  themeOverride: 'system' | 'light' | 'dark';
}

const DEFAULT_SETTINGS: AppSettings = { themeOverride: 'system' };

function readJson<T>(key: string, fallback: T): T {
  const raw = storage.getString(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  storage.set(key, JSON.stringify(value));
}

export const MAX_SAVED_CODES = 10;

export function getSavedCodes(): SavedCode[] {
  return readJson<SavedCode[]>(SAVED_CODES_KEY, []);
}

/** Returns the updated list along with the new entry, so callers that need
 * the fresh list (to update their own state) don't have to re-read and
 * re-parse what this just wrote. Returns `null` when already at the
 * MAX_SAVED_CODES cap — enforced here, not just in the UI's save gate, so
 * no future caller can bypass it. */
export function addSavedCode(code: Omit<SavedCode, 'id' | 'createdAt'>): { entry: SavedCode; all: SavedCode[] } | null {
  const existing = getSavedCodes();
  if (existing.length >= MAX_SAVED_CODES) return null;
  const entry: SavedCode = { ...code, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, createdAt: Date.now() };
  const all = [entry, ...existing];
  writeJson(SAVED_CODES_KEY, all);
  return { entry, all };
}

export function removeSavedCode(id: string): SavedCode[] {
  const all = getSavedCodes().filter((c) => c.id !== id);
  writeJson(SAVED_CODES_KEY, all);
  return all;
}

export function clearSavedCodes(): void {
  storage.remove(SAVED_CODES_KEY);
}

const MAX_SCAN_HISTORY = 50;

export function getScanHistory(): ScanHistoryEntry[] {
  return readJson<ScanHistoryEntry[]>(SCAN_HISTORY_KEY, []);
}

export function addScanHistoryEntry(value: string): ScanHistoryEntry {
  const entry: ScanHistoryEntry = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, value, scannedAt: Date.now() };
  const all = [entry, ...getScanHistory()].slice(0, MAX_SCAN_HISTORY);
  writeJson(SCAN_HISTORY_KEY, all);
  return entry;
}

export function clearScanHistory(): void {
  storage.remove(SCAN_HISTORY_KEY);
}

export function getSettings(): AppSettings {
  return readJson<AppSettings>(SETTINGS_KEY, DEFAULT_SETTINGS);
}

export function setSettings(patch: Partial<AppSettings>): AppSettings {
  const next = { ...getSettings(), ...patch };
  writeJson(SETTINGS_KEY, next);
  return next;
}

export function clearAllData(): void {
  clearSavedCodes();
  clearScanHistory();
  writeJson(SETTINGS_KEY, DEFAULT_SETTINGS);
}
