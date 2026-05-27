import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { CalendarDays, Loader2, Maximize2 } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { format, parse } from 'date-fns'
import { ptBR } from 'date-fns/locale'
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
import { Calendar } from '#/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '#/components/ui/popover'
import { useCreateEvent } from '#/hooks/useEvents'

function parseDateISO(value: string): Date | undefined {
  if (!value) return undefined
  const d = parse(value, 'yyyy-MM-dd', new Date())
  return isNaN(d.getTime()) ? undefined : d
}

function formatDateISO(date: Date | undefined): string {
  return date ? format(date, 'yyyy-MM-dd') : ''
}

function formatDateBR(value: string): string {
  const d = parseDateISO(value)
  return d ? format(d, "dd 'de' MMMM, yyyy", { locale: ptBR }) : ''
}

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
              <DatePickerField
                value={form.watch('startDate')}
                onChange={(iso) => form.setValue('startDate', iso, { shouldValidate: true })}
                invalid={Boolean(errors.startDate)}
                placeholder="Selecionar data"
              />
              {errors.startDate && (
                <p className="text-[12px] text-status-erro-text">{errors.startDate.message}</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="event-end">
                <CalendarDays size={14} className="inline" /> Término
              </Label>
              <DatePickerField
                value={form.watch('endDate')}
                onChange={(iso) => form.setValue('endDate', iso, { shouldValidate: true })}
                invalid={Boolean(errors.endDate)}
                placeholder="Selecionar data"
                minDate={parseDateISO(form.watch('startDate'))}
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

interface DatePickerFieldProps {
  value: string
  onChange: (iso: string) => void
  invalid?: boolean
  placeholder?: string
  minDate?: Date
}

function DatePickerField({
  value,
  onChange,
  invalid,
  placeholder = 'Selecionar data',
  minDate,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false)
  const selected = parseDateISO(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-invalid={invalid}
          className={cn(
            'inline-flex h-9 w-full items-center justify-between rounded-md border bg-transparent px-3 py-1 text-[13px] shadow-xs transition-colors',
            'hover:bg-surface-2',
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none',
            invalid
              ? 'border-status-erro text-status-erro-text'
              : 'border-border text-fg',
            !selected && 'text-fg-subtle',
          )}
        >
          <span className="truncate">
            {selected ? formatDateBR(value) : placeholder}
          </span>
          <CalendarDays size={14} className="ml-2 shrink-0 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={ptBR}
          selected={selected}
          defaultMonth={selected ?? minDate}
          captionLayout="dropdown"
          disabled={minDate ? { before: minDate } : undefined}
          onSelect={(date) => {
            onChange(formatDateISO(date))
            if (date) setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
