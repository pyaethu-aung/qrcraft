import { act, renderHook } from '@testing-library/react-native';

import { QrContentProvider, useQrContent } from '@/hooks/qr-content-store';

function renderStore() {
  return renderHook(() => useQrContent(), { wrapper: QrContentProvider });
}

describe('useQrContent', () => {
  it('starts in text mode, empty and not usable', async () => {
    const { result } = await renderStore();

    expect(result.current.contentMode).toBe('text');
    expect(result.current.isUsable).toBe(false);
    expect(result.current.liveValue).toBe('');
  });

  it('promotes text input into liveValue after the debounce', async () => {
    jest.useFakeTimers();
    const { result } = await renderStore();

    await act(() => {
      result.current.setText('https://example.com');
    });
    expect(result.current.isUsable).toBe(true);
    expect(result.current.liveValue).toBe('');

    await act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current.liveValue).toBe('https://example.com');

    jest.useRealTimers();
  });

  it('builds a WIFI: payload once switched to wifi mode with a valid config', async () => {
    jest.useFakeTimers();
    const { result } = await renderStore();

    await act(() => {
      result.current.setContentMode('wifi');
      result.current.setWifi({ ssid: 'Yoma-Guest', password: 'secret123', security: 'WPA' });
    });
    expect(result.current.rawValue).toBe('WIFI:T:WPA;S:Yoma-Guest;P:secret123;;');

    await act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current.liveValue).toBe('WIFI:T:WPA;S:Yoma-Guest;P:secret123;;');

    jest.useRealTimers();
  });

  it('is not usable while a required structured field is missing', async () => {
    const { result } = await renderStore();

    await act(() => {
      result.current.setContentMode('tel');
      result.current.setTel({ number: '' });
    });

    expect(result.current.rawValue).toBe('');
    expect(result.current.isUsable).toBe(false);
  });

  it('keeps each content type\'s fields independent when switching modes', async () => {
    jest.useFakeTimers();
    const { result } = await renderStore();

    await act(() => {
      result.current.setContentMode('tel');
      result.current.setTel({ number: '+15551234567' });
      result.current.setContentMode('sms');
      result.current.setSms({ number: '+15559876543', message: 'hi' });
      jest.advanceTimersByTime(300);
    });

    expect(result.current.tel.number).toBe('+15551234567');
    expect(result.current.sms.number).toBe('+15559876543');

    jest.useRealTimers();
  });

  it('flags text input past the character limit', async () => {
    const { result } = await renderStore();
    const tooLong = 'a'.repeat(2001);

    await act(() => {
      result.current.setText(tooLong);
    });

    expect(result.current.inputError).toMatch(/too long/i);
    expect(result.current.isUsable).toBe(false);
  });
});
