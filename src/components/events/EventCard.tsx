import { Link } from '@tanstack/react-router'
import { CalendarDays, ChevronRight } from 'lucide-react'
import { useAllotmentsQuery } from '#/hooks/useAllotments'
import { Button } from '#/components/ui/button'
import { EVENT_TYPES, STATUS_COLORS } from '#/lib/constants'
import { fmtDate, fmtDateRange, fmtBRLcompact } from '#/lib/format'
import type { Allotment, EventListItem, EventStatus } from '#/types'

interface EventCardProps {
  event: EventListItem
  index?: number
}

const STATUS_CHIP: Record<EventStatus, { bg: string; text: string; dot: string; label: string }> = {
  upcoming: { bg: 'bg-brand-primary/10', text: 'text-brand-primary',     dot: 'bg-brand-primary',  label: 'Próximo'   },
  active:   { bg: 'bg-status-livre-50',  text: 'text-status-livre-text',  dot: 'bg-status-livre',   label: 'Em curso'  },
  finished: { bg: 'bg-surface-2',        text: 'text-fg-muted',           dot: 'bg-fg-subtle',      label: 'Encerrado' },
}

export function EventCard({ event, index = 0 }: EventCardProps) {
  const { data: allotments = [], isLoading } = useAllotmentsQuery(event.id)

  const sold     = allotments.filter((a) => a.status === 'SOLD').length
  const reserved = allotments.filter((a) => a.status === 'RESERVED').length
  const free     = allotments.filter((a) => a.status === 'AVAILABLE').length
  const revenue  = allotments
    .filter((a) => a.status === 'SOLD')
    .reduce((s, a) => s + a.price, 0)
  const pct = allotments.length > 0
    ? Math.round(((sold + reserved) / allotments.length) * 100)
    : 0

  const chip = STATUS_CHIP[event.status]

  return (
    <Link
      to="/events/$eventId/dashboard"
      params={{ eventId: event.id }}
      className="animate-in fade-in slide-in-from-bottom-2 group block cursor-pointer overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
      aria-label={`Abrir evento ${event.name}, ${chip.label}, ${pct}% de ocupação`}
    >
      {/* HEADER */}
      <div className="flex flex-col gap-2.5 border-b border-border p-4.5">
        <div className="flex items-center gap-2">
          <TypeBadge type={event.type} />
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em] ${chip.bg} ${chip.text}`}
          >
            <span className={`size-1.5 rounded-full ${chip.dot}`} />
            {chip.label}
          </span>
          <span className="ml-auto inline-flex items-center gap-1 text-[11.5px] font-bold text-fg-subtle">
            <CalendarDays size={12} />
            {fmtDate(event.startDate)}
          </span>
        </div>

        <h3 className="m-0 text-[18px] font-extrabold leading-snug tracking-tight text-fg transition-colors group-hover:text-brand-primary">
          {event.name}
        </h3>

        <div className="text-[12px] font-semibold text-fg-subtle">
          {fmtDateRange(event.startDate, event.endDate)} · {event.canvasWidth}×{event.canvasHeight}m
        </div>
      </div>

      {/* BODY */}
      <div className="flex items-center gap-3.5 border-b border-border px-4.5 py-3.5">
        <MiniPavilionSVG
          canvasWidth={event.canvasWidth}
          canvasHeight={event.canvasHeight}
          allotments={allotments}
          isLoading={isLoading}
        />

        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-caption">Ocupação</span>
            <strong className="text-[17px] font-extrabold tabular-nums text-fg">
              {pct}%
            </strong>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full transition-[width] duration-500 ease-out"
              style={{
                width: `${pct}%`,
                background: 'linear-gradient(90deg, var(--brand-primary), var(--brand-violet))',
              }}
            />
          </div>

          <div className="mt-1 flex gap-2.5 text-[11.5px] font-bold text-fg-muted">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block size-1.5 rounded-full bg-status-vendido" />
              <span aria-label={`${sold} vendidos`}>{sold}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block size-1.5 rounded-full bg-status-reservado" />
              <span aria-label={`${reserved} reservados`}>{reserved}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block size-1.5 rounded-full bg-status-livre" />
              <span aria-label={`${free} livres`}>{free}</span>
            </span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-between bg-surface-2 px-4.5 py-3.5">
        <div>
          <div className="text-caption">Receita realizada</div>
          <div className="mt-0.5 text-[16px] font-extrabold text-status-livre-text">
            {fmtBRLcompact(revenue)}
          </div>
        </div>
        <Button
          size="sm"
          className="bg-brand-primary text-white hover:bg-brand-primary/90"
        >
          Gerenciar
          <ChevronRight size={13} />
        </Button>
      </div>
    </Link>
  )
}

interface MiniPavilionSVGProps {
  canvasWidth: number
  canvasHeight: number
  allotments: Allotment[]
  isLoading: boolean
}

function MiniPavilionSVG({ canvasWidth, canvasHeight, allotments, isLoading }: MiniPavilionSVGProps) {
  const W = 96
  const sx = W / canvasWidth
  const H = Math.max(60, canvasHeight * sx)

  return (
    <svg
      width={W}
      height={H}
      className="block shrink-0 rounded-sm border border-border bg-surface-2"
      aria-label="Mini-mapa dos stands"
    >
      {!isLoading &&
        allotments.map((a) => (
          <rect
            key={a.id}
            x={a.x * sx}
            y={a.y * sx}
            width={Math.max(2, a.width * sx)}
            height={Math.max(2, a.height * sx)}
            fill={STATUS_COLORS[a.status]}
            opacity={0.85}
            rx={1}
          />
        ))}
    </svg>
  )
}

function TypeBadge({ type }: { type: EventListItem['type'] }) {
  const meta = EVENT_TYPES.find((t) => t.id === type)
  if (!meta) return null
  return (
    <span
      className="rounded-md px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-white"
      style={{ backgroundColor: meta.color }}
    >
      {meta.label}
    </span>
  )
}
