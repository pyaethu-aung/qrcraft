import { DEFAULT_QR_DESIGN_CONFIG } from '@/constants/qrDefaults';
import {
  addSavedCode,
  addScanHistoryEntry,
  clearAllData,
  clearScanHistory,
  getSavedCodes,
  getScanHistory,
  getSettings,
  MAX_SAVED_CODES,
  removeSavedCode,
  setSettings,
} from '@/utils/storage';

const A_SAVED_CODE = {
  value: 'https://example.com',
  contentMode: 'text' as const,
  ecLevel: 'M' as const,
  fgColor: '#1A1612',
  bgColor: '#FAF6F1',
  design: DEFAULT_QR_DESIGN_CONFIG,
};

describe('storage', () => {
  beforeEach(() => {
    clearAllData();
  });

  it('starts empty', () => {
    expect(getSavedCodes()).toEqual([]);
    expect(getScanHistory()).toEqual([]);
    expect(getSettings().themeOverride).toBe('system');
  });

  it('adds and removes a saved code', () => {
    const result = addSavedCode(A_SAVED_CODE);
    expect(result).not.toBeNull();

    expect(getSavedCodes()).toHaveLength(1);
    expect(getSavedCodes()[0].value).toBe('https://example.com');
    expect(result!.all).toEqual(getSavedCodes());

    const remaining = removeSavedCode(result!.entry.id);
    expect(remaining).toEqual([]);
    expect(getSavedCodes()).toHaveLength(0);
  });

  it('refuses to add past MAX_SAVED_CODES', () => {
    for (let i = 0; i < MAX_SAVED_CODES; i++) {
      expect(addSavedCode(A_SAVED_CODE)).not.toBeNull();
    }
    expect(getSavedCodes()).toHaveLength(MAX_SAVED_CODES);

    expect(addSavedCode(A_SAVED_CODE)).toBeNull();
    expect(getSavedCodes()).toHaveLength(MAX_SAVED_CODES);
  });

  it('records scan history newest-first and caps at 50', () => {
    addScanHistoryEntry('first');
    addScanHistoryEntry('second');

    const history = getScanHistory();
    expect(history[0].value).toBe('second');
    expect(history[1].value).toBe('first');
  });

  it('clears scan history independently of saved codes', () => {
    addSavedCode(A_SAVED_CODE);
    addScanHistoryEntry('b');

    clearScanHistory();

    expect(getScanHistory()).toEqual([]);
    expect(getSavedCodes()).toHaveLength(1);
  });

  it('persists a settings patch', () => {
    setSettings({ themeOverride: 'dark' });
    expect(getSettings().themeOverride).toBe('dark');
  });
});
