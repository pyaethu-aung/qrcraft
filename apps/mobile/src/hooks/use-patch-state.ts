import { useCallback, useState } from 'react';

/**
 * State plus a setter that merges a partial patch into it, with a stable
 * function identity — the shared "one object, patched field-by-field"
 * pattern used by every per-content-type config and the design config in
 * qr-content-store (setWifi({ ssid }), setDesign({ eyeFrameShape }), ...).
 * A stable identity matters here for the same reason noted where the store
 * is assembled: a new setter function every render would hand every
 * consumer a new store object on every keystroke.
 */
export function usePatchState<T>(initial: T): [T, (patch: Partial<T>) => void] {
  const [state, setState] = useState(initial);
  const patch = useCallback((next: Partial<T>) => setState((prev) => ({ ...prev, ...next })), []);
  return [state, patch];
}
