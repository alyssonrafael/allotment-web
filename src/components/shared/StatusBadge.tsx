import { cn } from '#/lib/utils.ts'
import { STATUS_LABELS, STATUS_TOKEN } from '#/lib/constants'
import type { AllotmentStatus } from '#/types'

interface StatusBadgeProps {
  status: AllotmentStatus
  className?: string
  showDot?: boolean
}

const STYLES: Record<AllotmentStatus, string> = {
  AVAILABLE: 'bg-status-livre-50 text-status-livre-text',
  RESERVED: 'bg-status-reservado-50 text-status-reservado-text',
  SOLD: 'bg-status-vendido-50 text-status-vendido-text',
  BLOCKED: 'bg-status-bloqueado-50 text-status-bloqueado-text',
}

const DOT_STYLES: Record<AllotmentStatus, string> = {
  AVAILABLE: 'bg-status-livre',
  RESERVED: 'bg-status-reservado',
  SOLD: 'bg-status-vendido',
  BLOCKED: 'bg-status-bloqueado',
}

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  return (
    <span
      data-status={STATUS_TOKEN[status]}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider',
        STYLES[status],
        className,
      )}
    >
      {showDot && (
        <span className={cn('inline-block size-1.5 rounded-full', DOT_STYLES[status])} />
      )}
      {STATUS_LABELS[status]}
    </span>
  )
}
