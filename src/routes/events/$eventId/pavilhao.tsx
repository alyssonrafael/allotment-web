import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Download, Minus, Plus, Save, ZoomIn } from 'lucide-react'
import { useEventQuery } from '#/hooks/useEvents'
import { useAllotmentsQuery } from '#/hooks/useAllotments'
import { Button } from '#/components/ui/button'
import { Card } from '#/components/ui/card'
import { Skeleton } from '#/components/ui/skeleton'
import { useCanvasStore } from '#/stores/canvasStore'
import { cn } from '#/lib/utils.ts'

export const Route = createFileRoute('/events/$eventId/pavilhao')({
  validateSearch: (search: Record<string, unknown>) => ({
    standId: typeof search.standId === 'string' ? search.standId : undefined,
  }),
  component: PavilionEditorScreen,
})

const PRESETS = [
  { label: '3 × 3 m', w: 3, h: 3 },
  { label: '4 × 3 m', w: 4, h: 3 },
  { label: '6 × 4 m', w: 6, h: 4 },
  { label: '8 × 6 m', w: 8, h: 6 },
]

function PavilionEditorScreen() {
  const { eventId } = Route.useParams()
  const { standId } = Route.useSearch()
  const event = useEventQuery(eventId)
  const allotments = useAllotmentsQuery(eventId)
  const { snapEnabled, toggleSnap, zoom, setZoom, setSelected } = useCanvasStore()

  useEffect(() => {
    if (standId) setSelected(standId)
  }, [standId, setSelected])

  const isLoading = event.isLoading || allotments.isLoading

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out grid h-[calc(100vh-72px-3rem)] grid-cols-[1fr_340px] gap-4">
      <Card className="flex flex-col overflow-hidden p-0">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <span className="text-caption text-fg-subtle">Inserir</span>
          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-[12px] font-semibold text-fg-muted shadow-sm transition-colors hover:bg-surface-2 hover:text-fg"
              >
                <Plus size={12} />
                {p.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="inline-flex overflow-hidden rounded-full border border-border bg-surface-2 text-[12px] font-semibold">
              <button
                type="button"
                onClick={() => toggleSnap()}
                className={cn(
                  'px-3 py-1 transition-colors',
                  snapEnabled ? 'bg-card text-fg' : 'text-fg-muted',
                )}
              >
                Snap on
              </button>
              <button
                type="button"
                onClick={() => toggleSnap()}
                className={cn(
                  'px-3 py-1 transition-colors',
                  !snapEnabled ? 'bg-card text-fg' : 'text-fg-muted',
                )}
              >
                Livre
              </button>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1 text-[12px]">
              <button
                type="button"
                onClick={() => setZoom(zoom - 0.1)}
                className="inline-flex size-6 items-center justify-center rounded-full hover:bg-surface-2"
              >
                <Minus size={12} />
              </button>
              <span className="min-w-10 text-center font-semibold tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom(zoom + 0.1)}
                className="inline-flex size-6 items-center justify-center rounded-full hover:bg-surface-2"
              >
                <ZoomIn size={12} />
              </button>
            </div>
          </div>
        </div>

        <div className="relative flex-1 overflow-hidden bg-surface-2">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Skeleton className="h-3/4 w-3/4 rounded-md" />
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-fg-subtle">
              <div className="text-[12px] uppercase tracking-wider">Canvas Konva</div>
              <div className="mt-1 text-[13px]">
                {event.data
                  ? `${event.data.canvasWidth} × ${event.data.canvasHeight} m  ·  ${allotments.data?.length ?? 0} stands`
                  : 'Sem evento'}
              </div>
              <div className="mt-3 text-[12px] text-fg-muted">
                Implementação do drag & drop nos próximos sprints.
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-2 text-[12px] text-fg-muted">
          <span className="text-fg-subtle">Dicas:</span>
          <span className="kbd">Clique</span>
          seleciona
          <span className="kbd">Shift+Clique</span>
          múltipla
          <span className="kbd">Arrasta canvas</span>
          marquee
          <span className="kbd">⌘Z</span>
          desfaz
          <span className="kbd">Del</span>
          exclui
        </div>
      </Card>

      <Card className="flex flex-col p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-h2">Painel</h3>
          <Button variant="ghost" size="sm">
            <Save size={14} />
            Salvar
          </Button>
        </div>
        <p className="mt-2 text-[12px] text-fg-muted">
          Selecione um stand no canvas para editar dimensões, status e preço.
        </p>

        <div className="mt-5 flex flex-1 items-center justify-center rounded-md border border-dashed border-border text-[12px] text-fg-subtle">
          Nenhum stand selecionado
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span className="text-[11px] text-fg-subtle">Exportar</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download size={14} /> PNG
            </Button>
            <Button variant="outline" size="sm">
              <Download size={14} /> JSON
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
