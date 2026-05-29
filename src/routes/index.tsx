import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Building2, CalendarDays, CheckCircle2, Plus, Search, Sparkles } from 'lucide-react'
import { useVenuesQuery } from '#/hooks/useVenues'
import { useEventsQuery } from '#/hooks/useEvents'
import { ThemeToggle } from '#/components/shared/ThemeToggle'
import { Button } from '#/components/ui/button'
import { Card } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Skeleton } from '#/components/ui/skeleton'
import { VenueCard } from '#/components/venues/VenueCard'
import { CreateVenueDialog } from '#/components/venues/CreateVenueDialog'
import { VenueAIDialog } from '#/components/ai/VenueAIDialog'
import type { EventListItem } from '#/types'

export const Route = createFileRoute('/')({
  component: HomeScreen,
})

function HomeScreen() {
  const venuesQuery = useVenuesQuery()
  const eventsQuery = useEventsQuery()
  const [isCreateVenueOpen, setCreateVenueOpen] = useState(false)
  const [isCreateVenueAIOpen, setCreateVenueAIOpen] = useState(false)
  const [query, setQuery] = useState('')

  const venues = venuesQuery.data ?? []
  const events = eventsQuery.data ?? []

  const eventsByVenue = useMemo(() => {
    const map: Record<string, EventListItem[]> = {}
    for (const event of events) {
      map[event.venueId] = [...(map[event.venueId] ?? []), event]
    }
    return map
  }, [events])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return venues
    return venues.filter((v) =>
      `${v.name} ${v.city} ${v.state}`.toLowerCase().includes(q),
    )
  }, [venues, query])

  const stats = useMemo(
    () => ({
      venues: venues.length,
      events: events.length,
      active: events.filter((e) => e.status === 'active').length,
    }),
    [venues, events],
  )

  const isLoading = venuesQuery.isLoading || eventsQuery.isLoading
  const isError = venuesQuery.isError || eventsQuery.isError
  const error = venuesQuery.error ?? eventsQuery.error

  return (
    <div className="min-h-screen bg-background text-fg">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-8 py-5">
          <h1 className="min-w-0 text-h1 text-fg">Pavilhões</h1>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <section className="animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out mx-auto max-w-7xl px-8 py-8">
        <HeroBanner stats={stats} />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-md">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
            />
            <Input
              placeholder="Buscar pavilhão por nome ou cidade…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setCreateVenueAIOpen(true)}>
              <Sparkles size={16} />
              Criar com IA
            </Button>
            <Button
              onClick={() => setCreateVenueOpen(true)}
              className="bg-brand-primary text-primary-foreground hover:bg-brand-primary/90"
            >
              <Plus size={16} />
              Novo pavilhão
            </Button>
          </div>
        </div>

        <div className="mt-6">
          {isLoading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-80 rounded-xl" />
              <Skeleton className="h-80 rounded-xl" />
              <Skeleton className="h-80 rounded-xl" />
            </div>
          )}

          {isError && (
            <Card className="p-6 text-[13px] text-fg-muted">
              Não foi possível conectar à API (
              {error instanceof Error ? error.message : 'erro desconhecido'}). Verifique
              se o backend está rodando em{' '}
              <code>{import.meta.env.VITE_API_URL}</code>.
            </Card>
          )}

          {!isLoading && !isError && venues.length === 0 && (
            <CreateVenueGhostCard onClick={() => setCreateVenueOpen(true)} variant="primary" />
          )}

          {!isLoading &&
            !isError &&
            venues.length > 0 &&
            filtered.length === 0 && (
              <Card className="p-8 text-center text-[13px] text-fg-muted">
                Nenhum pavilhão corresponde a <strong>“{query}”</strong>.
              </Card>
            )}

          {!isLoading && !isError && filtered.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((venue) => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  events={eventsByVenue[venue.id] ?? []}
                />
              ))}
              <CreateVenueGhostCard onClick={() => setCreateVenueOpen(true)} />
            </div>
          )}
        </div>
      </section>

      <CreateVenueDialog open={isCreateVenueOpen} onOpenChange={setCreateVenueOpen} />
      <VenueAIDialog open={isCreateVenueAIOpen} onOpenChange={setCreateVenueAIOpen} />
    </div>
  )
}

interface HeroBannerProps {
  stats: { venues: number; events: number; active: number }
}

function HeroBanner({ stats }: HeroBannerProps) {
  return (
    <Card className="overflow-hidden border border-border p-0">
      <div className="grid items-center gap-6 bg-linear-to-br from-brand-primary/10 via-brand-violet/10 to-brand-accent/10 p-7 sm:grid-cols-[1fr_auto]">
        <div className="flex min-w-0 flex-col gap-2">
          <span className="text-caption text-fg-subtle">Workspace · Pavilhões</span>
          <h2 className="text-h1 text-fg">Seus pavilhões e eventos</h2>
          <p className="max-w-xl text-[13px] text-fg-muted">
            Cadastre pavilhões físicos uma única vez e organize todos os eventos abaixo
            deles. Cada evento herda o tamanho do pavilhão automaticamente.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 sm:gap-8">
          <HeroStat
            icon={Building2}
            label="Pavilhões"
            value={stats.venues}
            color="text-brand-primary"
          />
          <HeroStat
            icon={CalendarDays}
            label="Eventos"
            value={stats.events}
            color="text-brand-accent"
          />
          <HeroStat
            icon={CheckCircle2}
            label="Em curso"
            value={stats.active}
            color="text-status-livre-text"
          />
        </div>
      </div>
    </Card>
  )
}

interface HeroStatProps {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: number
  color: string
}

function HeroStat({ icon: Icon, label, value, color }: HeroStatProps) {
  return (
    <div className="flex min-w-0 flex-col items-start">
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-fg-muted">
        <Icon size={12} className={color} />
        {label}
      </span>
      <span className={`mt-1 text-[22px] font-extrabold leading-none tabular-nums sm:text-[28px] ${color}`}>
        {value}
      </span>
    </div>
  )
}

interface CreateVenueGhostCardProps {
  onClick: () => void
  variant?: 'default' | 'primary'
}

function CreateVenueGhostCard({ onClick, variant = 'default' }: CreateVenueGhostCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full min-h-80 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-transparent p-6 text-center transition-colors hover:border-brand-primary hover:bg-brand-primary/5"
    >
      <span className="flex size-14 items-center justify-center rounded-xl border border-border bg-card text-fg-muted shadow-sm transition-colors group-hover:border-brand-primary group-hover:text-brand-primary">
        <Plus size={22} />
      </span>
      <div className="flex flex-col gap-1">
        <div className="text-[14px] font-extrabold text-fg group-hover:text-brand-primary">
          {variant === 'primary' ? 'Criar primeiro pavilhão' : 'Cadastrar pavilhão'}
        </div>
        <p className="max-w-55 text-[11.5px] text-fg-subtle">
          Escolha entre tamanhos pré-definidos ou customize.
        </p>
      </div>
    </button>
  )
}
