import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  CircleSlash,
  Loader2,
  Monitor,
  Plus,
  Redo2,
  RotateCcw,
  Save,
  Undo2,
  Zap,
  ZapOff,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useEventQuery } from '#/hooks/useEvents'
import {
  allotmentsKeys,
  useAllotmentsQuery,
  useCreateAllotment,
  useDeleteAllotment,
  useUpdateAllotment,
} from '#/hooks/useAllotments'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
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
import { useCanvasStore } from '#/stores/canvasStore'
import { useUIStore } from '#/stores/uiStore'
import { useHistoryStore } from '#/stores/historyStore'
import type { AllotmentDiff, HistoryEntry } from '#/stores/historyStore'
import { PavilionStage } from '#/components/canvas/PavilionStage'
import { MiniMap } from '#/components/canvas/MiniMap'
import { StandTipsBar } from '#/components/canvas/StandTipsBar'
import { AllotmentPanel } from '#/components/allotments/AllotmentPanel'
import { SCALE } from '#/lib/constants'
import { findFreeSlot, generateCode } from '#/lib/allotmentInsert'
import { useAutosave } from '#/hooks/useAutosave'
import { usePavilionHotkeys } from '#/hooks/usePavilionHotkeys'
import { cn } from '#/lib/utils.ts'
import type { Allotment } from '#/types'

export const Route = createFileRoute('/events/$eventId/pavilhao')({
  validateSearch: (search: Record<string, unknown>) => ({
    standId: typeof search.standId === 'string' ? search.standId : undefined,
  }),
  component: PavilionEditorScreen,
})

const PRESETS = [
  { label: '3×3m', w: 3, h: 3 },
  { label: '4×3m', w: 4, h: 3 },
  { label: '6×4m', w: 6, h: 4 },
  { label: '8×6m', w: 8, h: 6 },
] as const

const CANVAS_PADDING = 24

