import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { CalendarDays, Loader2, Maximize2 } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '#/lib/utils'
import { EVENT_TYPES } from '#/lib/constants'
import type { EventType } from '#/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { useCreateEvent } from '#/hooks/useEvents'

const dateRegex = /^\d{4}-\d{2}-\d{2}$/

const schema = z
  .object({
    name: z.string().trim().min(3, 'Informe um nome com pelo menos 3 caracteres'),
    type: z.enum(['FEIRA', 'CONGRESSO', 'EXPO', 'CORPORATE'] as const, {
      error: 'Selecione o tipo do evento',
    }),
    startDate: z
      .string()
      .regex(dateRegex, 'Selecione a data de início'),
    endDate: z
      .string()
      .regex(dateRegex, 'Selecione a data de término'),
    customCanvas: z.boolean(),
    canvasWidth: z.preprocess(
      (v) => (v === '' || v === undefined ? undefined : Number(v)),
      z.number().positive('Deve ser maior que zero').max(5000).optional(),
    ),
    canvasHeight: z.preprocess(
      (v) => (v === '' || v === undefined ? undefined : Number(v)),
      z.number().positive('Deve ser maior que zero').max(5000).optional(),
    ),
  })
  .refine((d) => !d.startDate || !d.endDate || d.endDate >= d.startDate, {
    message: 'Data final deve ser igual ou posterior à inicial',
    path: ['endDate'],
  })

type FormValues = z.input<typeof schema>
type ParsedValues = z.output<typeof schema>

interface CreateEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  venueId: string
  venueName: string
  venueWidth: number
  venueHeight: number
}

