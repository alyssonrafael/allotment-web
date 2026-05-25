import { createFileRoute } from '@tanstack/react-router'
import { Plus, Search } from 'lucide-react'
import { useAllotmentsQuery } from '#/hooks/useAllotments'
import { Button } from '#/components/ui/button'
import { Card } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
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
import { fmtBRL } from '#/lib/format'

export const Route = createFileRoute('/events/$eventId/stands')({
  component: StandsScreen,
})

function StandsScreen() {
  const { eventId } = Route.useParams()
  const { data, isLoading } = useAllotmentsQuery(eventId)

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out flex flex-col gap-4">
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <div className="relative">
          <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-fg-subtle" />
          <Input className="w-[260px] pl-9" placeholder="Buscar por nome ou código" />
        </div>
        <Button variant="outline" size="sm">Todos</Button>
        <Button variant="outline" size="sm">Livre</Button>
        <Button variant="outline" size="sm">Reservado</Button>
        <Button variant="outline" size="sm">Vendido</Button>
        <Button variant="outline" size="sm">Bloqueado</Button>
        <Button className="ml-auto bg-brand-primary text-primary-foreground hover:bg-brand-primary/90">
          <Plus size={14} /> Novo stand
        </Button>
      </Card>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Dimensões</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Preço</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <>
                {Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              </>
            )}
            {data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-fg-subtle">
                  Nenhum stand cadastrado para este evento.
                </TableCell>
              </TableRow>
            )}
            {data?.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="text-mono">{a.code}</TableCell>
                <TableCell className="font-semibold">{a.name}</TableCell>
                <TableCell className="text-fg-muted">
                  {a.width} × {a.height} m
                </TableCell>
                <TableCell>
                  <StatusBadge status={a.status} />
                </TableCell>
                <TableCell className="text-right font-bold">{fmtBRL(a.price)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
