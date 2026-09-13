import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A boolean that flips true on `trigger()` and back to false after
 * `duration` ms — the shared "Saved to Photos" / "Copied" / "Cleared"
 * transient-feedback pattern repeated across Generate, Scan Result, and
 * Settings. Re-triggering resets the timer instead of racing a prior one;
 * unmounting clears it too, so a pending revert never fires against an
 * unmounted component.
 */
export function useTimedFlag(duration = 1500): [boolean, () => void] {
  const [flag, setFlag] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trigger = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setFlag(true);
    timerRef.current = setTimeout(() => setFlag(false), duration);
  }, [duration]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return [flag, trigger];
}
