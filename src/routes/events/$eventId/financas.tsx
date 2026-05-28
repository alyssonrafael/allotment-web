import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { Banknote, ChevronLeft, ChevronRight, CheckCircle2, TrendingUp } from 'lucide-react'
import { useEventQuery } from '#/hooks/useEvents'
import { useAllotmentsQuery } from '#/hooks/useAllotments'
import { Card } from '#/components/ui/card'
import { Skeleton } from '#/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { StatusBadge } from '#/components/shared/StatusBadge'
import { KPI } from '#/components/shared/KPI'
import { fmtBRL, fmtBRLcompact } from '#/lib/format'
import { cn } from '#/lib/utils'
import type { Allotment, AllotmentStatus } from '#/types'

export const Route = createFileRoute('/events/$eventId/financas')({
  component: FinancasScreen,
})

// ── helpers ────────────────────────────────────────────────────────────────

function computeByStatus(list: Allotment[], s: AllotmentStatus) {
  const items = list.filter((a) => a.status === s)
  return {
    count:   items.length,
    area:    items.reduce((acc, a) => acc + a.width * a.height, 0),
    revenue: items.reduce((acc, a) => acc + a.price, 0),
  }
}

type SortKey = 'price' | 'area' | 'status'
const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: 'price',  label: 'Preço' },
  { key: 'area',   label: 'Dimensão' },
  { key: 'status', label: 'Status' },
]
const STATUS_ORDER: Record<AllotmentStatus, number> = {
  SOLD: 0, RESERVED: 1, AVAILABLE: 2, BLOCKED: 3,
}
const BAR_COLOR: Record<AllotmentStatus, string> = {
  AVAILABLE: 'bg-status-livre',
  RESERVED:  'bg-status-reservado',
  SOLD:      'bg-status-vendido',
  BLOCKED:   'bg-status-bloqueado',
}
const DOT_COLOR: Record<AllotmentStatus, string> = {
  AVAILABLE: 'bg-status-livre',
  RESERVED:  'bg-status-reservado',
  SOLD:      'bg-status-vendido',
  BLOCKED:   'bg-status-bloqueado',
}

const PAGE_SIZE = 8

// ── screen ─────────────────────────────────────────────────────────────────

