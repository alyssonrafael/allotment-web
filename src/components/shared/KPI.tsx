import { cn } from '#/lib/utils.ts'
import type { LucideIcon } from 'lucide-react'

interface KPIProps {
  label: string
  value: string
  icon?: LucideIcon
  iconTone?: 'primary' | 'accent' | 'violet' | 'livre' | 'bloqueado'
  subline?: React.ReactNode
  className?: string
}

const TONE: Record<NonNullable<KPIProps['iconTone']>, string> = {
  primary: 'bg-brand-primary/10 text-brand-primary',
  accent: 'bg-brand-accent/10 text-brand-accent',
  violet: 'bg-brand-violet/10 text-brand-violet',
  livre: 'bg-status-livre/10 text-status-livre',
  bloqueado: 'bg-status-bloqueado/15 text-status-bloqueado',
}

export function KPI({ label, value, icon: Icon, iconTone = 'primary', subline, className }: KPIProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-5 shadow-sm',
        'transition-transform hover:-translate-y-0.5 hover:shadow-md',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-caption text-fg-subtle">{label}</span>
        {Icon && (
          <span className={cn('inline-flex size-7 items-center justify-center rounded-md', TONE[iconTone])}>
            <Icon size={14} />
          </span>
        )}
      </div>
      <div className="mt-3 text-[32px] font-extrabold tracking-tight text-fg">{value}</div>
      {subline && <div className="mt-2 text-[12px] text-fg-muted">{subline}</div>}
    </div>
  )
}
