import { useCallback } from 'react'
import { useTimedState } from './useTimedState'

export type CopyState = 'idle' | 'copied' | 'error'

/** Copy text to the clipboard, flashing `copyState` to 'copied'/'error' then back to 'idle'. */
export function useCopyToClipboard(resetDelay = 2000) {
  const [copyState, setCopyStateTimed, setCopyState] = useTimedState<CopyState>('idle', resetDelay)

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyStateTimed('copied')
    } catch {
      setCopyStateTimed('error')
    }
  }, [setCopyStateTimed])

  return [copyState, copy, setCopyState] as const
}
