import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEventQuery } from '#/hooks/useEvents'
import { useUIStore } from '#/stores/uiStore'

export function HeaderBreadcrumb() {
  const activeEventId = useUIStore((s) => s.activeEventId)
  const { data: event } = useEventQuery(activeEventId ?? undefined)

  return (
    <nav aria-label="Trilha" className="flex min-w-0 items-center gap-1.5 text-[13px]">

      {/* Mobile — botão voltar + nome do evento */}
      <div className="flex min-w-0 items-center gap-1 sm:hidden">
        {event ? (
          <Link
            to="/venues/$venueId"
            params={{ venueId: event.venue.id }}
            className="shrink-0 text-fg-muted transition-colors hover:text-fg"
            aria-label="Voltar para eventos do pavilhão"
          >
            <ChevronLeft size={18} />
          </Link>
        ) : (
          <ChevronLeft size={18} className="shrink-0 text-fg-subtle" />
        )}
        {event ? (
          <span className="truncate text-[17px] font-extrabold text-fg">{event.name}</span>
        ) : (
          <SkeletonChunk width={120} />
        )}
      </div>

      {/* sm+ — breadcrumb completo */}
      <div className="hidden min-w-0 items-center gap-1.5 sm:flex">
        <Link
          to="/"
          className="shrink-0 font-semibold text-fg-muted transition-colors hover:text-fg"
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
      </div>

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
