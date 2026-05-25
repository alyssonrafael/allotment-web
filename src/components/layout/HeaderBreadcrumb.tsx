import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { useEventQuery } from '#/hooks/useEvents'
import { useUIStore } from '#/stores/uiStore'

export function HeaderBreadcrumb() {
  const activeEventId = useUIStore((s) => s.activeEventId)
  const { data: event } = useEventQuery(activeEventId ?? undefined)

  return (
    <nav aria-label="Trilha" className="flex min-w-0 items-center gap-1.5 text-[13px]">
      <Link
        to="/"
        className="font-semibold text-fg-muted transition-colors hover:text-fg"
      >
        Pavilhões
      </Link>

      <Separator />

      {event ? (
        <Link
          to="/venues/$venueId"
          params={{ venueId: event.venue.id }}
          className="max-w-40 truncate font-semibold text-fg-muted transition-colors hover:text-fg"
        >
          {event.venue.name}
        </Link>
      ) : (
        <SkeletonChunk width={120} />
      )}

      <Separator />

      {event ? (
        <span className="max-w-60 truncate font-extrabold text-fg">{event.name}</span>
      ) : (
        <SkeletonChunk width={160} />
      )}
    </nav>
  )
}

function Separator() {
  return <ChevronRight size={14} className="shrink-0 text-fg-subtle" aria-hidden />
}

function SkeletonChunk({ width }: { width: number }) {
  return (
    <span
      aria-hidden
      className="inline-block h-3.5 animate-pulse rounded bg-surface-2"
      style={{ width }}
    />
  )
}
