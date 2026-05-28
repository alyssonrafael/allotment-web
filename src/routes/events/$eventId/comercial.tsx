import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeftRight, CalendarClock, CheckCircle2, Eye, Lock } from 'lucide-react'
import { useAllotmentsQuery, usePatchStatus, allotmentsKeys } from '#/hooks/useAllotments'
import { Skeleton } from '#/components/ui/skeleton'
import { fmtBRLcompact } from '#/lib/format'
import { cn } from '#/lib/utils'
import type { Allotment, AllotmentStatus } from '#/types'
import type { LucideIcon } from 'lucide-react'

export const Route = createFileRoute('/events/$eventId/comercial')({
  component: ComercialScreen,
})

const COLUMNS: AllotmentStatus[] = ['AVAILABLE', 'RESERVED', 'SOLD', 'BLOCKED']

interface ColumnConfig {
  title: string
  subtitle: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  badgeBg: string
  badgeText: string
  amountColor: string
}

const COLUMN_CONFIG: Record<AllotmentStatus, ColumnConfig> = {
  AVAILABLE: {
    title: 'Disponíveis',
    subtitle: 'Liberados para venda',
    icon: Eye,
    iconBg: 'bg-status-livre/10',
    iconColor: 'text-status-livre',
    badgeBg: 'bg-status-livre/10',
    badgeText: 'text-status-livre',
    amountColor: 'text-status-livre',
  },
  RESERVED: {
    title: 'Em reserva',
    subtitle: 'Aguardando confirmação',
    icon: CalendarClock,
    iconBg: 'bg-status-reservado/10',
    iconColor: 'text-status-reservado',
    badgeBg: 'bg-status-reservado/10',
    badgeText: 'text-status-reservado',
    amountColor: 'text-status-reservado',
  },
  SOLD: {
    title: 'Vendidos',
    subtitle: 'Faturamento confirmado',
    icon: CheckCircle2,
    iconBg: 'bg-status-vendido/10',
    iconColor: 'text-status-vendido',
    badgeBg: 'bg-status-vendido/10',
    badgeText: 'text-status-vendido',
    amountColor: 'text-status-vendido',
  },
  BLOCKED: {
    title: 'Bloqueados',
    subtitle: 'Indisponíveis no momento',
    icon: Lock,
    iconBg: 'bg-status-bloqueado/10',
    iconColor: 'text-status-bloqueado',
    badgeBg: 'bg-status-bloqueado/10',
    badgeText: 'text-status-bloqueado',
    amountColor: 'text-status-bloqueado',
  },
}

const CODE_COLOR: Record<AllotmentStatus, string> = {
  AVAILABLE: 'text-status-livre',
  RESERVED: 'text-status-reservado',
  SOLD: 'text-status-vendido',
  BLOCKED: 'text-status-bloqueado',
}

const DOT_COLOR: Record<AllotmentStatus, string> = {
  AVAILABLE: 'bg-status-livre',
  RESERVED: 'bg-status-reservado',
  SOLD: 'bg-status-vendido',
  BLOCKED: 'bg-status-bloqueado',
}

function ComercialScreen() {
  const { eventId } = Route.useParams()
  const { data, isLoading } = useAllotmentsQuery(eventId)
  const patchStatus = usePatchStatus(eventId)
  const qc = useQueryClient()

  const list = data ?? []
  const [activeId, setActiveId] = useState<string | null>(null)
  const activeItem = list.find((a) => a.id === activeId) ?? null

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  const sold = list.filter((a) => a.status === 'SOLD')
  const reserved = list.filter((a) => a.status === 'RESERVED')
  const available = list.filter((a) => a.status === 'AVAILABLE')
  const faturamento = sold.reduce((acc, a) => acc + a.price, 0)
  const emNegociacao = reserved.reduce((acc, a) => acc + a.price, 0)
  const commercialBase = sold.length + reserved.length + available.length
  const conversao = commercialBase > 0 ? Math.round((sold.length / commercialBase) * 100) : 0

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as string)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (!over) return

    const allotmentId = active.id as string
    const newStatus = over.id as AllotmentStatus

    if (!COLUMNS.includes(newStatus)) return

    const allotment = list.find((a) => a.id === allotmentId)
    if (!allotment || allotment.status === newStatus) return

    const prev = qc.getQueryData<Allotment[]>(allotmentsKeys.byEvent(eventId))
    qc.setQueryData<Allotment[]>(
      allotmentsKeys.byEvent(eventId),
      (old) => old?.map((a) => (a.id === allotmentId ? { ...a, status: newStatus } : a)) ?? [],
    )

    patchStatus.mutate(
      { id: allotmentId, payload: { status: newStatus } },
      {
        onSuccess: () => {
          toast.success(`Stand movido para ${COLUMN_CONFIG[newStatus].title}`)
        },
        onError: () => {
          if (prev) qc.setQueryData(allotmentsKeys.byEvent(eventId), prev)
          toast.error('Erro ao mover o stand')
        },
      },
    )
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out flex flex-col gap-4">
        {/* Metrics bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4 sm:gap-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-fg-subtle">
                Faturamento
              </p>
              <p className="mt-0.5 text-[22px] font-extrabold tabular-nums text-status-livre">
                {fmtBRLcompact(faturamento)}
              </p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-fg-subtle">
                Em negociação
              </p>
              <p className="mt-0.5 text-[22px] font-extrabold tabular-nums text-status-reservado">
                {fmtBRLcompact(emNegociacao)}
              </p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-fg-subtle">
                Conversão
              </p>
              <p className="mt-0.5 text-[22px] font-extrabold tabular-nums text-fg">
                {conversao}%
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-1.5 text-[12px] text-fg-subtle sm:flex">
            <ArrowLeftRight size={13} />
            Arraste os cards para mudar o status
          </div>
        </div>

        {/* Kanban board */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map((status) => {
            const items = list.filter((a) => a.status === status)
            const total = items.reduce((acc, a) => acc + a.price, 0)
            return (
              <KanbanColumn
                key={status}
                status={status}
                items={items}
                total={total}
                isLoading={isLoading}
                activeId={activeId}
              />
            )
          })}
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
        {activeItem && <StandCardOverlay allotment={activeItem} />}
      </DragOverlay>
    </DndContext>
  )
}

