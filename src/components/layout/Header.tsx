import { useParams, useRouterState } from '@tanstack/react-router'
import { HeaderBreadcrumb } from './HeaderBreadcrumb'
import { useUIStore } from '#/stores/uiStore'
import { ThemeToggle } from '#/components/shared/ThemeToggle'

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Visão geral',
  pavilhao:  'Editor visual',
  stands:    'Stands',
  comercial: 'Comercial',
  financas:  'Finanças',
}

interface HeaderProps {
  actions?: React.ReactNode
}

export function Header({ actions }: HeaderProps) {
  const saveStatus = useUIStore((s) => s.saveStatus)
  const params = useParams({ strict: false })
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const activeScreen = params.eventId
    ? Object.keys(PAGE_TITLES).find((screen) =>
        pathname.startsWith(`/events/${params.eventId}/${screen}`),
      )
    : undefined

  const pageTitle = activeScreen ? PAGE_TITLES[activeScreen] : undefined

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 px-7 py-3 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <HeaderBreadcrumb />
        <div className="flex items-center gap-2">
          {actions}
          <ThemeToggle />
        </div>
      </div>
      {pageTitle && (
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-[22px] font-bold leading-tight text-fg">{pageTitle}</h1>
          <SaveIndicator status={saveStatus} />
        </div>
      )}
    </header>
  )
}

function SaveIndicator({ status }: { status: 'idle' | 'saving' | 'saved' }) {
  const label = status === 'saving' ? 'Salvando…' : 'Salvo agora'
  const dot = status === 'saving' ? 'bg-brand-accent animate-pulse' : 'bg-status-livre'
  return (
    <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-fg-muted">
      <span className={`size-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}
