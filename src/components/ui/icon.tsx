import { cn } from '@/lib/utils'

interface IconProps {
  id: string
  size?: number
  className?: string
  'aria-label'?: string
  style?: React.CSSProperties
}

export function Icon({ id, size = 20, className, 'aria-label': ariaLabel, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      className={cn('inline-block flex-shrink-0', className)}
      style={style}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
      focusable="false"
    >
      <use href={`/icons/sprite.svg#icon-${id}`} />
    </svg>
  )
}
