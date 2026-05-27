import { useEffect, useRef, useState } from 'react'
import { Save, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import type { Allotment, AllotmentStatus, EventDetail } from '#/types'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { StatusBadge } from '#/components/shared/StatusBadge'
import { STATUS_COLORS, STATUS_LABELS } from '#/lib/constants'
import { detectOverlap, isOutOfBounds } from '#/lib/collision'
import { cn } from '#/lib/utils.ts'
import type { AllotmentDiff } from '#/stores/historyStore'

interface AllotmentPanelProps {
  event: EventDetail
  allotment: Allotment
  allotments: Array<Allotment>
  onClose: () => void
  /** Disparado a cada mudança em um campo do painel (live preview). */
  onChange: (diff: AllotmentDiff) => void
  /** Força um flush imediato de todas as alterações pendentes. */
  onSaveNow: () => void
  onDelete: () => void
  isDirty?: boolean
  isSaving?: boolean
  isDeleting?: boolean
}

type ValidationReason = 'overlap' | 'bounds'

interface ValidationResult {
  valid: boolean
  reason?: ValidationReason
}

const STATUS_KEYS: Array<AllotmentStatus> = ['AVAILABLE', 'RESERVED', 'SOLD', 'BLOCKED']

const STATUS_TONE: Record<AllotmentStatus, { bg: string; text: string; border: string }> = {
  AVAILABLE: {
    bg: 'bg-status-livre-50',
    text: 'text-status-livre-text',
    border: 'border-status-livre',
  },
  RESERVED: {
    bg: 'bg-status-reservado-50',
    text: 'text-status-reservado-text',
    border: 'border-status-reservado',
  },
  SOLD: {
    bg: 'bg-status-vendido-50',
    text: 'text-status-vendido-text',
    border: 'border-status-vendido',
  },
  BLOCKED: {
    bg: 'bg-status-bloqueado-50',
    text: 'text-status-bloqueado-text',
    border: 'border-status-bloqueado',
  },
}

export function AllotmentPanel({
  event,
  allotment,
  allotments,
  onClose,
  onChange,
  onSaveNow,
  onDelete,
  isDirty,
  isSaving,
  isDeleting,
}: AllotmentPanelProps) {
  // Estado local pra inputs (smooth typing). Os valores do cache são "espelhados"
  // ao trocar de stand ou quando algo externo (drag/undo) atualiza o allotment.
  const [name, setName] = useState(allotment.name)
  const [widthStr, setWidthStr] = useState(String(allotment.width))
  const [heightStr, setHeightStr] = useState(String(allotment.height))
  const [priceStr, setPriceStr] = useState(String(allotment.price))
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Throttle do toast de validação — evita spam enquanto o user digita "100".
  const lastToastRef = useRef(0)

  useEffect(() => {
    setName(allotment.name)
    setWidthStr(String(allotment.width))
    setHeightStr(String(allotment.height))
    setPriceStr(String(allotment.price))
    setConfirmDelete(false)
  }, [
    allotment.id,
    allotment.name,
    allotment.width,
    allotment.height,
    allotment.price,
  ])

  const status = allotment.status
  const statusColor = STATUS_COLORS[status]

  function validateSize(width: number, height: number): ValidationResult {
    const candidate: Allotment = { ...allotment, width, height }
    if (isOutOfBounds(candidate, event)) {
      return { valid: false, reason: 'bounds' }
    }
    const overlaps = allotments.some(
      (s) => s.id !== allotment.id && detectOverlap(s, candidate),
    )
    if (overlaps) return { valid: false, reason: 'overlap' }
    return { valid: true }
  }

  function flashInvalid(reason: ValidationReason) {
    const now = Date.now()
    if (now - lastToastRef.current < 1500) return
    lastToastRef.current = now
    toast.error(
      reason === 'overlap'
        ? 'Tamanho bloqueado: colide com outro stand'
        : 'Tamanho bloqueado: ultrapassa os limites do canvas',
    )
  }

  function handleNameChange(value: string) {
    setName(value)
    onChange({ name: value })
  }

  function handleWidthChange(value: string) {
    setWidthStr(value)
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed <= 0) return
    if (parsed === allotment.width) return
    const next = Math.round(parsed)
    const result = validateSize(next, allotment.height)
    if (!result.valid) {
      flashInvalid(result.reason!)
      return
    }
    onChange({ width: next })
  }

  function handleHeightChange(value: string) {
    setHeightStr(value)
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed <= 0) return
    if (parsed === allotment.height) return
    const next = Math.round(parsed)
    const result = validateSize(allotment.width, next)
    if (!result.valid) {
      flashInvalid(result.reason!)
      return
    }
    onChange({ height: next })
  }

  function handleWidthBlur() {
    if (Number(widthStr) !== allotment.width) {
      setWidthStr(String(allotment.width))
    }
  }

  function handleHeightBlur() {
    if (Number(heightStr) !== allotment.height) {
      setHeightStr(String(allotment.height))
    }
  }

  function handlePriceChange(value: string) {
    setPriceStr(value)
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed < 0) return
    if (parsed === allotment.price) return
    onChange({ price: parsed })
  }

  function handleStatusClick(next: AllotmentStatus) {
    if (next === status) return
    onChange({ status: next })
  }

  return (
    <aside
      className="flex w-85 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card animate-in slide-in-from-right-4 duration-200"
      aria-label="Detalhes do stand"
    >
      {/* Header */}
      <div className="border-b border-border px-5 pt-5 pb-4">
        <div className="flex items-start gap-3">
          <span
            className="grid size-9 shrink-0 place-items-center rounded-lg font-mono text-[12px] font-extrabold text-white"
            style={{ background: statusColor }}
            aria-label={`Código ${allotment.code}`}
          >
            {allotment.code}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-extrabold text-fg">{allotment.name}</div>
            <div className="text-[11.5px] text-fg-subtle">
              {allotment.width}×{allotment.height}m · {allotment.width * allotment.height}m²
            </div>
          </div>
          <Button variant="ghost" size="icon-xs" onClick={onClose} aria-label="Fechar painel">
            <X />
          </Button>
        </div>
        <div className="mt-3">
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
        <Field label="Nome do stand">
          <Input value={name} onChange={(e) => handleNameChange(e.target.value)} />
        </Field>

        <div>
          <span className="text-caption mb-2 block">Dimensões</span>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Largura (m)">
              <Input
                type="number"
                min={1}
                step={1}
                value={widthStr}
                onChange={(e) => handleWidthChange(e.target.value)}
                onBlur={handleWidthBlur}
              />
            </Field>
            <Field label="Profundidade (m)">
              <Input
                type="number"
                min={1}
                step={1}
                value={heightStr}
                onChange={(e) => handleHeightChange(e.target.value)}
                onBlur={handleHeightBlur}
              />
            </Field>
          </div>
          <p className="mt-2 text-[11.5px] text-fg-subtle">
            Posição: <strong className="text-fg">x={allotment.x}m · y={allotment.y}m</strong>
          </p>
        </div>

        <div>
          <span className="text-caption mb-2 block">Status</span>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_KEYS.map((key) => {
              const active = status === key
              const tone = STATUS_TONE[key]
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleStatusClick(key)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[12.5px] font-bold transition-colors',
                    active
                      ? `${tone.bg} ${tone.text} ${tone.border}`
                      : 'border-border bg-surface-2 text-fg-muted hover:bg-surface-3',
                  )}
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ background: STATUS_COLORS[key] }}
                  />
                  {STATUS_LABELS[key]}
                </button>
              )
            })}
          </div>
        </div>

        <Field label="Preço de venda">
          <div className="relative">
            <span className="absolute top-1/2 left-3 -translate-y-1/2 text-[12px] font-bold text-fg-muted">
              R$
            </span>
            <Input
              type="number"
              min={0}
              step={100}
              className="pl-9"
              value={priceStr}
              onChange={(e) => handlePriceChange(e.target.value)}
            />
          </div>
        </Field>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-2 border-t border-border px-5 py-4">
        <Button
          variant="default"
          onClick={onSaveNow}
          disabled={!isDirty || isSaving}
          title={isDirty ? 'Salvar todas as alterações pendentes agora' : 'Nada a salvar'}
        >
          <Save size={15} />
          {isSaving ? 'Salvando…' : 'Salvar agora'}
        </Button>
        {!confirmDelete ? (
          <Button
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 size={14} />
            Excluir stand
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={onDelete}
              disabled={isDeleting}
            >
              <Trash2 size={14} />
              Confirmar
            </Button>
          </div>
        )}
      </div>
    </aside>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11.5px] font-bold text-fg-muted">{label}</span>
      {children}
    </label>
  )
}
