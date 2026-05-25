import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Building2, Check, Loader2, MapPin, Maximize2 } from 'lucide-react'
import { cn } from '#/lib/utils'
import { VENUE_PHOTOS, VENUE_SIZE_PRESETS } from '#/lib/constants'
import type { VenuePhotoId } from '#/lib/constants'
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
import { useCreateVenue } from '#/hooks/useVenues'

const schema = z.object({
  name:         z.string().trim().min(3, 'Informe um nome com pelo menos 3 caracteres'),
  street:       z.string().trim().min(3, 'Endereço muito curto'),
  city:         z.string().trim().min(2, 'Informe a cidade'),
  state:        z.string().trim().length(2, 'Use a sigla UF (ex: SP)'),
  zipCode:      z.string().trim().optional(),
  neighborhood: z.string().trim().optional(),
  width: z.coerce
    .number({ message: 'Informe a largura em metros' })
    .positive('A largura deve ser maior que zero')
    .max(5000, 'Largura máxima de 5000 m'),
  height: z.coerce
    .number({ message: 'Informe a profundidade em metros' })
    .positive('A profundidade deve ser maior que zero')
    .max(5000, 'Profundidade máxima de 5000 m'),
})

type FormValues = z.input<typeof schema>
type ParsedValues = z.output<typeof schema>

interface CreateVenueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateVenueDialog({ open, onOpenChange }: CreateVenueDialogProps) {
  const createMutation = useCreateVenue()
  const [selectedPhotoId, setSelectedPhotoId] = useState<VenuePhotoId>('blue')
  const [activePreset, setActivePreset] = useState<string | null>('medium')
  const [showCustomSize, setShowCustomSize] = useState(false)

  const form = useForm<FormValues, undefined, ParsedValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      neighborhood: '',
      width: 40,
      height: 30,
    },
  })

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset()
      createMutation.reset()
      setSelectedPhotoId('blue')
      setActivePreset('medium')
      setShowCustomSize(false)
    }
    onOpenChange(next)
  }

  const applyPreset = (presetId: string) => {
    const preset = VENUE_SIZE_PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    form.setValue('width', preset.width)
    form.setValue('height', preset.height)
    setActivePreset(presetId)
    setShowCustomSize(false)
  }

  const selectedPhoto = VENUE_PHOTOS.find((p) => p.id === selectedPhotoId) ?? VENUE_PHOTOS[0]

  const onSubmit = form.handleSubmit((values) => {
    createMutation.mutate(
      {
        name:   values.name,
        street: values.street || undefined,
        city:   values.city,
        state:  values.state,
        ...(values.zipCode      ? { zipCode:      values.zipCode }      : {}),
        ...(values.neighborhood ? { neighborhood: values.neighborhood } : {}),
        width:  values.width,
        height: values.height,
        accent: selectedPhoto.accent,
        photo:  selectedPhoto.photo,
      },
      {
        onSuccess: (created) => {
          toast.success('Pavilhão criado', {
            description: `${created.name} está pronto para receber eventos.`,
          })
          handleOpenChange(false)
        },
        onError: (err) => {
          toast.error('Não foi possível criar o pavilhão', {
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
          <DialogTitle className="text-h2">Novo pavilhão</DialogTitle>
          <DialogDescription>
            Cadastre um local físico para hospedar eventos.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={onSubmit} noValidate>
          {/* Nome */}
          <div className="grid gap-1.5">
            <Label htmlFor="venue-name">
              <Building2 size={14} className="inline" /> Nome do pavilhão
            </Label>
            <Input
              id="venue-name"
              placeholder="Ex.: Centro de Convenções Norte"
              autoFocus
              {...form.register('name')}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && (
              <p className="text-[12px] text-status-erro-text">{errors.name.message}</p>
            )}
          </div>

          {/* Endereço */}
          <div className="grid gap-2">
            <Label>
              <MapPin size={14} className="inline" /> Endereço
            </Label>
            <div className="grid grid-cols-[1fr_80px_64px] gap-2">
              <div className="grid gap-1">
                <Input
                  placeholder="Cidade"
                  {...form.register('city')}
                  aria-invalid={Boolean(errors.city)}
                />
                {errors.city && (
                  <p className="text-[12px] text-status-erro-text">{errors.city.message}</p>
                )}
              </div>
              <Input
                placeholder="UF"
                maxLength={2}
                {...form.register('state')}
                aria-invalid={Boolean(errors.state)}
                className="uppercase"
              />
              <Input placeholder="CEP" {...form.register('zipCode')} />
            </div>
            <Input
              placeholder="Rua, número — ex: Av. Olavo Fontoura, 1209"
              {...form.register('street')}
              aria-invalid={Boolean(errors.street)}
            />
            {errors.street && (
              <p className="text-[12px] text-status-erro-text">{errors.street.message}</p>
            )}
            {errors.state && (
              <p className="text-[12px] text-status-erro-text">{errors.state.message}</p>
            )}
          </div>

          {/* Presets de tamanho */}
          <div className="grid gap-2">
            <Label>
              <Maximize2 size={14} className="inline" /> Tamanho do pavilhão
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {VENUE_SIZE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className={cn(
                    'flex flex-col items-center rounded-lg border px-2 py-2.5 text-[11px] transition-colors',
                    activePreset === preset.id
                      ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                      : 'border-border text-fg-muted hover:border-border-strong hover:bg-surface-2',
                  )}
                >
                  <span className="font-bold">{preset.label}</span>
                  <span className="mt-0.5 text-fg-subtle">
                    {preset.width}×{preset.height}m
                  </span>
                </button>
              ))}
            </div>

            {!showCustomSize ? (
              <button
                type="button"
                onClick={() => { setShowCustomSize(true); setActivePreset(null) }}
                className="text-left text-[12px] text-brand-primary hover:underline"
              >
                + Personalizar dimensões
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <Label htmlFor="venue-width" className="text-[12px]">Largura (m)</Label>
                  <Input
                    id="venue-width"
                    type="number"
                    min={1}
                    step={0.5}
                    {...form.register('width')}
                    aria-invalid={Boolean(errors.width)}
                  />
                  {errors.width && (
                    <p className="text-[12px] text-status-erro-text">{errors.width.message}</p>
                  )}
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="venue-height" className="text-[12px]">Profundidade (m)</Label>
                  <Input
                    id="venue-height"
                    type="number"
                    min={1}
                    step={0.5}
                    {...form.register('height')}
                    aria-invalid={Boolean(errors.height)}
                  />
                  {errors.height && (
                    <p className="text-[12px] text-status-erro-text">{errors.height.message}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cor visual */}
          <div className="grid gap-2">
            <Label>Cor visual</Label>
            <div className="flex gap-2">
              {VENUE_PHOTOS.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setSelectedPhotoId(photo.id)}
                  className={cn(
                    'relative h-9 w-full flex-1 rounded-lg transition-all',
                    selectedPhotoId === photo.id
                      ? 'ring-2 ring-fg ring-offset-2'
                      : 'opacity-70 hover:opacity-100',
                  )}
                  style={{ background: photo.photo }}
                  aria-label={`Cor ${photo.id}`}
                >
                  {selectedPhotoId === photo.id && (
                    <Check size={14} className="absolute inset-0 m-auto text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>
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
                'Criar pavilhão'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
