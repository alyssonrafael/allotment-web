import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertTriangle, CalendarDays, LayoutGrid, MessageSquare, Ruler, Tag } from 'lucide-react'
import { useParseEvent } from '#/hooks/useAI'
import { useAIChat } from '#/hooks/useAIChat'
import { useCreateEvent, eventsKeys } from '#/hooks/useEvents'
import { allotmentsKeys } from '#/hooks/useAllotments'
import { createAllotment } from '#/api/allotments'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { Button } from '#/components/ui/button'
import { Progress } from '#/components/ui/progress'
import { AIPromptInput } from './AIPromptInput'
import { ChatMessages } from './ChatMessages'
import { LayoutPreview } from './LayoutPreview'
import { EVENT_TYPE_LABEL } from '#/lib/constants'
import { fmtDateRange } from '#/lib/format'
import { getApiErrorMessage } from '#/lib/apiError'
import type { AIMessage, ParseEventComplete } from '#/types'

interface EventAIDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  venueId: string
  venueName: string
  venueWidth: number
  venueHeight: number
}

const BATCH_CHUNK = 10

const EMPTY_HINT =
  'Descreva o evento e os stands (tipos, quantidades e corredores). Eu pergunto se faltar algo.'

const SUGGESTIONS = [
  '10 stands 2x2 e 20 stands 3x3, corredores de 2m',
  'Feira de Tecnologia de 10 a 15 de maio de 2026, 30 stands de 3x3',
  'Congresso com 40 stands iguais de 3x3 em fileiras, corredor central de 4m',
]

// Resumo que vira bolha da IA ao completar — dá contexto para ajustes seguintes.
function summarizeEvent(r: ParseEventComplete): string {
  const e = r.event
  return `Pronto! ${e.name} (${EVENT_TYPE_LABEL[e.type]}, ${fmtDateRange(e.startDate, e.endDate)}) com ${r.summary.placed} stands. Revise ao lado e confirme — ou me diga o que ajustar.`
}

