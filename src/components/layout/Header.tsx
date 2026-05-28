import { useRouterState } from '@tanstack/react-router'
import { HeaderBreadcrumb } from './HeaderBreadcrumb'
import { ThemeToggle } from '#/components/shared/ThemeToggle'

const SUBTITLES: Record<string, string> = {
  dashboard: 'Visão geral',
  pavilhao: 'Editor de stands',
  stands: 'Lista e filtros',
  comercial: 'Pipeline de vendas',
  financas: 'Receitas e análise',
}

interface HeaderProps {
  actions?: React.ReactNode
}

export function Header({ actions }: HeaderProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const segment = pathname.split('/').at(-1) ?? ''
  const subtitle = SUBTITLES[segment]

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-7">
      <div className="flex min-w-0 flex-col justify-center gap-0.5">
        <HeaderBreadcrumb />
        {subtitle && (
          <span className="text-[11px] text-fg-subtle">{subtitle}</span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {actions}
        <ThemeToggle />
      </div>
    </header>
  )
}
