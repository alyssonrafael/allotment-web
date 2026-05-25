import { Link } from '@tanstack/react-router'
import { Card } from '#/components/ui/card'
import { EVENT_STATUS_TOKENS } from '#/lib/constants'
import { fmtDate } from '#/lib/format'
import type { EventListItem, EventStatus, VenueListItem } from '#/types'

interface VenueCardProps {
  venue: VenueListItem
  events: EventListItem[]
}

const MAX_EVENT_PREVIEW = 3

const STATUS_ORDER: Record<EventStatus, number> = {
  active: 0,
  upcoming: 1,
  finished: 2,
}

export function VenueCard({ venue, events }: VenueCardProps) {
  const stats = computeStats(events)
  const previewEvents = sortByProximity(events).slice(0, MAX_EVENT_PREVIEW)

  return (
    <Link
      to="/venues/$venueId"
      params={{ venueId: venue.id }}
      className="group block transition-transform hover:-translate-y-0.5"
    >
      <Card className="flex h-full flex-col overflow-hidden p-0 transition-shadow group-hover:shadow-lg">
        <div
          className="relative flex h-36 flex-col justify-between p-4 text-white"
          style={{ background: venue.photo }}
        >
          <div className="flex justify-end">
            <span className="rounded-full bg-white/25 px-3 py-1 text-[11px] font-bold backdrop-blur-sm">
              {venue.width}×{venue.height}m
            </span>
          </div>
          <div>
            <div className="text-h2 font-extrabold drop-shadow-sm">{venue.name}</div>
            <div className="mt-0.5 text-[12px] font-semibold text-white/90">
              {venue.city} · {venue.state}
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-surface-2/40 p-3">
            <Stat label="Eventos" value={stats.total} tone="fg" />
            <Stat label="Em curso" value={stats.active} tone="green" />
            <Stat label="Próximos" value={stats.upcoming} tone="blue" />
          </div>

          {previewEvents.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {previewEvents.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </ul>
          ) : (
            <div className="rounded-md border border-dashed border-border px-3 py-4 text-center text-[12px] text-fg-subtle">
              Sem eventos cadastrados
            </div>
          )}
        </div>
      </Card>
    </Link>
  )
}

interface StatProps {
  label: string
  value: number
  tone: 'fg' | 'green' | 'blue'
}

function Stat({ label, value, tone }: StatProps) {
  const color =
    tone === 'green'
      ? 'text-status-livre-text'
      : tone === 'blue'
        ? 'text-brand-primary'
        : 'text-fg'
  return (
    <div className="flex flex-col items-start">
      <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">
        {label}
      </span>
      <span className={`text-[18px] font-extrabold tabular-nums ${color}`}>{value}</span>
    </div>
  )
}

function EventRow({ event }: { event: EventListItem }) {
  const tone = EVENT_STATUS_TOKENS[event.status]
  return (
    <li className="flex items-center justify-between gap-3 text-[12px]">
      <span className="flex min-w-0 items-center gap-2">
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: tone.color }}
          aria-label={tone.label}
        />
        <span className="truncate font-semibold text-fg">{event.name}</span>
      </span>
      <span className="shrink-0 text-mono text-[11px] text-fg-subtle">
        {fmtDate(event.startDate)}
      </span>
    </li>
  )
}

function sortByProximity(events: EventListItem[]): EventListItem[] {
  return [...events].sort((a, b) => {
    const so = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    if (so !== 0) return so
    const da = new Date(a.startDate).getTime()
    const db = new Date(b.startDate).getTime()
    return a.status === 'finished' ? db - da : da - db
  })
}

function computeStats(events: EventListItem[]): Record<EventStatus | 'total', number> {
  const stats = {
    total: events.length,
    upcoming: 0,
    active: 0,
    finished: 0,
  }
  for (const event of events) stats[event.status] += 1
  return stats
}
