import { DEFAULT_QR_DESIGN_CONFIG } from '@/constants/qrDefaults';
import {
  addSavedCode,
  addScanHistoryEntry,
  clearAllData,
  clearScanHistory,
  getSavedCodes,
  getScanHistory,
  getSettings,
  removeSavedCode,
  setSettings,
} from '@/utils/storage';

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
    const saved = addSavedCode({
      value: 'https://example.com',
      contentMode: 'text',
      ecLevel: 'M',
      fgColor: '#1A1612',
      bgColor: '#FAF6F1',
      design: DEFAULT_QR_DESIGN_CONFIG,
    });

    expect(getSavedCodes()).toHaveLength(1);
    expect(getSavedCodes()[0].value).toBe('https://example.com');

    removeSavedCode(saved.id);
    expect(getSavedCodes()).toHaveLength(0);
  });

  it('records scan history newest-first and caps at 50', () => {
    addScanHistoryEntry('first');
    addScanHistoryEntry('second');

    const history = getScanHistory();
    expect(history[0].value).toBe('second');
    expect(history[1].value).toBe('first');
  });

  it('clears scan history independently of saved codes', () => {
    addSavedCode({
      value: 'a',
      contentMode: 'text',
      ecLevel: 'M',
      fgColor: '#1A1612',
      bgColor: '#FAF6F1',
      design: DEFAULT_QR_DESIGN_CONFIG,
    });
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
