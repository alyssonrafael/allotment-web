import { Bell } from 'lucide-react'
import { HeaderBreadcrumb } from './HeaderBreadcrumb'
import { useUIStore } from '#/stores/uiStore'

interface HeaderProps {
  actions?: React.ReactNode
}

export function Header({ actions }: HeaderProps) {
  const saveStatus = useUIStore((s) => s.saveStatus)

  return (
    <header className="sticky top-0 z-10 flex h-[72px] items-center gap-4 border-b border-border bg-background/80 px-7 backdrop-blur-md">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <HeaderBreadcrumb />
        <SaveIndicator status={saveStatus} />
      </div>
      <div className="ml-auto flex items-center gap-2">
        {actions}
        <button
          type="button"
          aria-label="Notificações"
          className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-card text-fg-muted transition-colors hover:bg-surface-2"
        >
          <Bell size={15} />
        </button>
      </div>
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
