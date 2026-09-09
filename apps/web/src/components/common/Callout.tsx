import type { ReactNode } from 'react'
import { TriangleAlert, X } from 'lucide-react'

export interface CalloutProps {
  /** Body text or nodes. */
  children: ReactNode
  /** Optional bold heading shown above the body. */
  title?: string
  /** Live-region semantics. Defaults to 'alert' (assertive), matching the prior callouts. */
  role?: 'alert' | 'status'
  /** When provided, renders a dismiss button that calls this on click. */
  onDismiss?: () => void
  /** Accessible label for the dismiss button. Required when onDismiss is set. */
  dismissLabel?: string
}

/**
 * Warning callout: a warm inset caution box with a leading alert-triangle icon and an
 * optional title and dismiss button. The single source of truth for the project's
 * warning surfaces (payload-too-long, weak Wi-Fi security, risky pixel pattern, low
 * contrast). Tone is fixed to "warning"; if other tones are ever needed, add a variant
 * prop rather than a second component.
 */
export function Callout({ children, title, role = 'alert', onDismiss, dismissLabel }: CalloutProps) {
  return (
    <div
      role={role}
      className="flex items-start justify-between gap-2 rounded-lg border border-warning-border bg-warning-surface p-3 text-sm text-warning"
    >
      <div className="flex items-start gap-2">
        <TriangleAlert size={title ? 18 : 16} aria-hidden className="mt-0.5 shrink-0" />
        <div className="flex flex-col gap-0.5">
          {title && <strong className="font-semibold">{title}</strong>}
          <span>{children}</span>
        </div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="-my-1 ml-2 shrink-0 rounded-md p-2.5 text-warning hover:bg-warning-border/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          <X size={16} aria-hidden />
        </button>
      )}
    </div>
  )
}

export default Callout
