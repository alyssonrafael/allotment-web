import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Activity, ChartPie, Map, Wallet } from 'lucide-react'
import { useEventQuery, useEventRevenueQuery, useEventActivitiesQuery } from '#/hooks/useEvents'
import { useAllotmentsQuery } from '#/hooks/useAllotments'
import { Card } from '#/components/ui/card'
import { Skeleton } from '#/components/ui/skeleton'
import { KPI } from '#/components/shared/KPI'
import { HeatmapCard } from '#/components/dashboard/HeatmapCard'
import { Pagination } from '#/components/shared/Pagination'
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
          <div className="flex items-start justify-between">
            <h3 className="text-h2">Status dos stands</h3>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-brand-violet/10 text-brand-violet">
              <ChartPie size={15} />
            </div>
          </div>
          <div className="mt-3 flex justify-center">
            <div className="size-37.5">
              <DonutChart
                data={[
                  { value: rc?.available ?? counts.AVAILABLE, color: 'var(--status-livre)' },
                  { value: rc?.reserved  ?? counts.RESERVED,  color: 'var(--status-reservado)' },
                  { value: rc?.sold      ?? counts.SOLD,       color: 'var(--status-vendido)' },
                  { value: rc?.blocked   ?? counts.BLOCKED,    color: 'var(--status-bloqueado)' },
                ]}
                total={totalStands}
              />
            </div>
          </div>
          <ul className="mt-4 space-y-2 text-[13px]">
            <LegendRow label="Livre"     count={rc?.available ?? counts.AVAILABLE} total={totalStands} dot="bg-status-livre" />
            <LegendRow label="Reservado" count={rc?.reserved  ?? counts.RESERVED}  total={totalStands} dot="bg-status-reservado" />
            <LegendRow label="Vendido"   count={rc?.sold      ?? counts.SOLD}       total={totalStands} dot="bg-status-vendido" />
            <LegendRow label="Bloqueado" count={rc?.blocked   ?? counts.BLOCKED}    total={totalStands} dot="bg-status-bloqueado" />
          </ul>
        </Card>

        <HeatmapCard
          allotments={list}
          canvasWidth={event.data?.canvasWidth ?? 0}
          canvasHeight={event.data?.canvasHeight ?? 0}
        />

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

      <ActivityCard activities={activities.data ?? []} isLoading={activities.isLoading} />
    </div>
  )
}

function DonutChart({
  data,
  total,
}: {
  data: Array<{ value: number; color: string }>
  total: number
}) {
  const cx = 80, cy = 80, r = 54, sw = 18
  const c = 2 * Math.PI * r
  const GAP = 4

  let offset = 0
  return (
    <svg viewBox="0 0 160 160" width="100%" height="100%">
      <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={sw} stroke="var(--surface-2)" />
      {total > 0 &&
        data.map((seg, i) => {
          const full = (seg.value / total) * c
          const len = Math.max(0, full - GAP)
          const rot = -90 + (offset / c) * 360
          offset += full
          if (seg.value === 0) return null
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              strokeWidth={sw}
              stroke={seg.color}
              strokeDasharray={`${len} ${c}`}
              strokeLinecap="round"
              transform={`rotate(${rot}, ${cx}, ${cy})`}
            />
          )
        })}
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="26"
        fontWeight="800"
        fill="var(--fg)"
      >
        {total}
      </text>
      <text
        x={cx}
        y={cy + 13}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="9.5"
        fontWeight="700"
        fill="var(--fg-muted)"
        letterSpacing="1.5"
      >
        STANDS
      </text>
    </svg>
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

const PAGE_SIZE = 10

function ActivityCard({ activities, isLoading }: { activities: RecentActivity[]; isLoading: boolean }) {
  const [page, setPage] = useState(0)
  const totalPages = Math.max(1, Math.ceil(activities.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const visible = activities.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-h2">Atividade recente</h3>
        <span className="text-[11px] text-fg-subtle">Últimas 24h</span>
      </div>
      {isLoading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-lg" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="mt-4 text-[13px] text-fg-muted">Sem atividades recentes.</div>
      ) : (
        <>
          <ul className="mt-4 space-y-1">
            {visible.map((act) => (
              <ActivityRow key={act.id} activity={act} />
            ))}
          </ul>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            totalItems={activities.length}
            onPageChange={setPage}
            className="mt-4 pt-3"
          />
        </>
      )}
    </Card>
  )
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
      <span className="flex items-center gap-2">
        <span className="w-6 text-right font-bold tabular-nums text-fg">{count}</span>
        <span className="w-9 text-right tabular-nums text-fg-subtle">{pct}%</span>
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
    tone === 'accent'
      ? 'bg-brand-accent'
      : tone === 'livre'
        ? 'bg-status-livre'
        : 'bg-surface-3'

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex-1 text-fg-muted">{label}</span>

        <div className="flex items-center gap-3 font-bold tabular-nums">
          <span className="w-[90px] text-right text-fg">
            {value}
          </span>

          <span className="w-[52px] text-right text-fg-muted">
            {pct.toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className={`h-full ${barTone}`}
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
    </div>
  )
}