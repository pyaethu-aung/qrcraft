import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * State that flashes to a value and reverts to `initialValue` after `resetDelay` ms —
 * the "copied!", "restored", "applied" confirmation pattern used across the app. The
 * timer is cleared on unmount and whenever a new value is set, so rapid-fire calls
 * don't leave a stale reset pending. `setValue` (no timer) is exposed for callers that
 * also need to set the state immediately without scheduling a revert.
 */
export function useTimedState<T>(initialValue: T, resetDelay: number) {
  const [value, setValue] = useState<T>(initialValue)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const setTimedValue = useCallback((next: T, delay: number = resetDelay) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setValue(next)
    timerRef.current = setTimeout(() => setValue(initialValue), delay)
  }, [initialValue, resetDelay])

  return [value, setTimedValue, setValue] as const
}
