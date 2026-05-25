import { useMemo, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  DollarSign,
  LayoutGrid,
  MapPin,
  Plus,
  TrendingUp,
} from 'lucide-react'
import { useVenueQuery, useVenueRevenueQuery } from '#/hooks/useVenues'
import { useEventsQuery } from '#/hooks/useEvents'
import { ThemeToggle } from '#/components/shared/ThemeToggle'
import { Button } from '#/components/ui/button'
import { Card } from '#/components/ui/card'
import { Skeleton } from '#/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { EventCard } from '#/components/events/EventCard'
import { CreateEventDialog } from '#/components/events/CreateEventDialog'
import { fmtBRLcompact, formatVenueAddress } from '#/lib/format'
import type { EventListItem, EventRevenue, EventStatus } from '#/types'

type FilterValue = 'all' | EventStatus

export const Route = createFileRoute('/venues/$venueId')({
  component: VenueDetailScreen,
})

function VenueDetailScreen() {
  const { venueId } = Route.useParams()
  const venueQuery = useVenueQuery(venueId)
  const eventsQuery = useEventsQuery({ venueId })
  const revenueQuery = useVenueRevenueQuery(venueId)
  const [isCreateEventOpen, setCreateEventOpen] = useState(false)
  const [tab, setTab] = useState<FilterValue>('all')

  const venue = venueQuery.data
  const events = eventsQuery.data ?? []

  const counts = useMemo(
    () => ({
      all: events.length,
      upcoming: events.filter((e) => e.status === 'upcoming').length,
      active: events.filter((e) => e.status === 'active').length,
      finished: events.filter((e) => e.status === 'finished').length,
    }),
    [events],
  )

  const filteredEvents = useMemo(
    () => (tab === 'all' ? events : events.filter((e) => e.status === tab)),
    [events, tab],
  )

  const isLoading = venueQuery.isLoading || eventsQuery.isLoading
  const isError = venueQuery.isError || eventsQuery.isError
  const error = venueQuery.error ?? eventsQuery.error

  return (
    <div className="min-h-screen bg-background text-fg">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-8 py-5">
          <nav
            aria-label="Trilha"
            className="flex min-w-0 items-center gap-2"
          >
            <Link
              to="/"
              className="shrink-0 text-h1 text-fg-muted transition-colors hover:text-fg"
            >
              Pavilhões
            </Link>
            <ChevronRight size={20} className="shrink-0 text-fg-subtle" aria-hidden />
            <h1 className="truncate text-h1 text-fg">
              {venue?.name ?? 'Carregando…'}
            </h1>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <section className="animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out mx-auto max-w-7xl px-8 py-8">
        {isLoading && (
          <>
            <Skeleton className="h-56 rounded-2xl" />
            <Skeleton className="mt-4 h-20 rounded-2xl" />
            <Skeleton className="mt-6 h-9 w-96 rounded-lg" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-32 rounded-lg" />
            </div>
          </>
        )}

        {isError && (
          <Card className="p-6 text-[13px] text-fg-muted">
            Não foi possível carregar o pavilhão (
            {error instanceof Error ? error.message : 'erro desconhecido'}).
          </Card>
        )}

        {!isLoading && !isError && venue && (
          <>
            <PavilionHero
              venue={venue}
              counts={counts}
              revenue={revenueQuery.data}
              onNewEvent={() => setCreateEventOpen(true)}
            />

            <Tabs
              value={tab}
              onValueChange={(value) => setTab(value as FilterValue)}
              className="mt-6"
            >
              <TabsList variant="line">
                <FilterTab value="all" label="Todos" count={counts.all} />
                <FilterTab value="upcoming" label="Próximos" count={counts.upcoming} />
                <FilterTab value="active" label="Em curso" count={counts.active} />
                <FilterTab value="finished" label="Encerrados" count={counts.finished} />
              </TabsList>

              <TabsContent value={tab} className="mt-5">
                <EventList events={filteredEvents} filter={tab} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </section>

      {venue && (
        <CreateEventDialog
          open={isCreateEventOpen}
          onOpenChange={setCreateEventOpen}
          venueId={venue.id}
          venueName={venue.name}
          venueWidth={venue.width}
          venueHeight={venue.height}
        />
      )}
    </div>
  )
}

interface PavilionHeroProps {
  venue: NonNullable<ReturnType<typeof useVenueQuery>['data']>
  counts: Record<FilterValue, number>
  revenue: EventRevenue | undefined
  onNewEvent: () => void
}

function PavilionHero({ venue, counts, revenue, onNewEvent }: PavilionHeroProps) {
  const fullAddress = formatVenueAddress(venue, 'full')
  const area = venue.width * venue.height

  return (
    <Card className="overflow-hidden p-0">
      {/* Gradient top section */}
      <div
        className="relative flex min-h-44 flex-col justify-end text-white"
        style={{ background: venue.photo }}
      >
        <div className="flex flex-col gap-1.5 p-7">
          <span className="text-white font-semibold">Pavilhão</span>
          <h2 className="text-display leading-none text-white">
            {venue.name}
          </h2>
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-white/90">
            <MapPin size={14} className="shrink-0" />
            <span className="truncate">{fullAddress}</span>
          </div>
        </div>

        <div className="absolute right-7 bottom-5">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-3 py-1.5 text-[12px] font-bold text-white backdrop-blur-sm">
            {venue.width}×{venue.height}m · {area}m²
          </span>
        </div>
      </div>

      {/* Stats bottom section — same card, surface background */}
      <div className="grid grid-cols-2 gap-6 px-7 py-5 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] sm:items-center">
        <Kpi
          icon={CalendarDays}
          label="Eventos"
          value={counts.all}
          tone="text-brand-primary"
        />
        <Kpi
          icon={CheckCircle2}
          label="Em curso"
          value={counts.active}
          tone="text-status-livre-text"
        />
        <Kpi
          icon={DollarSign}
          label="Receita realizada"
          value={revenue ? fmtBRLcompact(revenue.realized) : '—'}
          tone="text-brand-accent"
        />
        <Kpi
          icon={TrendingUp}
          label="Em negociação"
          value={revenue ? fmtBRLcompact(revenue.inNegotiation) : '—'}
          tone="text-brand-primary"
        />
        <Button
          onClick={onNewEvent}
          className="bg-brand-primary text-primary-foreground hover:bg-brand-primary/90"
        >
          <Plus size={16} />
          Novo evento
        </Button>
      </div>
    </Card>
  )
}

interface KpiProps {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: number | string
  tone: string
}

function Kpi({ icon: Icon, label, value, tone }: KpiProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-fg-muted">
        <Icon size={12} className={tone} />
        {label}
      </span>
      <span className={`text-[22px] font-extrabold leading-none tabular-nums ${tone}`}>
        {value}
      </span>
    </div>
  )
}

interface FilterTabProps {
  value: FilterValue
  label: string
  count: number
}

function FilterTab({ value, label, count }: FilterTabProps) {
  return (
    <TabsTrigger value={value} className="gap-1.5">
      {label}
      <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold text-fg-muted">
        {count}
      </span>
    </TabsTrigger>
  )
}

interface EventListProps {
  events: EventListItem[]
  filter: FilterValue
}

const EMPTY_LABELS: Record<FilterValue, string> = {
  all: 'Nenhum evento cadastrado neste pavilhão.',
  upcoming: 'Nenhum evento próximo.',
  active: 'Nenhum evento em curso.',
  finished: 'Nenhum evento encerrado.',
}

function EventList({ events, filter }: EventListProps) {
  if (events.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 p-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-surface-2 text-fg-muted">
          <LayoutGrid size={20} />
        </div>
        <p className="text-[13px] text-fg-muted">{EMPTY_LABELS[filter]}</p>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event, i) => (
        <EventCard key={event.id} event={event} index={i} />
      ))}
    </div>
  )
}
