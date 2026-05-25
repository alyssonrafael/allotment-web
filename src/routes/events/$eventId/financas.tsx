import { createFileRoute } from '@tanstack/react-router'
import { useEventQuery } from '#/hooks/useEvents'
import { useAllotmentsQuery } from '#/hooks/useAllotments'
import { Card } from '#/components/ui/card'
import { Skeleton } from '#/components/ui/skeleton'
import { StatusBadge } from '#/components/shared/StatusBadge'
import { KPI } from '#/components/shared/KPI'
import { fmtBRL, fmtBRLcompact } from '#/lib/format'
import { Banknote, ChartBar, Goal, Target } from 'lucide-react'

export const Route = createFileRoute('/events/$eventId/financas')({
  component: FinancasScreen,
})

function FinancasScreen() {
  const { eventId } = Route.useParams()
  const event = useEventQuery(eventId)
  const allotments = useAllotmentsQuery(eventId)
  const list = allotments.data ?? []

  const potential = list.reduce((acc, a) => acc + a.price, 0)
  const committed = list
    .filter((a) => a.status === 'RESERVED' || a.status === 'SOLD')
    .reduce((acc, a) => acc + a.price, 0)
  const realized = list
    .filter((a) => a.status === 'SOLD')
    .reduce((acc, a) => acc + a.price, 0)
  const goal = 200_000

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
            <KPI label="Potencial" value={fmtBRLcompact(potential)} icon={Banknote} iconTone="primary" />
            <KPI label="Comprometido" value={fmtBRLcompact(committed)} icon={Target} iconTone="accent" />
            <KPI label="Realizado" value={fmtBRLcompact(realized)} icon={ChartBar} iconTone="violet" />
            <KPI
              label="Meta atingida"
              value={`${Math.round((realized / goal) * 100) || 0}%`}
              icon={Goal}
              iconTone="livre"
              subline={`Meta: ${fmtBRLcompact(goal)}`}
            />
          </>
        )}
      </section>

      <Card className="p-5">
        <h3 className="text-h2">Projeção por stand</h3>
        <div className="mt-4 space-y-2 text-[13px]">
          {isLoading && <Skeleton className="h-32 w-full" />}
          {!isLoading && list.length === 0 && (
            <div className="text-[12px] text-fg-subtle">Sem stands para projetar receita.</div>
          )}
          {list.map((a) => {
            const pct = potential > 0 ? (a.price / potential) * 100 : 0
            return (
              <div key={a.id} className="flex items-center gap-3">
                <span className="text-mono w-14">{a.code}</span>
                <span className="flex-1 truncate font-semibold">{a.name}</span>
                <StatusBadge status={a.status} />
                <span className="w-24 text-right font-bold">{fmtBRL(a.price)}</span>
                <div className="h-1.5 w-28 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full bg-brand-primary" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
