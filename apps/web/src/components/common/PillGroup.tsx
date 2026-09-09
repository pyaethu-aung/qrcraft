import type { ReactNode } from 'react'

export interface PillOption<T extends string = string> {
  value: T
  label: string
  icon?: ReactNode
}

export interface PillGroupProps<T extends string = string> {
  options: PillOption<T>[]
  value: T
  onChange: (value: T) => void
  /** h-9 (36px) for mode switchers with icons; h-11 (44px) default */
  size?: 'sm' | 'md'
  /**
   * Container layout classes. Default `flex flex-wrap gap-2` lets pills grow to fill
   * each row, which is right for a single row. Pass a grid layout (e.g.
   * `grid grid-cols-2 lg:grid-cols-3 gap-2`) when the option count wraps, so every
   * pill stays an equal-width cell instead of the last row's lone pill stretching full-width.
   */
  containerClassName?: string
  /**
   * Per-pill flex sizing. Default `flex-1` grows each pill to fill its row — right for a
   * single row. For a wrapping set, pass a fixed basis with `grow-0` (e.g.
   * `grow-0 basis-[calc(50%-0.25rem)]`) so pills stay equal-width and a partial last row
   * centers under `justify-center` instead of stretching or leaving an empty grid cell.
   */
  itemClassName?: string
  /**
   * Active-pill treatment. Defaults to the brand approval color. Override with a warning
   * treatment when the selected option is one the system advises against (e.g. an
   * error-correction level below the recommended one), so the active color agrees with the
   * accompanying caption instead of signalling approval for a cautioned choice.
   */
  activeClassName?: string
  'aria-label'?: string
  'aria-labelledby'?: string
}

export function PillGroup<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  containerClassName = 'flex flex-wrap gap-2',
  itemClassName = 'flex-1',
  activeClassName = 'bg-action text-action-fg font-semibold',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: PillGroupProps<T>) {
  const hasIcons = options.some((o) => o.icon != null)

  return (
    <div
      className={containerClassName}
      role="group"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={(e) => { onChange(option.value); e.currentTarget.scrollIntoView?.({ block: 'nearest', inline: 'nearest' }) }}
          className={[
            'flex items-center justify-center rounded-full px-3 text-sm whitespace-nowrap transition-colors',
            itemClassName,
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2',
            size === 'sm' ? 'h-9' : 'h-11',
            hasIcons ? 'gap-1.5' : '',
            value === option.value
              ? activeClassName
              : 'bg-surface-inset text-text-primary hover:bg-surface-raised',
          ].filter(Boolean).join(' ')}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  )
}

export default PillGroup
