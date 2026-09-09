import type { TextareaHTMLAttributes } from 'react'
import { forwardRef, useId } from 'react'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  helperText?: string
  error?: string
  fullWidth?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, fullWidth = true, className, id, rows = 3, disabled, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
    const generatedId = useId()
    const textareaId = id || props.name || generatedId
    const errorId = useId()
    const helperId = useId()

    // Merge any caller-supplied describedby (e.g. a field hint) with the internal error
    // and helper ids, so none clobbers the others.
    const describedBy = [ariaDescribedBy, error ? errorId : undefined, !error && helperText ? helperId : undefined].filter(Boolean).join(' ') || undefined

    const textareaClass = twMerge(
      clsx(
        'block resize-none rounded-lg border border-border-strong bg-surface-inset px-3 py-2 text-sm text-text-primary shadow-sm placeholder:text-text-secondary',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-focus-ring',
        fullWidth && 'w-full',
        disabled && 'bg-action-disabled text-text-disabled cursor-not-allowed',
        error && 'border-error focus-visible:ring-error focus-visible:border-error',
        className,
      ),
    )

    return (
      <div className={twMerge(clsx('flex flex-col gap-1', fullWidth && 'w-full'))}>
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-text-primary">
            {label}
            {props.required && <><span className="ml-0.5 text-error" aria-hidden="true">*</span><span className="sr-only">required</span></>}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          className={textareaClass}
          disabled={disabled}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          {...props}
        />
        {error ? (
          <span id={errorId} role="alert" className="text-sm text-error">{error}</span>
        ) : (
          // Always-mounted live region so a helper hint that appears later is announced,
          // not just rendered — mirrors the Input primitive.
          <span id={helperId} aria-live="polite" className={helperText ? 'text-sm text-text-secondary' : 'sr-only'}>
            {helperText}
          </span>
        )}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'

export default Textarea