export function CreateEventDialog({
  open,
  onOpenChange,
  venueId,
  venueName,
  venueWidth,
  venueHeight,
}: CreateEventDialogProps) {
  const navigate = useNavigate()
  const createMutation = useCreateEvent()
  const [selectedType, setSelectedType] = useState<EventType | null>(null)

  const form = useForm<FormValues, undefined, ParsedValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      type: undefined,
      startDate: '',
      endDate: '',
      customCanvas: false,
      canvasWidth: '',
      canvasHeight: '',
    },
  })

  const customCanvas = form.watch('customCanvas')

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset()
      createMutation.reset()
      setSelectedType(null)
    }
    onOpenChange(next)
  }

  const handleTypeSelect = (type: EventType) => {
    setSelectedType(type)
    form.setValue('type', type, { shouldValidate: true })
  }

  const onSubmit = form.handleSubmit((values) => {
    createMutation.mutate(
      {
        name: values.name,
        type: values.type,
        startDate: values.startDate,
        endDate: values.endDate,
        venueId,
        ...(values.customCanvas && values.canvasWidth ? { canvasWidth: values.canvasWidth } : {}),
        ...(values.customCanvas && values.canvasHeight
          ? { canvasHeight: values.canvasHeight }
          : {}),
      },
      {
        onSuccess: (created) => {
          toast.success('Evento criado', {
            description: `${created.name} está pronto para receber stands.`,
          })
          handleOpenChange(false)
          navigate({
            to: '/events/$eventId/dashboard',
            params: { eventId: created.id },
          })
        },
        onError: (err) => {
          toast.error('Não foi possível criar o evento', {
            description: err instanceof Error ? err.message : 'Tente novamente.',
          })
        },
      },
    )
  })

  const isSubmitting = createMutation.isPending
  const errors = form.formState.errors

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-130">
        <DialogHeader>
          <DialogTitle className="text-h2">Novo evento</DialogTitle>
          <DialogDescription>
            Evento em <span className="font-semibold text-fg">{venueName}</span>.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={onSubmit} noValidate>
          {/* Nome */}
          <div className="grid gap-1.5">
            <Label htmlFor="event-name">Nome do evento</Label>
            <Input
              id="event-name"
              placeholder="Ex.: Feira Tech 2027"
              autoFocus
              {...form.register('name')}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && (
              <p className="text-[12px] text-status-erro-text">{errors.name.message}</p>
            )}
          </div>

          {/* Tipo */}
          <div className="grid gap-1.5">
            <Label>Tipo do evento</Label>
            <div className="grid grid-cols-4 gap-2">
              {EVENT_TYPES.map((et) => (
                <button
                  key={et.id}
                  type="button"
                  onClick={() => handleTypeSelect(et.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-[11px] font-semibold transition-colors',
                    selectedType === et.id
                      ? 'border-transparent text-white'
                      : 'border-border text-fg-muted hover:border-border-strong hover:bg-surface-2',
                  )}
                  style={
                    selectedType === et.id
                      ? { backgroundColor: et.color, borderColor: et.color }
                      : {}
                  }
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: selectedType === et.id ? 'white' : et.color }}
                  />
                  {et.label}
                </button>
              ))}
            </div>
            {errors.type && (
              <p className="text-[12px] text-status-erro-text">{errors.type.message}</p>
            )}
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="event-start">
                <CalendarDays size={14} className="inline" /> Início
              </Label>
              <Input
                id="event-start"
                type="date"
                {...form.register('startDate')}
                aria-invalid={Boolean(errors.startDate)}
              />
              {errors.startDate && (
                <p className="text-[12px] text-status-erro-text">{errors.startDate.message}</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="event-end">
                <CalendarDays size={14} className="inline" /> Término
              </Label>
              <Input
                id="event-end"
                type="date"
                {...form.register('endDate')}
                aria-invalid={Boolean(errors.endDate)}
              />
              {errors.endDate && (
                <p className="text-[12px] text-status-erro-text">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Canvas */}
          <div className="grid gap-2">
            <Label>Tamanho do canvas</Label>
            <div className="grid gap-2">
              <label
                className={cn(
                  'flex cursor-pointer items-center gap-2.5 rounded-lg border p-3 transition-colors',
                  !customCanvas
                    ? 'border-brand-primary bg-brand-primary/5'
                    : 'border-border hover:bg-surface-2',
                )}
              >
                <input
                  type="radio"
                  className="accent-brand-primary"
                  checked={!customCanvas}
                  onChange={() => form.setValue('customCanvas', false)}
                />
                <div>
                  <div className="text-[13px] font-semibold">Herdar do pavilhão</div>
                  <div className="text-[11px] text-fg-subtle">
                    {venueName} · {venueWidth} × {venueHeight} m
                    <span className="ml-2 rounded bg-brand-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-brand-primary">
                      RECOMENDADO
                    </span>
                  </div>
                </div>
              </label>
              <label
                className={cn(
                  'flex cursor-pointer items-center gap-2.5 rounded-lg border p-3 transition-colors',
                  customCanvas
                    ? 'border-brand-primary bg-brand-primary/5'
                    : 'border-border hover:bg-surface-2',
                )}
              >
                <input
                  type="radio"
                  className="accent-brand-primary"
                  checked={customCanvas}
                  onChange={() => form.setValue('customCanvas', true)}
                />
                <div className="text-[13px] font-semibold">Personalizar dimensões</div>
              </label>
            </div>

            {customCanvas && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="grid gap-1">
                  <Label htmlFor="canvas-width" className="text-[12px]">
                    <Maximize2 size={13} className="inline" /> Largura (m)
                  </Label>
                  <Input
                    id="canvas-width"
                    type="number"
                    min={1}
                    step={0.5}
                    placeholder={`padrão: ${venueWidth}`}
                    {...form.register('canvasWidth')}
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="canvas-height" className="text-[12px]">Profundidade (m)</Label>
                  <Input
                    id="canvas-height"
                    type="number"
                    min={1}
                    step={0.5}
                    placeholder={`padrão: ${venueHeight}`}
                    {...form.register('canvasHeight')}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-brand-primary text-primary-foreground hover:bg-brand-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar evento'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