export function EventAIDialog({
  open,
  onOpenChange,
  venueId,
  venueName,
  venueWidth,
  venueHeight,
}: EventAIDialogProps) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const parse = useParseEvent()
  const createEvent = useCreateEvent()

  const call = useCallback(
    (prompt: string, history: AIMessage[]) =>
      parse.mutateAsync({ prompt, venueId, canvasWidth: venueWidth, canvasHeight: venueHeight, history }),
    [parse, venueId, venueWidth, venueHeight],
  )
  const chat = useAIChat<ParseEventComplete>(call, summarizeEvent)

  const [input, setInput] = useState('')
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [view, setView] = useState<'chat' | 'preview'>('chat')
  const [focusTrigger, setFocusTrigger] = useState(0)

  const isCreating = progress !== null || createEvent.isPending

  useEffect(() => {
    if (chat.phase === 'complete') {
      setView('preview')
    } else if (chat.phase === 'chatting' && view === 'chat') {
      setFocusTrigger((n) => n + 1)
    }
  }, [chat.phase])

  function handleSend() {
    chat.send(input)
    setInput('')
  }

  // "Ajustar": volta ao chat mantendo o contexto e sem perder o mapa.
  function handleAdjust() {
    chat.resume()
    setView('chat')
    setInput('')
  }

  function resetAll() {
    chat.reset()
    setInput('')
    setView('chat')
    setProgress(null)
  }

  function handleOpenChange(next: boolean) {
    if (isCreating) return
    if (!next) resetAll()
    onOpenChange(next)
  }

  async function handleConfirm() {
    const result = chat.complete
    if (!result || result.summary.placed === 0) return
    try {
      const event = await createEvent.mutateAsync({ ...result.event, venueId })

      const items = result.allotments
      let done = 0
      let failed = 0
      setProgress({ done: 0, total: items.length })

      for (let i = 0; i < items.length; i += BATCH_CHUNK) {
        const chunk = items.slice(i, i + BATCH_CHUNK)
        const settled = await Promise.allSettled(
          chunk.map((a) =>
            createAllotment(event.id, {
              name: a.name,
              code: a.code,
              x: a.x,
              y: a.y,
              width: a.width,
              height: a.height,
              status: a.status,
              price: a.price,
            }),
          ),
        )
        failed += settled.filter((s) => s.status === 'rejected').length
        done += chunk.length
        setProgress({ done, total: items.length })
      }

      await qc.invalidateQueries({ queryKey: allotmentsKeys.byEvent(event.id) })
      await qc.invalidateQueries({ queryKey: eventsKeys.all })
      qc.invalidateQueries({ queryKey: eventsKeys.revenue(event.id) })

      const created = items.length - failed
      toast.success(`Evento criado com ${created} stands`, {
        description: failed > 0 ? `${failed} stands não puderam ser criados.` : event.name,
      })
      onOpenChange(false)
      resetAll()
      navigate({
        to: '/events/$eventId/pavilhao',
        params: { eventId: event.id },
        search: { standId: undefined },
      })
    } catch (err) {
      setProgress(null)
      toast.error('Não foi possível criar o evento', {
        description: getApiErrorMessage(err),
      })
    }
  }

  const result = chat.complete
  const ev = result?.event
  const s = result?.summary
  const noneFit = s?.placed === 0
  const showPreview = view === 'preview' && result

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Gerar evento com IA</SheetTitle>
          <SheetDescription>
            Converse para montar o evento e o layout de stands em {venueName} (
            {venueWidth}×{venueHeight}m). Você revisa antes de criar.
          </SheetDescription>
        </SheetHeader>

        {!showPreview ? (
          <>
            <ChatMessages
              messages={chat.messages}
              loading={chat.phase === 'loading'}
              emptyHint={EMPTY_HINT}
              suggestions={SUGGESTIONS}
              onPickSuggestion={(text) => chat.send(text)}
            />
            <SheetFooter className="flex-col gap-2 border-t border-border">
              {result && (
                <button
                  type="button"
                  onClick={() => setView('preview')}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface-2 py-2 text-[12.5px] font-semibold text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg"
                >
                  <LayoutGrid size={13} />
                  Ver mapa e resultado
                </button>
              )}
              <AIPromptInput
                value={input}
                onChange={setInput}
                onSubmit={handleSend}
                isLoading={chat.phase === 'loading'}
                placeholder="Escreva sua mensagem…"
                minLength={chat.messages.length === 0 ? 10 : 1}
                focusTrigger={focusTrigger}
              />
            </SheetFooter>
          </>
        ) : (
          <>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
              {/* Informações do evento — acima do mapa, pra ver como será criado */}
              <div className="flex flex-col gap-1 rounded-xl border border-border p-3">
                <div className="text-[15px] font-extrabold text-fg">{ev!.name}</div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-fg-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <Tag size={12} />
                    {EVENT_TYPE_LABEL[ev!.type]}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={12} />
                    {fmtDateRange(ev!.startDate, ev!.endDate)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Ruler size={12} />
                    {ev!.canvasWidth}×{ev!.canvasHeight}m
                  </span>
                </div>
              </div>

              <LayoutPreview
                canvasWidth={ev!.canvasWidth}
                canvasHeight={ev!.canvasHeight}
                allotments={result.allotments}
              />

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-fg-muted">
                <span>
                  <strong className="text-fg">{s!.placed}</strong> de {s!.total} stands posicionados
                </span>
                {s!.discarded > 0 && (
                  <span className="text-amber-600 dark:text-amber-400">
                    {s!.discarded} descartados (sem espaço)
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {s!.groups.map((g, i) => (
                  <span
                    key={i}
                    className="rounded-md bg-surface-2 px-2 py-1 text-[11px] font-semibold text-fg-muted"
                  >
                    {g.placed}× {g.width}×{g.height}m
                  </span>
                ))}
              </div>

              {result.warnings.length > 0 && (
                <div className="mt-3 flex gap-2 rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-[12px] text-amber-700 dark:text-amber-300">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <ul className="flex flex-col gap-0.5">
                    {result.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {noneFit && (
                <div className="mt-3 rounded-lg border border-red-400/40 bg-red-400/10 p-3 text-[12px] text-red-600 dark:text-red-400">
                  Nenhum stand coube no canvas. Ajuste o pedido (menos stands, tamanhos
                  menores ou corredores mais estreitos).
                </div>
              )}

              {progress && (
                <div className="mt-3 flex flex-col gap-1.5">
                  <Progress value={(progress.done / progress.total) * 100} />
                  <span className="text-[11px] text-fg-subtle tabular-nums">
                    Criando stands… {progress.done}/{progress.total}
                  </span>
                </div>
              )}
            </div>

            <SheetFooter className="flex-row items-center justify-end border-t border-border">
              <Button
                variant="ghost"
                onClick={handleAdjust}
                disabled={isCreating}
                className="mr-auto"
              >
                <MessageSquare size={14} />
                Ajustar
              </Button>
              <Button onClick={handleConfirm} disabled={isCreating || noneFit}>
                {isCreating ? 'Criando…' : 'Confirmar e criar stands'}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
