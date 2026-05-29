import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { AlertTriangle, Building2, MapPin, MessageSquare, Ruler } from 'lucide-react'
import { useParseVenue } from '#/hooks/useAI'
import { useAIChat } from '#/hooks/useAIChat'
import { useCreateVenue } from '#/hooks/useVenues'
import { useCreateEvent } from '#/hooks/useEvents'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
import { AIPromptInput } from './AIPromptInput'
import { ChatMessages } from './ChatMessages'
import { EVENT_TYPE_LABEL } from '#/lib/constants'
import { fmtDateRange } from '#/lib/format'
import { getApiErrorMessage } from '#/lib/apiError'
import type { AIMessage, ParseVenueComplete } from '#/types'

interface VenueAIDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EMPTY_HINT =
  'Descreva o pavilhão: nome, cidade/estado, tamanho em metros e cor. Eu pergunto se faltar algo.'

const SUGGESTIONS = [
  'Pavilhão Expo Center em São Paulo, SP, 60x40m, tema azul',
  'Pavilhão médio em Curitiba, PR, tema verde',
  'Pavilhão grande no Rio de Janeiro, RJ, 80x50m e já cria uma feira em março de 2026',
]

// Resumo que vira bolha da IA ao completar — dá contexto para ajustes seguintes.
function summarizeVenue(r: ParseVenueComplete): string {
  const v = r.venue
  const base = `Pronto! ${v.name} em ${v.city}/${v.state}, ${v.width}×${v.height}m.`
  const ev = r.suggestedEvent
    ? ` Com o evento "${r.suggestedEvent.name}".`
    : ''
  return `${base}${ev} Revise ao lado e confirme — ou me diga o que ajustar.`
}

export function VenueAIDialog({ open, onOpenChange }: VenueAIDialogProps) {
  const navigate = useNavigate()
  const parse = useParseVenue()
  const createVenue = useCreateVenue()
  const createEvent = useCreateEvent()

  const call = useCallback(
    (prompt: string, history: AIMessage[]) => parse.mutateAsync({ prompt, history }),
    [parse],
  )
  const chat = useAIChat<ParseVenueComplete>(call, summarizeVenue)

  const [input, setInput] = useState('')
  const [createEventToo, setCreateEventToo] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [view, setView] = useState<'chat' | 'preview'>('chat')
  const [focusTrigger, setFocusTrigger] = useState(0)

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

  // "Ajustar": volta ao chat mantendo o contexto e sem perder o resultado.
  function handleAdjust() {
    chat.resume()
    setView('chat')
    setInput('')
  }

  function resetAll() {
    chat.reset()
    setInput('')
    setView('chat')
    setCreateEventToo(true)
  }

  function handleOpenChange(next: boolean) {
    if (isCreating) return
    if (!next) resetAll()
    onOpenChange(next)
  }

  async function handleConfirm() {
    const result = chat.complete
    if (!result) return
    setIsCreating(true)
    try {
      const v = result.venue
      const venue = await createVenue.mutateAsync({
        name: v.name,
        description: v.description ?? undefined,
        width: v.width,
        height: v.height,
        city: v.city,
        state: v.state,
        street: v.street ?? undefined,
        neighborhood: v.neighborhood ?? undefined,
        zipCode: v.zipCode ?? undefined,
        accent: v.accent,
        photo: v.photo,
      })

      if (result.suggestedEvent && createEventToo) {
        const event = await createEvent.mutateAsync({
          ...result.suggestedEvent,
          venueId: venue.id,
        })
        toast.success('Pavilhão e evento criados', {
          description: `${venue.name} · ${event.name}`,
        })
        onOpenChange(false)
        resetAll()
        navigate({ to: '/events/$eventId/dashboard', params: { eventId: event.id } })
        return
      }

      toast.success('Pavilhão criado', {
        description: `${venue.name} está pronto para receber eventos.`,
      })
      onOpenChange(false)
      resetAll()
      navigate({ to: '/venues/$venueId', params: { venueId: venue.id } })
    } catch (err) {
      toast.error('Não foi possível concluir a criação', {
        description: getApiErrorMessage(err),
      })
    } finally {
      setIsCreating(false)
    }
  }

  const result = chat.complete
  const v = result?.venue
  const ev = result?.suggestedEvent
  const showPreview = view === 'preview' && result

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Criar pavilhão com IA</SheetTitle>
          <SheetDescription>
            Converse com a IA para montar o pavilhão. Você revisa antes de criar.
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
                  <Building2 size={13} />
                  Ver resultado
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
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
              <div className="flex gap-3 rounded-xl border border-border p-3">
                <div
                  className="size-14 shrink-0 rounded-lg"
                  style={{ background: v!.photo }}
                />
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="truncate text-[14px] font-extrabold text-fg">{v!.name}</div>
                  <div className="flex items-center gap-1.5 text-[12px] text-fg-muted">
                    <MapPin size={12} />
                    {v!.city} · {v!.state}
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-fg-muted">
                    <Ruler size={12} />
                    {v!.width}×{v!.height}m · {v!.width * v!.height}m²
                  </div>
                </div>
              </div>

              {result.missing.length > 0 && (
                <div className="flex gap-2 rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-[12px] text-amber-700 dark:text-amber-300">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>Alguns dados foram assumidos: {result.missing.join(', ')}.</span>
                </div>
              )}

              {ev && (
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3">
                  <Checkbox
                    checked={createEventToo}
                    onCheckedChange={(c) => setCreateEventToo(c === true)}
                    className="mt-0.5"
                  />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[13px] font-bold text-fg">Criar evento junto</span>
                    <span className="text-[12px] text-fg-muted">
                      {ev.name} · {EVENT_TYPE_LABEL[ev.type]} ·{' '}
                      {fmtDateRange(ev.startDate, ev.endDate)}
                    </span>
                  </div>
                </label>
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
              <Button onClick={handleConfirm} disabled={isCreating}>
                {isCreating ? 'Criando…' : 'Confirmar e criar'}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
