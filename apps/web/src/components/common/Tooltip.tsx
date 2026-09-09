import { useState, useId } from 'react'

interface TooltipProps {
  content: string
  ariaLabel?: string
}

export function Tooltip({ content, ariaLabel = 'More information' }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const id = useId()

  return (
    // Hover lives on the wrapper, not the trigger, so the pointer can travel
    // into the panel without dismissing it (WCAG 1.4.13 Hoverable). Escape
    // closes it without moving focus (WCAG 1.4.13 Dismissible).
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && visible) {
          event.stopPropagation()
          setVisible(false)
        }
      }}
    >
      <button
        type="button"
        aria-describedby={visible ? id : undefined}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="group inline-flex h-9 w-9 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1"
        aria-label={ariaLabel}
      >
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-surface-inset text-[10px] font-semibold text-text-secondary group-hover:bg-surface-raised">
          ?
        </span>
      </button>
      {visible && (
        <div
          id={id}
          role="tooltip"
          className="absolute top-full right-0 mt-2 sm:top-1/2 sm:right-auto sm:left-full sm:-translate-y-1/2 sm:mt-0 sm:ml-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-lg border border-border-subtle bg-surface-raised p-3 text-xs leading-relaxed text-text-secondary shadow-md z-50"
        >
          {content}
        </div>
      )}
    </div>
  )
}
