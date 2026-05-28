import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Map, Pencil, Search, Trash2 } from 'lucide-react'
import { useAllotmentsQuery, useDeleteAllotment, useUpdateAllotment } from '#/hooks/useAllotments'
import { Button } from '#/components/ui/button'
import { Card } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Skeleton } from '#/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#/components/ui/alert-dialog'
import { StatusBadge } from '#/components/shared/StatusBadge'
import { fmtBRL } from '#/lib/format'
import { cn } from '#/lib/utils'
import type { Allotment, AllotmentStatus } from '#/types'

export const Route = createFileRoute('/events/$eventId/stands')({
  component: StandsScreen,
})

const STATUS_FILTERS: Array<{ label: string; value: AllotmentStatus | null }> = [
  { label: 'Todos',     value: null },
  { label: 'Livre',     value: 'AVAILABLE' },
  { label: 'Reservado', value: 'RESERVED' },
  { label: 'Vendido',   value: 'SOLD' },
  { label: 'Bloqueado', value: 'BLOCKED' },
]

const PAGE_SIZE = 10

function StandsScreen() {
  const { eventId } = Route.useParams()
  const { data, isLoading } = useAllotmentsQuery(eventId)
  const updateMutation = useUpdateAllotment(eventId)
  const deleteMutation = useDeleteAllotment(eventId)

  const [search, setSearch]         = useState('')
  const [statusFilter, setStatus]   = useState<AllotmentStatus | null>(null)
  const [page, setPage]             = useState(0)
  const [editing, setEditing]       = useState<Allotment | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const list = data ?? []

  const counts: Record<AllotmentStatus, number> = { AVAILABLE: 0, RESERVED: 0, SOLD: 0, BLOCKED: 0 }
  for (const a of list) counts[a.status]++

  const filtered = list.filter((a) => {
    const matchesStatus = statusFilter == null || a.status === statusFilter
    const q = search.toLowerCase()
    const matchesSearch = !q || a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages - 1)
  const visible    = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  function handleSearch(value: string) { setSearch(value); setPage(0) }
  function handleFilter(value: AllotmentStatus | null) { setStatus(value); setPage(0) }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out flex flex-col gap-4">
      {/* ── Filter bar ────────────────────────────────────────────── */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {/* Input de Busca */}
          <div className="relative shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" />
            <Input
              className="w-full pl-9 sm:w-60"
              placeholder="Buscar por código ou nome…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* Divisor */}
          <div className="hidden h-5 w-px shrink-0 bg-border sm:block" />

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2 sm:flex-1 sm:flex-nowrap sm:overflow-x-auto sm:overflow-y-hidden">
            {STATUS_FILTERS.map((f) => {
              const count = f.value === null ? list.length : counts[f.value]
              const active = statusFilter === f.value
              return (
                <button
                  key={f.label}
                  onClick={() => handleFilter(f.value)}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors',
                    active
                      ? 'bg-brand-primary text-white'
                      : 'bg-surface-2 text-fg-muted hover:bg-surface-3 hover:text-fg',
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[11px] font-bold',
                      active ? 'bg-white/25 text-white' : 'bg-surface-3 text-fg-subtle',
                    )}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </Card>

      {/* ── Table ─────────────────────────────────────────────────── */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[130px]">Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Dimensões</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead className="w-[96px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center text-sm text-fg-muted">
                  {search || statusFilter
                    ? 'Nenhum stand encontrado com os filtros aplicados.'
                    : 'Nenhum stand cadastrado para este evento.'}
                </TableCell>
              </TableRow>
            )}

            {visible.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-mono text-[13px] font-semibold text-brand-primary">
                  {a.code}
                </TableCell>
                <TableCell className="font-semibold">{a.name}</TableCell>
                <TableCell className="text-fg-muted">
                  {a.width}×{a.height}m · {a.width * a.height}m²
                </TableCell>
                <TableCell>
                  <StatusBadge status={a.status} />
                </TableCell>
                <TableCell className="text-right font-bold tabular-nums">
                  {fmtBRL(a.price)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-0.5">
                    <Link
                      to="/events/$eventId/pavilhao"
                      params={{ eventId }}
                      search={{ standId: a.id }}
                      className="flex size-7 items-center justify-center rounded-md text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
                    >
                      <Map size={14} />
                    </Link>
                    <button
                      onClick={() => setEditing(a)}
                      className="flex size-7 items-center justify-center rounded-md text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeletingId(a.id)}
                      className="flex size-7 items-center justify-center rounded-md text-fg-subtle transition-colors hover:bg-red-300 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>

        {/* ── Pagination ────────────────────────────────────────────── */}
        {!isLoading && totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
            <span className="text-[11px] text-fg-subtle">
              {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} de{' '}
              {filtered.length}
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
      </Card>

      {/* ── Edit Dialog ───────────────────────────────────────────── */}
      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          {editing && (
            <EditForm
              key={editing.id}
              allotment={editing}
              isPending={updateMutation.isPending}
              onClose={() => setEditing(null)}
              onSave={(name, price) =>
                updateMutation.mutate(
                  { id: editing.id, payload: { name, price } },
                  { onSuccess: () => setEditing(null) },
                )
              }
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ────────────────────────────────────────── */}
      <AlertDialog
        open={Boolean(deletingId)}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir stand</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O stand será removido permanentemente do evento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={() => {
                if (!deletingId) return
                deleteMutation.mutate(deletingId, { onSuccess: () => setDeletingId(null) })
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function EditForm({
  allotment,
  isPending,
  onClose,
  onSave,
}: {
  allotment: Allotment
  isPending: boolean
  onClose: () => void
  onSave: (name: string, price: number) => void
}) {
  const [name,  setName]  = useState(allotment.name)
  const [price, setPrice] = useState(allotment.price.toString())

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          Editar stand{' '}
          <span className="font-mono text-brand-primary">{allotment.code}</span>
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-1.5">
          <Label>Código</Label>
          <Input value={allotment.code} disabled className="font-mono opacity-60" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-name">Nome</Label>
          <Input
            id="edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do stand"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-price">Valor (R$)</Label>
          <Input
            id="edit-price"
            type="number"
            min={0}
            step={0.01}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0,00"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button
          disabled={isPending || !name.trim()}
          onClick={() => onSave(name.trim(), Number(price))}
          className="bg-brand-primary text-primary-foreground hover:bg-brand-primary/90"
        >
          {isPending ? 'Salvando…' : 'Salvar'}
        </Button>
      </DialogFooter>
    </>
  )
}
