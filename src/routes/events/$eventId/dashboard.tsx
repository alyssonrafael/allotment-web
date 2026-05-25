import { createFileRoute } from '@tanstack/react-router'
import { Activity, ChartPie, Map, Wallet } from 'lucide-react'
import { useEventQuery, useEventRevenueQuery, useEventActivitiesQuery } from '#/hooks/useEvents'
import { useAllotmentsQuery } from '#/hooks/useAllotments'
import { Card } from '#/components/ui/card'
import { Skeleton } from '#/components/ui/skeleton'
import { KPI } from '#/components/shared/KPI'
import { fmtBRLcompact, fmtRelativeTime } from '#/lib/format'
import { ACTIVITY_COLORS, ACTIVITY_ICONS } from '#/lib/constants'
import type { AllotmentStatus, RecentActivity } from '#/types'

export const Route = createFileRoute('/events/$eventId/dashboard')({
  component: DashboardScreen,
})

function DashboardScreen() {
  const { eventId } = Route.useParams()
  const event = useEventQuery(eventId)
  const allotments = useAllotmentsQuery(eventId)
  const revenue = useEventRevenueQuery(eventId)
  const activities = useEventActivitiesQuery(eventId)

  const list = allotments.data ?? []
  const totalArea = event.data ? event.data.canvasWidth * event.data.canvasHeight : 0
  const occupiedArea = list.reduce((acc, a) => acc + a.width * a.height, 0)
  const occupancy = totalArea > 0 ? (occupiedArea / totalArea) * 100 : 0
  const revenuePotential = list.reduce((acc, a) => acc + a.price, 0)

  // Fallback local counts (used while revenue loads)
  const counts = countByStatus(list)
  const rc = revenue.data?.counts

  const totalStands = rc
    ? rc.sold + rc.reserved + rc.available + rc.blocked
    : list.length

  const isLoading = event.isLoading || allotments.isLoading || revenue.isLoading

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out flex flex-col gap-5">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <Skeleton className="h-31 rounded-xl" />
            <Skeleton className="h-31 rounded-xl" />
            <Skeleton className="h-31 rounded-xl" />
            <Skeleton className="h-31 rounded-xl" />
          </>
        ) : (
          <>
            <KPI
              label="Ocupação física"
              value={`${occupancy.toFixed(1)}%`}
              icon={Map}
              iconTone="primary"
              subline={`${occupiedArea} m² ocupados de ${totalArea} m²`}
            />
            <KPI
              label="Receita prevista"
              value={fmtBRLcompact(revenue.data?.total ?? 0)}
              icon={Wallet}
              iconTone="accent"
              subline={`Realizada: ${fmtBRLcompact(revenue.data?.realized ?? 0)}`}
            />
            <KPI
              label="Controle comercial"
              value={`${rc?.sold ?? counts.SOLD}/${(rc?.sold ?? counts.SOLD) + (rc?.reserved ?? counts.RESERVED)}`}
              icon={ChartPie}
              iconTone="violet"
              subline={`Vendidos · Reservados ${rc?.reserved ?? counts.RESERVED}`}
            />
            <KPI
              label="Distribuição"
              value={String(totalStands)}
              icon={Activity}
              iconTone="livre"
              subline={`Livre ${rc?.available ?? counts.AVAILABLE} · Bloqueados ${rc?.blocked ?? counts.BLOCKED}`}
            />
          </>
        )}
      </section>

      <section className="grid gap-3 lg:grid-cols-[1fr_1.4fr_1fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-h2">Status dos stands</h3>
          </div>
          <div className="mt-4 flex items-center justify-center text-fg-muted">
            <div className="text-center">
              <div className="text-display">{totalStands}</div>
              <div className="text-caption">Stands</div>
            </div>
          </div>
          <ul className="mt-5 space-y-2 text-[13px]">
            <LegendRow label="Livre"     count={rc?.available ?? counts.AVAILABLE} total={totalStands} dot="bg-status-livre" />
            <LegendRow label="Reservado" count={rc?.reserved  ?? counts.RESERVED}  total={totalStands} dot="bg-status-reservado" />
            <LegendRow label="Vendido"   count={rc?.sold      ?? counts.SOLD}       total={totalStands} dot="bg-status-vendido" />
            <LegendRow label="Bloqueado" count={rc?.blocked   ?? counts.BLOCKED}    total={totalStands} dot="bg-status-bloqueado" />
          </ul>
        </Card>

        <Card className="p-5">
          <h3 className="text-h2">Mapa de calor</h3>
          <div className="mt-1 text-[12px] text-fg-muted">
            Visão por status — {event.data?.canvasWidth ?? '—'} × {event.data?.canvasHeight ?? '—'} m
          </div>
          <div className="mt-4 flex h-55 items-center justify-center rounded-md border border-dashed border-border text-[12px] text-fg-subtle">
            Mapa de calor — implementação futura
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-h2">Previsão financeira</h3>
          <div className="mt-4 space-y-3 text-[13px]">
            <FinanceRow
              label="Potencial"
              value={fmtBRLcompact(revenuePotential)}
              tone="muted"
              pct={100}
            />
            <FinanceRow
              label="Previsto"
              value={fmtBRLcompact(revenue.data?.total ?? 0)}
              tone="accent"
              pct={revenuePotential > 0 ? ((revenue.data?.total ?? 0) / revenuePotential) * 100 : 0}
            />
            <FinanceRow
              label="Realizado"
              value={fmtBRLcompact(revenue.data?.realized ?? 0)}
              tone="livre"
              pct={revenuePotential > 0 ? ((revenue.data?.realized ?? 0) / revenuePotential) * 100 : 0}
            />
          </div>
        </Card>
      </section>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-h2">Atividade recente</h3>
          <span className="text-[11px] text-fg-subtle">Últimas 24h</span>
        </div>
        {activities.isLoading ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </div>
        ) : (activities.data?.length ?? 0) === 0 ? (
          <div className="mt-4 text-[13px] text-fg-muted">Sem atividades recentes.</div>
        ) : (
          <ul className="mt-4 space-y-1">
            {activities.data!.map((act) => (
              <ActivityRow key={act.id} activity={act} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function countByStatus(list: Array<{ status: AllotmentStatus }>) {
  const acc: Record<AllotmentStatus, number> = {
    AVAILABLE: 0,
    RESERVED: 0,
    SOLD: 0,
    BLOCKED: 0,
  }
  for (const a of list) acc[a.status] += 1
  return acc
}

function ActivityRow({ activity }: { activity: RecentActivity }) {
  const Icon = ACTIVITY_ICONS[activity.type]
  const color = ACTIVITY_COLORS[activity.type]
  return (
    <li className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-2">
      <span className={`flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-2 ${color}`}>
        <Icon size={14} />
      </span>
      <span className="flex-1 text-[13px] text-fg">{activity.action}</span>
      <span className="shrink-0 text-[11px] text-fg-subtle">{fmtRelativeTime(activity.createdAt)}</span>
    </li>
  )
}

function LegendRow({
  label,
  count,
  total,
  dot,
}: {
  label: string
  count: number
  total: number
  dot: string
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <li className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-fg-muted">
        <span className={`size-2 rounded-full ${dot}`} />
        {label}
      </span>
      <span className="flex items-center gap-3">
        <span className="font-bold text-fg">{count}</span>
        <span className="text-fg-subtle">{pct}%</span>
      </span>
    </li>
  )
}

function FinanceRow({
  label,
  value,
  tone,
  pct,
}: {
  label: string
  value: string
  tone: 'muted' | 'accent' | 'livre'
  pct: number
}) {
  const barTone =
    tone === 'accent' ? 'bg-brand-accent' : tone === 'livre' ? 'bg-status-livre' : 'bg-surface-3'
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-fg-muted">{label}</span>
        <span className="font-bold text-fg">{value}</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div className={`h-full ${barTone}`} style={{ width: `${Math.max(2, pct)}%` }} />
      </div>
    </div>
  )
}