function PavilionEditorScreen() {
  const { eventId } = Route.useParams()
  const { standId } = Route.useSearch()
  const eventQ = useEventQuery(eventId)
  const allotmentsQ = useAllotmentsQuery(eventId)
  const qc = useQueryClient()

  const selectedId = useCanvasStore((s) => s.selectedId)
  const selectedIds = useCanvasStore((s) => s.selectedIds)
  const zoom = useCanvasStore((s) => s.zoom)
  const setZoom = useCanvasStore((s) => s.setZoom)
  const setSelected = useCanvasStore((s) => s.setSelected)
  const clearSelection = useCanvasStore((s) => s.clearSelection)
  const autosaveEnabled = useCanvasStore((s) => s.autosaveEnabled)
  const toggleAutosave = useCanvasStore((s) => s.toggleAutosave)
  const dirtyIds = useCanvasStore((s) => s.dirtyIds)
  const markDirty = useCanvasStore((s) => s.markDirty)
  const clearDirty = useCanvasStore((s) => s.clearDirty)
  const setSaveStatus = useUIStore((s) => s.setSaveStatus)

  const pushHistory = useHistoryStore((s) => s.push)
  const popUndo = useHistoryStore((s) => s.popUndo)
  const popRedo = useHistoryStore((s) => s.popRedo)
  const clearHistory = useHistoryStore((s) => s.clear)
  const canUndo = useHistoryStore((s) => s.past.length > 0)
  const canRedo = useHistoryStore((s) => s.future.length > 0)

  const scrollWrapRef = useRef<HTMLDivElement | null>(null)
  /**
   * Snapshot do estado de cada stand no momento em que ele entrou em dirty
   * pela primeira vez (= estado igual ao do servidor). Usado pelo botão
   * "Cancelar edições" pra reverter sem precisar de roundtrip.
   */
  const preDirtySnapshotsRef = useRef<Map<string, AllotmentDiff>>(new Map())
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  // Ids alvo da confirmação de delete (Del/Backspace). Null = modal fechado.
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Array<string> | null>(null)
  const [isLg, setIsLg] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : false,
  )

  const createMutation = useCreateAllotment(eventId)
  const updateMutation = useUpdateAllotment(eventId)
  const deleteMutation = useDeleteAllotment(eventId)

  const event = eventQ.data
  const allotments = allotmentsQ.data ?? []
  const isLoading = eventQ.isLoading || allotmentsQ.isLoading
  const pixelsPerMeter = SCALE * zoom

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const handler = (e: MediaQueryListEvent) => setIsLg(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Limpa histórico ao trocar de evento
  useEffect(() => {
    clearHistory()
  }, [eventId, clearHistory])

  // Pré-seleciona pelo search param
  useEffect(() => {
    if (standId) setSelected(standId)
  }, [standId, setSelected])

  // Limpa seleção se o id desaparecer (ex: stand deletado)
  useEffect(() => {
    if (selectedId && !allotments.some((s) => s.id === selectedId)) {
      clearSelection()
    }
  }, [allotments, selectedId, clearSelection])

  const flushDirty = useCallback(
    async (ids: Array<string>) => {
      if (ids.length === 0) return
      const current = qc.getQueryData<Array<Allotment>>(allotmentsKeys.byEvent(eventId))
      if (!current) return
      setSaveStatus('saving')
      try {
        await Promise.all(
          ids.map((id) => {
            const s = current.find((a) => a.id === id)
            if (!s) return Promise.resolve()
            return updateMutation.mutateAsync({
              id,
              payload: {
                name: s.name,
                x: s.x,
                y: s.y,
                width: s.width,
                height: s.height,
                status: s.status,
                price: s.price,
              },
            })
          }),
        )
        ids.forEach((id) => {
          clearDirty(id)
          preDirtySnapshotsRef.current.delete(id)
        })
        setSaveStatus('saved')
        toast.success(
          ids.length === 1 ? 'Alterações salvas' : `${ids.length} stands salvos`,
        )
      } catch {
        setSaveStatus('idle')
        toast.error('Falha ao salvar')
      }
    },
    [qc, eventId, updateMutation, setSaveStatus, clearDirty],
  )

  const {
    schedule: scheduleAutosave,
    cancel: cancelAutosave,
    isPending: autosavePending,
  } = useAutosave({
    enabled: autosaveEnabled,
    delay: 2000,
    onFlush: flushDirty,
  })

  // Quando autosave é ligado, dispara um flush imediato dos pendentes
  useEffect(() => {
    if (autosaveEnabled && dirtyIds.length > 0) {
      void flushDirty(dirtyIds)
    }
  }, [autosaveEnabled, dirtyIds, flushDirty])

  // Salva pendentes ao trocar de evento / desmontar
  useEffect(() => {
    return () => {
      cancelAutosave()
    }
  }, [cancelAutosave])

  const applyDiff = useCallback(
    (id: string, diff: AllotmentDiff) => {
      qc.setQueryData<Array<Allotment>>(allotmentsKeys.byEvent(eventId), (prev) =>
        prev ? prev.map((s) => (s.id === id ? { ...s, ...diff } : s)) : prev,
      )
    },
    [qc, eventId],
  )

  /**
   * Garante que o estado pré-edição (= servidor) está capturado para o id.
   * Idempotente: só salva na primeira chamada por id desde o último flush.
   */
  const captureSnapshot = useCallback((current: Allotment) => {
    if (preDirtySnapshotsRef.current.has(current.id)) return
    preDirtySnapshotsRef.current.set(current.id, {
      x: current.x,
      y: current.y,
      width: current.width,
      height: current.height,
      name: current.name,
      price: current.price,
      status: current.status,
    })
  }, [])

  const handleInsert = useCallback(
    (w: number, h: number) => {
      if (!event) return
      if (dirtyIds.length > 0) {
        toast.error('Salve as alterações pendentes antes de adicionar um novo stand', {
          action: {
            label: 'Salvar agora',
            onClick: () => {
              cancelAutosave()
              void flushDirty(dirtyIds)
            },
          },
        })
        return
      }
      const slot = findFreeSlot(w, h, event, allotments)
      if (!slot) {
        toast.error('Sem espaço disponível no pavilhão')
        return
      }
      const code = generateCode(allotments)
      createMutation.mutate(
        {
          name: `Stand ${code}`,
          code,
          x: slot.x,
          y: slot.y,
          width: w,
          height: h,
          status: 'AVAILABLE',
          price: w * h * 1000,
        },
        {
          onSuccess: (created) => {
            // Insert quebra a linearidade do histórico (IDs novos não são
            // reversíveis sem recriar) — limpa o stack.
            clearHistory()
            setSelected(created.id)
            // Garante que o novo stand fique visível, mesmo com zoom aplicado
            // ou a viewport rolada para outra parte do canvas.
            const wrap = scrollWrapRef.current
            if (wrap) {
              const cxMeters = slot.x + w / 2
              const cyMeters = slot.y + h / 2
              wrap.scrollTo({
                left: cxMeters * pixelsPerMeter - wrap.clientWidth / 2 + CANVAS_PADDING,
                top: cyMeters * pixelsPerMeter - wrap.clientHeight / 2 + CANVAS_PADDING,
                behavior: 'smooth',
              })
            }
            toast.success(`Stand ${created.code} adicionado (${w}×${h}m)`)
          },
          onError: () => toast.error('Não foi possível adicionar o stand'),
        },
      )
    },
    [
      event,
      allotments,
      createMutation,
      setSelected,
      clearHistory,
      dirtyIds,
      cancelAutosave,
      flushDirty,
      pixelsPerMeter,
    ],
  )

  const handleSelect = useCallback(
    (id: string, _shift: boolean) => {
      // Multi-select desabilitado — sempre seleção única, ignora shift.
      setSelected(id)
    },
    [setSelected],
  )

  const handlePositionCommit = useCallback(
    (id: string, x: number, y: number) => {
      const before = allotments.find((s) => s.id === id)
      if (!before || (before.x === x && before.y === y)) return
      captureSnapshot(before)
      pushHistory({
        kind: 'mutation',
        id,
        before: { x: before.x, y: before.y },
        after: { x, y },
      })
      applyDiff(id, { x, y })
      markDirty(id)
      setSaveStatus('idle')
      if (autosaveEnabled) scheduleAutosave(id)
    },
    [
      allotments,
      captureSnapshot,
      pushHistory,
      applyDiff,
      markDirty,
      setSaveStatus,
      autosaveEnabled,
      scheduleAutosave,
    ],
  )

  const handleTransformCommit = useCallback(
    (
      id: string,
      payload: { x: number; y: number; width: number; height: number },
    ) => {
      const before = allotments.find((s) => s.id === id)
      if (!before) return
      const beforeDiff: AllotmentDiff = {
        x: before.x,
        y: before.y,
        width: before.width,
        height: before.height,
      }
      if (
        beforeDiff.x === payload.x &&
        beforeDiff.y === payload.y &&
        beforeDiff.width === payload.width &&
        beforeDiff.height === payload.height
      ) {
        return
      }
      captureSnapshot(before)
      pushHistory({
        kind: 'mutation',
        id,
        before: beforeDiff,
        after: payload,
      })
      applyDiff(id, payload)
      markDirty(id)
      setSaveStatus('idle')
      if (autosaveEnabled) scheduleAutosave(id)
    },
    [
      allotments,
      captureSnapshot,
      pushHistory,
      applyDiff,
      markDirty,
      setSaveStatus,
      autosaveEnabled,
      scheduleAutosave,
    ],
  )

  // Painel: live preview — cada mudança aplica o diff localmente, marca dirty,
  // empilha histórico e (se autosave ON) reagenda o timer de 2s.
  const handlePanelChange = useCallback(
    (allotment: Allotment, diff: AllotmentDiff) => {
      const before: AllotmentDiff = {}
      ;(Object.keys(diff) as Array<keyof AllotmentDiff>).forEach((key) => {
        ;(before as Record<string, unknown>)[key] = allotment[key]
      })
      captureSnapshot(allotment)
      pushHistory({ kind: 'mutation', id: allotment.id, before, after: diff })
      applyDiff(allotment.id, diff)
      markDirty(allotment.id)
      setSaveStatus('idle')
      if (autosaveEnabled) scheduleAutosave(allotment.id)
    },
    [
      captureSnapshot,
      pushHistory,
      applyDiff,
      markDirty,
      setSaveStatus,
      autosaveEnabled,
      scheduleAutosave,
    ],
  )

  // "Salvar agora": força flush imediato de tudo dirty, cancelando autosave pendente.
  const handleSaveNow = useCallback(() => {
    cancelAutosave()
    if (dirtyIds.length === 0) return
    void flushDirty(dirtyIds)
  }, [cancelAutosave, dirtyIds, flushDirty])

  // "Cancelar edições": reverte todos os stands dirty para o estado pré-edição
  // (que igual ao do servidor). Não faz roundtrip — usa os snapshots.
  // Limpa histórico porque as entradas referenciam estados que não existem mais.
  const handleDiscardEdits = useCallback(() => {
    if (preDirtySnapshotsRef.current.size === 0) return
    cancelAutosave()
    preDirtySnapshotsRef.current.forEach((snapshot, id) => {
      applyDiff(id, snapshot)
    })
    preDirtySnapshotsRef.current.clear()
    clearDirty()
    clearHistory()
    setSaveStatus('saved')
    toast.success('Alterações descartadas')
  }, [cancelAutosave, applyDiff, clearDirty, clearHistory, setSaveStatus])

  // Reset do confirm de descarte: auto-reverte após 3s ou quando dirty zera
  // ou quando autosave é ligado (a UI do botão some).
  useEffect(() => {
    if (!confirmDiscard) return
    if (dirtyIds.length === 0 || autosaveEnabled) {
      setConfirmDiscard(false)
      return
    }
    const timer = setTimeout(() => setConfirmDiscard(false), 3000)
    return () => clearTimeout(timer)
  }, [confirmDiscard, dirtyIds.length, autosaveEnabled])

  const handlePanelDelete = useCallback(
    (allotment: Allotment) => {
      deleteMutation.mutate(allotment.id, {
        onSuccess: () => {
          clearHistory()
          clearDirty(allotment.id)
          toast.success(`Stand ${allotment.code} removido`)
          clearSelection()
        },
        onError: () => toast.error('Não foi possível excluir'),
      })
    },
    [deleteMutation, clearHistory, clearDirty, clearSelection],
  )

  const handleManualSave = useCallback(() => {
    if (dirtyIds.length === 0) return
    cancelAutosave()
    void flushDirty(dirtyIds)
  }, [dirtyIds, flushDirty, cancelAutosave])

  // Abre o AlertDialog em vez de excluir direto.
  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return
    setPendingDeleteIds([...selectedIds])
  }, [selectedIds])

  // Executa a exclusão depois da confirmação no modal.
  const confirmDeletePending = useCallback(() => {
    if (!pendingDeleteIds || pendingDeleteIds.length === 0) {
      setPendingDeleteIds(null)
      return
    }
    pendingDeleteIds.forEach((id) => deleteMutation.mutate(id))
    clearHistory()
    pendingDeleteIds.forEach((id) => clearDirty(id))
    clearSelection()
    toast.success(
      pendingDeleteIds.length === 1
        ? 'Stand removido'
        : `${pendingDeleteIds.length} stands removidos`,
    )
    setPendingDeleteIds(null)
  }, [pendingDeleteIds, deleteMutation, clearHistory, clearDirty, clearSelection])

  const applyHistoryEntry = useCallback(
    (entry: HistoryEntry, direction: 'undo' | 'redo') => {
      const target = direction === 'undo' ? entry.before : entry.after
      applyDiff(entry.id, target)
      markDirty(entry.id)
      setSaveStatus('idle')
      if (autosaveEnabled) {
        cancelAutosave()
        void flushDirty([entry.id])
      }
    },
    [
      applyDiff,
      markDirty,
      setSaveStatus,
      autosaveEnabled,
      cancelAutosave,
      flushDirty,
    ],
  )

  const handleUndo = useCallback(() => {
    const entry = popUndo()
    if (!entry) return
    applyHistoryEntry(entry, 'undo')
  }, [popUndo, applyHistoryEntry])

  const handleRedo = useCallback(() => {
    const entry = popRedo()
    if (!entry) return
    applyHistoryEntry(entry, 'redo')
  }, [popRedo, applyHistoryEntry])

  const handleZoomIn = useCallback(() => {
    setZoom(Math.min(3, zoom + 0.1))
  }, [zoom, setZoom])

  const handleZoomOut = useCallback(() => {
    setZoom(Math.max(0.25, zoom - 0.1))
  }, [zoom, setZoom])

  usePavilionHotkeys({
    enabled: !isLoading,
    onDelete: handleDeleteSelected,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
  })

  const centerOn = useCallback(
    (xMeters: number, yMeters: number) => {
      const wrap = scrollWrapRef.current
      if (!wrap) return
      wrap.scrollTo({
        left: xMeters * pixelsPerMeter - wrap.clientWidth / 2 + CANVAS_PADDING,
        top: yMeters * pixelsPerMeter - wrap.clientHeight / 2 + CANVAS_PADDING,
        behavior: 'smooth',
      })
    },
    [pixelsPerMeter],
  )

  const handlePan = useCallback(
    (xMeters: number, yMeters: number) => {
      const wrap = scrollWrapRef.current
      if (!wrap) return
      wrap.scrollLeft = xMeters * pixelsPerMeter - wrap.clientWidth / 2 + CANVAS_PADDING
      wrap.scrollTop = yMeters * pixelsPerMeter - wrap.clientHeight / 2 + CANVAS_PADDING
    },
    [pixelsPerMeter],
  )

  const selectedAllotment = useMemo(
    () => allotments.find((s) => s.id === selectedId) ?? null,
    [allotments, selectedId],
  )

  return (
    <>
    {!isLg && (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <Monitor size={48} className="text-brand-primary" />
        <h2 className="text-xl font-bold text-fg">Tela muito pequena</h2>
        <p className="max-w-xs text-sm text-fg-muted">
          O editor de pavilhão requer uma tela maior. Continue em um computador ou expanda a janela do navegador.
        </p>
      </div>
    )}
    {isLg && (
    <div className="-mx-5 -my-4 flex h-[calc(100svh-80px)] overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden px-5 pt-3 pb-3">
        {/* Toolbar */}
        <div className="flex items-center gap-3 pb-3">
          <span className="text-caption">Inserir</span>
          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((p) => {
              const blockedByDirty = dirtyIds.length > 0
              // Disabled HTML só em estados "duros" (sem evento / criando agora)
              // — quando bloqueado por dirty, mantemos clicável pra mostrar toast.
              const hardDisabled = !event || createMutation.isPending
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleInsert(p.w, p.h)}
                  disabled={hardDisabled}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-[12px] font-semibold text-fg shadow-sm transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50',
                    blockedByDirty && 'opacity-50',
                  )}
                  title={
                    blockedByDirty
                      ? 'Salve as alterações pendentes antes de adicionar'
                      : `Adicionar stand ${p.label}`
                  }
                >
                  <Plus size={12} />
                  {p.label}
                </button>
              )
            })}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <UndoRedoButtons
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={handleUndo}
              onRedo={handleRedo}
            />
            <AutosaveToggle enabled={autosaveEnabled} onToggle={toggleAutosave} />
            {autosaveEnabled && autosavePending && (
              <Button
                size="sm"
                variant="ghost"
                onClick={cancelAutosave}
                title="Cancelar o save automático pendente — as alterações ficam locais até você salvar manualmente"
              >
                <CircleSlash size={14} />
                Cancelar save
              </Button>
            )}
            {(!autosaveEnabled || !autosavePending) && (
              <Button
                size="sm"
                variant={dirtyIds.length > 0 ? 'default' : 'outline'}
                onClick={handleManualSave}
                disabled={dirtyIds.length === 0 || updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                {dirtyIds.length > 0 ? `Salvar (${dirtyIds.length})` : 'Salvo'}
              </Button>
            )}
            {!autosaveEnabled && dirtyIds.length > 0 && (
              confirmDiscard ? (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    handleDiscardEdits()
                    setConfirmDiscard(false)
                  }}
                  title="Clique para confirmar — reverte tudo ao estado do servidor"
                >
                  <RotateCcw size={14} />
                  Confirmar descarte
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmDiscard(true)}
                  title="Descartar alterações locais e voltar ao estado do servidor"
                >
                  <RotateCcw size={14} />
                  Cancelar edições
                </Button>
              )
            )}
            <ZoomStepper zoom={zoom} setZoom={setZoom} />
          </div>
        </div>

        {/* Status bar */}
        {event && (
          <div className="flex items-center gap-3 pb-3 text-[12px] font-semibold text-fg-muted">
            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
              {event.canvasWidth}m × {event.canvasHeight}m
            </span>
            <span>Equivale a {event.canvasWidth * event.canvasHeight} m²</span>
            <span className="ml-auto inline-flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-primary" />
              {selectedIds.length === 0 ? (
                <span className="text-fg-subtle">Nenhum stand selecionado</span>
              ) : selectedIds.length === 1 ? (
                <span>
                  Selecionado:{' '}
                  <strong className="text-fg">
                    {selectedAllotment?.code} · {selectedAllotment?.name}
                  </strong>
                </span>
              ) : (
                <strong className="text-fg">{selectedIds.length} stands selecionados</strong>
              )}
            </span>
          </div>
        )}

        {/* Canvas + Panel row — panel cresce na mesma altura do canvas */}
        <div className="flex min-h-0 flex-1 gap-3">
          <div className="relative min-h-0 flex-1">
          <div
            ref={scrollWrapRef}
            className="absolute inset-0 overflow-auto rounded-2xl border border-border bg-card"
          >
            {isLoading || !event ? (
              <div className="flex h-full items-center justify-center p-6">
                <Skeleton className="h-full w-full rounded-lg" />
              </div>
            ) : (
              <PavilionStage
                event={event}
                allotments={allotments}
                selectedId={selectedId}
                selectedIds={selectedIds}
                zoom={zoom}
                onSelect={handleSelect}
                onClearSelection={clearSelection}
                onPositionCommit={handlePositionCommit}
                onTransformCommit={handleTransformCommit}
                onInvalidMove={(reason) =>
                  toast.error(
                    reason === 'overlap'
                      ? 'Movimento bloqueado: colide com outro stand'
                      : 'Movimento bloqueado: fora dos limites',
                  )
                }
                scrollWrapRef={scrollWrapRef}
                canvasPadding={CANVAS_PADDING}
              />
            )}
          </div>

          {event && (
            <MiniMap
              canvasWidth={event.canvasWidth}
              canvasHeight={event.canvasHeight}
              allotments={allotments}
              selectedId={selectedId}
              scrollWrapRef={scrollWrapRef}
              pixelsPerMeter={pixelsPerMeter}
              canvasPadding={CANVAS_PADDING}
              onPan={handlePan}
              onSelect={(id) => {
                const s = allotments.find((a) => a.id === id)
                if (!s) return
                setSelected(id)
                centerOn(s.x + s.width / 2, s.y + s.height / 2)
              }}
              onCenterOn={centerOn}
            />
          )}
          </div>

          {event && selectedAllotment && selectedIds.length === 1 && (
            <AllotmentPanel
              event={event}
              allotment={selectedAllotment}
              allotments={allotments}
              onClose={clearSelection}
              onChange={(diff) => handlePanelChange(selectedAllotment, diff)}
              onSaveNow={handleSaveNow}
              onDelete={() => handlePanelDelete(selectedAllotment)}
              isDirty={dirtyIds.includes(selectedAllotment.id)}
              isSaving={updateMutation.isPending}
              isDeleting={deleteMutation.isPending}
            />
          )}
        </div>

        <StandTipsBar />
      </div>

    </div>
    )}
    <AlertDialog
      open={pendingDeleteIds !== null}
      onOpenChange={(open) => !open && setPendingDeleteIds(null)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {pendingDeleteIds && pendingDeleteIds.length === 1
              ? 'Excluir stand?'
              : `Excluir ${pendingDeleteIds?.length ?? 0} stands?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Os stands selecionados serão removidos
            permanentemente do evento.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-500 text-white hover:bg-red-600"
            onClick={confirmDeletePending}
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}

function ZoomStepper({ zoom, setZoom }: { zoom: number; setZoom: (z: number) => void }) {
  const step = 0.1
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-1 py-1 text-[12px]">
      <button
        type="button"
        onClick={() => setZoom(Math.max(0.25, zoom - step))}
        className="inline-flex size-6 items-center justify-center rounded-full text-fg-muted hover:bg-surface-2"
        aria-label="Diminuir zoom"
      >
        <ZoomOut size={12} />
      </button>
      <span className="min-w-10 text-center font-bold tabular-nums">
        {Math.round(zoom * 100)}%
      </span>
      <button
        type="button"
        onClick={() => setZoom(Math.min(3, zoom + step))}
        className="inline-flex size-6 items-center justify-center rounded-full text-fg-muted hover:bg-surface-2"
        aria-label="Aumentar zoom"
      >
        <ZoomIn size={12} />
      </button>
    </div>
  )
}

function UndoRedoButtons({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: {
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-border bg-card p-1 text-[12px]">
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        className="inline-flex size-6 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        aria-label="Desfazer (Ctrl+Z)"
        title="Desfazer (⌘Z)"
      >
        <Undo2 size={13} />
      </button>
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        className="inline-flex size-6 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        aria-label="Refazer (Ctrl+Shift+Z)"
        title="Refazer (⌘⇧Z)"
      >
        <Redo2 size={13} />
      </button>
    </div>
  )
}

function AutosaveToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11.5px] font-bold transition-colors',
        enabled
          ? 'border-status-livre/40 bg-status-livre-50 text-status-livre-text'
          : 'border-border bg-card text-fg-muted hover:bg-surface-2',
      )}
      title={
        enabled
          ? 'Autosave ligado: salva após 1,5s parado'
          : 'Autosave desligado: salve manualmente'
      }
    >
      {enabled ? <Zap size={12} /> : <ZapOff size={12} />}
      {enabled ? 'Auto' : 'Manual'}
    </button>
  )
}