function FinancasScreen() {
  const { eventId }  = Route.useParams()
  const event        = useEventQuery(eventId)
  const allotments   = useAllotmentsQuery(eventId)

  const [sortKey, setSortKey] = useState<SortKey>('price')
  const [page, setPage]       = useState(0)

  const list = allotments.data ?? []

  const available = computeByStatus(list, 'AVAILABLE')
  const reserved  = computeByStatus(list, 'RESERVED')
  const sold      = computeByStatus(list, 'SOLD')
  const blocked   = computeByStatus(list, 'BLOCKED')

  const potential       = list.reduce((acc, a) => acc + a.price, 0)
  const committed       = reserved.revenue + sold.revenue
  const realized        = sold.revenue
  const committedPct    = potential > 0 ? Math.round((committed / potential) * 100) : 0
  const totalCanvasArea = event.data ? event.data.canvasWidth * event.data.canvasHeight : 0
  const totalStandArea  = available.area + reserved.area + sold.area + blocked.area
  const revenuePerM2    = totalCanvasArea > 0 ? Math.round(potential / totalCanvasArea) : 0
  const isLoading = event.isLoading || allotments.isLoading

  const sorted = useMemo(() => {
    return [...list].sort((a, b) => {
      if (sortKey === 'price') return b.price - a.price
      if (sortKey === 'area')  return b.width * b.height - a.width * a.height
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    })
  }, [list, sortKey])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages - 1)
  const visible    = sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  function handleSort(key: SortKey) { setSortKey(key); setPage(0) }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out flex flex-col gap-5">

      {/* ── Seção 1: KPIs ─────────────────────────────────────────── */}
      <section className="grid gap-3 sm:grid-cols-3">
        {isLoading ? (
          <>
            <Skeleton className="h-[124px] rounded-xl" />
            <Skeleton className="h-[124px] rounded-xl" />
            <Skeleton className="h-[124px] rounded-xl" />
          </>
        ) : (
          <>
            <KPI
              label="Potencial Total"
              value={fmtBRLcompact(potential)}
              icon={Banknote}
              iconTone="primary"
              subline="Soma de todos os stands cadastrados"
            />
            <KPI
              label="Comprometido"
              value={fmtBRLcompact(committed)}
              icon={TrendingUp}
              iconTone="accent"
              subline={
                <span className="text-status-livre">↑ {committedPct}% do total</span>
              }
            />
            <KPI
              label="Realizado"
              value={fmtBRLcompact(realized)}
              icon={CheckCircle2}
              iconTone="violet"
              subline="Apenas vendas confirmadas"
            />
          </>
        )}
      </section>

      {/* ── Seção 2: Receita + Área ────────────────────────────────── */}
      <section className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        {isLoading ? (
          <>
            <Skeleton className="h-52 rounded-xl" />
            <Skeleton className="h-52 rounded-xl" />
          </>
        ) : (
          <>
            {/* Card esquerdo — Receita por status */}
            <Card className="p-5">
              <h3 className="text-h2">Receita por status</h3>

              {/* Stacked bar */}
              <div className="mt-4">
                <div className="flex h-3 overflow-hidden rounded-full bg-surface-2">
                  {potential > 0 ? (
                    <>
                      {available.revenue > 0 && (
                        <div
                          className="bg-status-livre"
                          style={{ width: `${(available.revenue / potential) * 100}%` }}
                        />
                      )}
                      {reserved.revenue > 0 && (
                        <div
                          className="bg-status-reservado"
                          style={{ width: `${(reserved.revenue / potential) * 100}%` }}
                        />
                      )}
                      {sold.revenue > 0 && (
                        <div
                          className="bg-status-vendido"
                          style={{ width: `${(sold.revenue / potential) * 100}%` }}
                        />
                      )}
                      {blocked.revenue > 0 && (
                        <div
                          className="bg-status-bloqueado"
                          style={{ width: `${(blocked.revenue / potential) * 100}%` }}
                        />
                      )}
                    </>
                  ) : (
                    <div className="h-full w-full bg-surface-3" />
                  )}
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] text-fg-subtle">
                  <span>R$ 0</span>
                  <span>Total cadastrado: <span className="font-semibold text-fg">{fmtBRLcompact(potential)}</span></span>
                </div>
              </div>

              {/* Mini-cards 2×2 */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                {(
                  [
                    { label: 'Livre',     stats: available, dot: 'bg-status-livre' },
                    { label: 'Reservado', stats: reserved,  dot: 'bg-status-reservado' },
                    { label: 'Vendido',   stats: sold,      dot: 'bg-status-vendido' },
                    { label: 'Bloqueado', stats: blocked,   dot: 'bg-status-bloqueado' },
                  ] as const
                ).map((row) => (
                  <div key={row.label} className="rounded-lg bg-surface-2 p-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`size-2 rounded-full ${row.dot}`} />
                      <span className="text-[11px] text-fg-muted">{row.label}</span>
                    </div>
                    <div className="mt-1 text-[16px] font-extrabold tabular-nums text-fg">
                      {fmtBRLcompact(row.stats.revenue)}
                    </div>
                    <div className="mt-0.5 text-[11px] text-fg-subtle">
                      {row.stats.count} stand{row.stats.count !== 1 ? 's' : ''} · {row.stats.area}m²
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Card direito — Distribuição por área */}
            <Card className="p-5">
              <h3 className="text-h2">Distribuição por área</h3>
              <div className="mt-4 space-y-4">
                {(
                  [
                    { status: 'AVAILABLE' as AllotmentStatus, label: 'Livre',     stats: available },
                    { status: 'RESERVED'  as AllotmentStatus, label: 'Reservado', stats: reserved },
                    { status: 'SOLD'      as AllotmentStatus, label: 'Vendido',   stats: sold },
                    { status: 'BLOCKED'   as AllotmentStatus, label: 'Bloqueado', stats: blocked },
                  ]
                ).map((row) => {
                  const pct = totalStandArea > 0
                    ? (row.stats.area / totalStandArea) * 100
                    : 0
                  return (
                    <div key={row.label}>
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="flex items-center gap-2 text-fg-muted">
                          <span className={`size-2 rounded-full ${DOT_COLOR[row.status]}`} />
                          {row.label}
                        </span>
                        <span className="tabular-nums text-fg">
                          <span className="font-bold">{row.stats.area}m²</span>
                          <span className="ml-2 text-fg-subtle">·  {pct.toFixed(1)}%</span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className={BAR_COLOR[row.status]}
                          style={{ width: `${Math.max(pct > 0 ? 2 : 0, pct)}%`, height: '100%' }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-5 flex items-end justify-between border-t border-border pt-4">
                <div>
                  <p className="text-caption text-fg-subtle">PAVILHÃO TOTAL</p>
                  <p className="mt-0.5 text-[22px] font-extrabold tabular-nums text-fg">
                    {totalCanvasArea > 0 ? totalCanvasArea : '—'} <span className="text-[14px] font-bold text-fg-muted">m²</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-caption text-fg-subtle">RECEITA / M²</p>
                  <p className="mt-0.5 text-[22px] font-extrabold tabular-nums text-brand-primary">
                    {revenuePerM2 > 0 ? `R$ ${revenuePerM2}` : '—'}
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}
      </section>

      {/* ── Seção 3: Contribuição por stand ──────────────────────── */}
      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-h2">Contribuição por stand</h3>
          <div className="flex items-center gap-1.5">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => handleSort(opt.key)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors',
                  sortKey === opt.key
                    ? 'bg-brand-primary text-white'
                    : 'bg-surface-2 text-fg-muted hover:bg-surface-3 hover:text-fg',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="p-5">
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Stand</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dim.</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="w-[200px]">% do total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-16 text-center text-sm text-fg-muted">
                      Nenhum stand cadastrado para este evento.
                    </TableCell>
                  </TableRow>
                )}
                {visible.map((a) => {
                  const pct = potential > 0 ? (a.price / potential) * 100 : 0
                  return (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="font-mono text-[12px] font-semibold text-brand-primary">
                          {a.code}
                        </div>
                        <div className="text-[13px] font-semibold text-fg">{a.name}</div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={a.status} />
                      </TableCell>
                      <TableCell className="text-fg-muted">
                        {a.width}×{a.height}m
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums">
                        {fmtBRL(a.price)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                            <div
                              className={BAR_COLOR[a.status]}
                              style={{ width: `${Math.max(pct > 0 ? 2 : 0, pct)}%`, height: '100%' }}
                            />
                          </div>
                          <span className="w-10 shrink-0 text-right text-[12px] tabular-nums text-fg-muted">
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <span className="text-[11px] text-fg-subtle">
                  {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, sorted.length)} de{' '}
                  {sorted.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={safePage === 0}
                    className="flex size-7 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={cn(
                        'flex size-7 items-center justify-center rounded-md text-[12px] font-semibold transition-colors',
                        i === safePage
                          ? 'bg-brand-primary text-white'
                          : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={safePage === totalPages - 1}
                    className="flex size-7 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
