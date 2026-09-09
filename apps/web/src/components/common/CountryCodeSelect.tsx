import type { FocusEvent, KeyboardEvent } from 'react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useLocaleContext } from '../../hooks/LocaleProvider'
import { countryFlag, countryName, filterCountries, findCountry } from '../../utils/country'

export interface CountryCodeSelectProps {
  /** Selected ISO 3166-1 alpha-2 code, or null when no country is chosen. */
  value: string | null
  onChange: (iso: string) => void
  /** Accessible name for the trigger and listbox, e.g. "Country code". */
  label: string
  searchPlaceholder: string
  noResultsLabel: string
  /** Trigger text when nothing is selected, e.g. "+ Code". */
  triggerPlaceholder: string
  /** Extra classes for the trigger button (e.g. to adjust the fused rounding). */
  className?: string
}

/**
 * Searchable country dial-code selector following the ARIA combobox pattern:
 * a trigger button opens a popover with a filter field (the combobox) driving a
 * listbox via aria-activedescendant. Designed to fuse to the left edge of a
 * phone number input (flat right edge), but reusable standalone via className.
 */
export function CountryCodeSelect({
  value,
  onChange,
  label,
  searchPlaceholder,
  noResultsLabel,
  triggerPlaceholder,
  className,
}: CountryCodeSelectProps) {
  const { locale } = useLocaleContext()
  const baseId = useId()
  const listboxId = `${baseId}-listbox`

  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const selected = value ? findCountry(value) : undefined
  const results = useMemo(() => filterCountries(query, locale), [query, locale])
  const optionId = (iso: string) => `${baseId}-option-${iso}`

  const openPopover = () => {
    clearTimeout(closeTimerRef.current)
    setQuery('')
    const all = filterCountries('', locale)
    const selectedIndex = value ? all.findIndex((c) => c.iso === value) : -1
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    setVisible(true)
    setOpen(true)
  }

  const close = (refocusTrigger = false) => {
    setOpen(false)
    closeTimerRef.current = setTimeout(() => setVisible(false), 150)
    if (refocusTrigger) triggerRef.current?.focus()
  }

  useEffect(() => () => clearTimeout(closeTimerRef.current), [])

  const select = (iso: string) => {
    onChange(iso)
    close(true)
  }

  // Close when focus leaves the component entirely (e.g. Tab to the next field).
  const onSearchBlur = (event: FocusEvent<HTMLInputElement>) => {
    if (!containerRef.current?.contains(event.relatedTarget)) close()
  }

  // The search field is the keyboard surface while the popover is open.
  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, results.length - 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
        break
      case 'Home':
        event.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        event.preventDefault()
        setActiveIndex(results.length - 1)
        break
      case 'Enter':
        event.preventDefault()
        if (results[activeIndex]) select(results[activeIndex].iso)
        break
      case 'Escape':
        event.preventDefault()
        close(true)
        break
    }
  }

  useEffect(() => {
    if (open) searchRef.current?.focus()
  }, [open])

  // Light-dismiss: any pointer press outside the component closes the popover.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
        closeTimerRef.current = setTimeout(() => setVisible(false), 150)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [open])

  // Keep the keyboard-highlighted option visible while arrowing through the list.
  useEffect(() => {
    if (!open) return
    const active = results[activeIndex]
    if (!active) return
    const el = document.getElementById(optionId(active.iso))
    // jsdom has no scrollIntoView; guard so tests exercise this path safely.
    if (typeof el?.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, open])

  const activeIso = results[activeIndex]?.iso

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? close() : openPopover())}
        className={twMerge(
          clsx(
            'flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-l-lg border border-border-strong bg-surface-inset px-3 text-sm text-text-primary shadow-sm',
            'transition-colors duration-150 motion-reduce:transition-none hover:bg-surface-raised',
            'focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-focus-ring',
            className,
          ),
        )}
      >
        <span className="sr-only">{label}</span>
        {selected ? (
          <>
            <span aria-hidden className="text-base leading-none">{countryFlag(selected.iso)}</span>
            <span className="font-medium">{selected.dialCode}</span>
          </>
        ) : (
          <span className="text-text-secondary">{triggerPlaceholder}</span>
        )}
        <ChevronDown
          size={15}
          aria-hidden
          className={clsx(
            'text-text-secondary transition-transform duration-150 motion-reduce:transition-none',
            open && 'rotate-180',
          )}
        />
      </button>

      {visible && (
        <div className={clsx(
          'absolute left-0 top-full z-20 mt-1.5 w-72 max-w-[calc(100vw-3rem)] overflow-hidden rounded-xl border border-border-subtle bg-surface-raised shadow-md',
          'transition-opacity duration-150 starting:opacity-0 motion-reduce:transition-none',
          !open && 'opacity-0 pointer-events-none',
        )}>
          <div className="border-b border-border-subtle p-2">
            <div className="relative">
              <Search size={14} aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                ref={searchRef}
                type="text"
                role="combobox"
                aria-expanded={open}
                aria-controls={listboxId}
                aria-activedescendant={activeIso ? optionId(activeIso) : undefined}
                aria-autocomplete="list"
                aria-label={searchPlaceholder}
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActiveIndex(0)
                }}
                onKeyDown={onSearchKeyDown}
                onBlur={onSearchBlur}
                className="h-9 w-full rounded-lg border border-border-strong bg-surface-inset pl-8 pr-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-focus-ring"
              />
            </div>
          </div>
          <div id={listboxId} role="listbox" aria-label={label} aria-live="polite" className="max-h-64 overflow-y-auto p-1">
            {results.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-text-secondary">{noResultsLabel}</p>
            ) : (
              results.map((country, index) => (
                <div
                  key={country.iso}
                  id={optionId(country.iso)}
                  role="option"
                  aria-selected={country.iso === value}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => select(country.iso)}
                  className={clsx(
                    'flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-text-primary',
                    (index === activeIndex || country.iso === value) && 'bg-surface-inset',
                  )}
                >
                  <span aria-hidden className="text-base leading-none">{countryFlag(country.iso)}</span>
                  <span className="min-w-0 flex-1 truncate">{countryName(country.iso, locale)}</span>
                  <span className="text-text-secondary">{country.dialCode}</span>
                  {country.iso === value && <Check size={15} aria-hidden className="text-action" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CountryCodeSelect