function KanbanColumn({
  status,
  items,
  total,
  isLoading,
  activeId,
}: {
  status: AllotmentStatus
  items: Allotment[]
  total: number
  isLoading: boolean
  activeId: string | null
}) {
  const cfg = COLUMN_CONFIG[status]
  const Icon = cfg.icon
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-xl border bg-surface transition-colors duration-150',
        isOver ? 'border-brand-primary/40 bg-brand-primary/2' : 'border-border',
      )}
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-lg',
                cfg.iconBg,
                cfg.iconColor,
              )}
            >
              <Icon size={14} />
            </span>
            <div>
              <div className="text-[13px] font-bold leading-tight text-fg">{cfg.title}</div>
              <div className="mt-0.5 text-[11px] leading-tight text-fg-subtle">{cfg.subtitle}</div>
            </div>
          </div>
          <span
            className={cn(
              'flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold',
              cfg.badgeBg,
              cfg.badgeText,
            )}
          >
            {items.length}
          </span>
        </div>
        <div className={cn('mt-2.5 text-[15px] font-extrabold tabular-nums', cfg.amountColor)}>
          {fmtBRLcompact(total)}
          {status === 'SOLD' && (
            <span className="ml-1.5 text-[10px] font-semibold text-fg-subtle">· realizado</span>
          )}
        </div>
      </div>

      <div className="mx-4 h-px bg-border" />

      {/* Cards */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        {isLoading && <Skeleton className="h-18 w-full rounded-lg" />}
        {!isLoading && items.length === 0 && (
          <div
            className={cn(
              'rounded-lg border border-dashed p-4 text-center text-[11.5px] transition-colors',
              isOver
                ? 'border-brand-primary/40 bg-brand-primary/5 text-brand-primary'
                : 'border-border text-fg-subtle',
            )}
          >
            {isOver ? 'Soltar aqui' : 'Sem stands'}
          </div>
        )}
        {items.map((a) => (
          <StandCard key={a.id} allotment={a} isGhost={activeId === a.id} />
        ))}
      </div>
    </div>
  )
}

function StandCard({ allotment: a, isGhost }: { allotment: Allotment; isGhost: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: a.id })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'rounded-lg border border-border bg-card p-3 select-none',
        'cursor-grab active:cursor-grabbing',
        'transition-opacity duration-150',
        (isDragging || isGhost) ? 'opacity-30' : 'opacity-100',
      )}
    >
      <CardBody allotment={a} />
    </div>
  )
}

function StandCardOverlay({ allotment: a }: { allotment: Allotment }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-xl cursor-grabbing rotate-1 scale-[1.03]">
      <CardBody allotment={a} />
    </div>
  )
}

function CardBody({ allotment: a }: { allotment: Allotment }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <span className={cn('font-mono text-[11px] font-bold tracking-wide', CODE_COLOR[a.status])}>
          {a.code}
        </span>
        <span className="text-[12px] font-bold tabular-nums text-fg">
          {fmtBRLcompact(a.price)}
        </span>
      </div>
      <div className="mt-1.5 text-[13px] font-bold leading-tight text-fg">{a.name}</div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] text-fg-subtle">
          {a.width}×{a.height}m · {a.width * a.height}m²
        </span>
        <span className={cn('size-2 shrink-0 rounded-full', DOT_COLOR[a.status])} />
      </div>
    </>
  )
}
