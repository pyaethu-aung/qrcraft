import { useMemo, useRef } from 'react'
import type { VEventConfig } from '../types/qr'
import { buildVEventString, timePartOf, toAllDayValue, toTimedValue } from '../utils/vevent'
import { usePersistedConfig } from './usePersistedConfig'

const DEFAULT_VEVENT_CONFIG: VEventConfig = {
  summary: '',
  start: '',
  end: '',
  allDay: false,
  location: '',
  description: '',
}

export interface UseVEventConfigReturn {
  veventConfig: VEventConfig
  veventString: string
  setSummary: (v: string) => void
  setStart: (v: string) => void
  setEnd: (v: string) => void
  setAllDay: (v: boolean) => void
  setLocation: (v: string) => void
  setDescription: (v: string) => void
}

export function useVEventConfig(): UseVEventConfigReturn {
  const [veventConfig, setVEventConfig] = usePersistedConfig<VEventConfig>(
    'qr-generator:draft:vevent',
    DEFAULT_VEVENT_CONFIG,
  )

  // Times the user had chosen before switching to all-day, so switching back
  // restores them instead of silently replacing them with the defaults — a
  // printed poster carrying a wrong time is the worst failure this form has.
  const stashedTimes = useRef({ start: '09:00', end: '10:00' })

  const setSummary = (summary: string) => setVEventConfig((prev) => ({ ...prev, summary }))
  const setStart = (start: string) => setVEventConfig((prev) => ({ ...prev, start }))
  const setEnd = (end: string) => setVEventConfig((prev) => ({ ...prev, end }))
  const setLocation = (location: string) => setVEventConfig((prev) => ({ ...prev, location }))
  const setDescription = (description: string) =>
    setVEventConfig((prev) => ({ ...prev, description }))

  // Toggling all-day converts the date values in place so the chosen day survives
  // the format switch instead of the inputs blanking out (see toAllDayValue/toTimedValue).
  const setAllDay = (allDay: boolean) =>
    setVEventConfig((prev) => {
      if (allDay) {
        stashedTimes.current = {
          start: timePartOf(prev.start) ?? stashedTimes.current.start,
          end: timePartOf(prev.end) ?? stashedTimes.current.end,
        }
        return { ...prev, allDay, start: toAllDayValue(prev.start), end: toAllDayValue(prev.end) }
      }
      return {
        ...prev,
        allDay,
        start: toTimedValue(prev.start, stashedTimes.current.start),
        end: toTimedValue(prev.end, stashedTimes.current.end),
      }
    })

  const veventString = useMemo(() => buildVEventString(veventConfig), [veventConfig])

  return {
    veventConfig,
    veventString,
    setSummary,
    setStart,
    setEnd,
    setAllDay,
    setLocation,
    setDescription,
  }
}
