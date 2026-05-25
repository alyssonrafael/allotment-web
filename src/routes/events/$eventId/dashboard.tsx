import { createFileRoute } from '@tanstack/react-router'
import { Activity, ChartPie, Map, Wallet } from 'lucide-react'
import { useEventQuery } from '#/hooks/useEvents'
import { useAllotmentsQuery } from '#/hooks/useAllotments'
import { Card } from '#/components/ui/card'
import { Skeleton } from '#/components/ui/skeleton'
import { KPI } from '#/components/shared/KPI'
import { fmtBRLcompact } from '#/lib/format'
import type { AllotmentStatus } from '#/types'

export const Route = createFileRoute('/events/$eventId/dashboard')({
  component: DashboardScreen,
})

function DashboardScreen() {
  const { eventId } = Route.useParams()
  const event = useEventQuery(eventId)
  const allotments = useAllotmentsQuery(eventId)

  const list = allotments.data ?? []
  const counts = countByStatus(list)
  const totalArea = event.data ? event.data.canvasWidth * event.data.canvasHeight : 0
  const occupiedArea = list.reduce((acc, a) => acc + a.width * a.height, 0)
  const occupancy = totalArea > 0 ? (occupiedArea / totalArea) * 100 : 0
  const revenuePotential = list.reduce((acc, a) => acc + a.price, 0)
  const revenueCommitted = list
    .filter((a) => a.status === 'RESERVED' || a.status === 'SOLD')
    .reduce((acc, a) => acc + a.price, 0)
  const revenueRealized = list
    .filter((a) => a.status === 'SOLD')
    .reduce((acc, a) => acc + a.price, 0)

  const isLoading = event.isLoading || allotments.isLoading

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out flex flex-col gap-5">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <Skeleton className="h-[124px] rounded-xl" />
            <Skeleton className="h-[124px] rounded-xl" />
            <Skeleton className="h-[124px] rounded-xl" />
            <Skeleton className="h-[124px] rounded-xl" />
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
              value={fmtBRLcompact(revenueCommitted)}
              icon={Wallet}
              iconTone="accent"
              subline={`Realizada: ${fmtBRLcompact(revenueRealized)}`}
            />
            <KPI
              label="Controle comercial"
              value={`${counts.SOLD}/${counts.SOLD + counts.RESERVED || 0}`}
              icon={ChartPie}
              iconTone="violet"
              subline={`Vendidos · Reservados ${counts.RESERVED}`}
            />
            <KPI
              label="Distribuição"
              value={String(list.length)}
              icon={Activity}
              iconTone="livre"
              subline={`Livre ${counts.AVAILABLE} · Bloqueados ${counts.BLOCKED}`}
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
              <div className="text-display">{list.length}</div>
              <div className="text-caption">Stands</div>
            </div>
          </div>
          <ul className="mt-5 space-y-2 text-[13px]">
            <LegendRow label="Livre" count={counts.AVAILABLE} total={list.length} dot="bg-status-livre" />
            <LegendRow label="Reservado" count={counts.RESERVED} total={list.length} dot="bg-status-reservado" />
            <LegendRow label="Vendido" count={counts.SOLD} total={list.length} dot="bg-status-vendido" />
            <LegendRow label="Bloqueado" count={counts.BLOCKED} total={list.length} dot="bg-status-bloqueado" />
          </ul>
        </Card>

        <Card className="p-5">
          <h3 className="text-h2">Mapa de calor</h3>
          <div className="mt-1 text-[12px] text-fg-muted">
            Visão por status — {event.data?.canvasWidth ?? '—'} × {event.data?.canvasHeight ?? '—'} m
          </div>
          <div className="mt-4 flex h-[220px] items-center justify-center rounded-md border border-dashed border-border text-[12px] text-fg-subtle">
            Mapa de calor — implementação futura
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-h2">Previsão financeira</h3>
          <div className="mt-4 space-y-3 text-[13px]">
            <FinanceRow label="Potencial" value={fmtBRLcompact(revenuePotential)} tone="muted" />
            <FinanceRow label="Previsto" value={fmtBRLcompact(revenueCommitted)} tone="accent" />
            <FinanceRow label="Realizado" value={fmtBRLcompact(revenueRealized)} tone="livre" />
          </div>
        </Card>
      </section>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-h2">Atividade recente</h3>
          <span className="text-[11px] text-fg-subtle">Últimas 24h</span>
        </div>
        <div className="mt-4 text-[13px] text-fg-muted">Sem atividades recentes.</div>
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

function FinanceRow({ label, value, tone }: { label: string; value: string; tone: 'muted' | 'accent' | 'livre' }) {
  const barTone =
    tone === 'accent' ? 'bg-brand-accent' : tone === 'livre' ? 'bg-status-livre' : 'bg-surface-3'
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-fg-muted">{label}</span>
        <span className="font-bold text-fg">{value}</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div className={`h-full w-2/3 ${barTone}`} />
      </div>
    </div>
  )
}
