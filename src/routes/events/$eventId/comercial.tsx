import { createFileRoute } from '@tanstack/react-router'
import { useAllotmentsQuery } from '#/hooks/useAllotments'
import { Card } from '#/components/ui/card'
import { Skeleton } from '#/components/ui/skeleton'
import { StatusBadge } from '#/components/shared/StatusBadge'
import { fmtBRLcompact } from '#/lib/format'
import { STATUS_LABELS } from '#/lib/constants'
import type { Allotment, AllotmentStatus } from '#/types'

export const Route = createFileRoute('/events/$eventId/comercial')({
  component: ComercialScreen,
})

const COLUMNS: Array<AllotmentStatus> = ['AVAILABLE', 'RESERVED', 'SOLD', 'BLOCKED']

function ComercialScreen() {
  const { eventId } = Route.useParams()
  const { data, isLoading } = useAllotmentsQuery(eventId)
  const list = data ?? []

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
      {COLUMNS.map((status) => {
        const items = list.filter((a) => a.status === status)
        const total = items.reduce((acc, a) => acc + a.price, 0)
        return (
          <Card key={status} className="flex flex-col p-4">
            <div className="flex items-center justify-between">
              <StatusBadge status={status} />
              <span className="text-[11px] text-fg-subtle">{items.length}</span>
            </div>
            <div className="mt-2 text-[13px] font-bold text-fg">{fmtBRLcompact(total)}</div>
            <div className="mt-4 flex flex-1 flex-col gap-2">
              {isLoading && <Skeleton className="h-16 w-full" />}
              {!isLoading && items.length === 0 && (
                <div className="rounded-md border border-dashed border-border p-3 text-center text-[11.5px] text-fg-subtle">
                  Sem stands
                </div>
              )}
              {items.map((a) => (
                <StandCard key={a.id} a={a} />
              ))}
            </div>
            <div className="mt-3 text-[11px] text-fg-subtle">{STATUS_LABELS[status]}</div>
          </Card>
        )
      })}
    </div>
  )
}

function StandCard({ a }: { a: Allotment }) {
  return (
    <div className="rounded-md border border-border bg-card p-3 transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-mono">{a.code}</span>
        <span className="text-[11px] text-fg-subtle">
          {a.width}×{a.height}m
        </span>
      </div>
      <div className="mt-1 text-[13px] font-semibold">{a.name}</div>
      <div className="mt-2 text-[12px] font-bold text-fg">{fmtBRLcompact(a.price)}</div>
    </div>
  )
}
