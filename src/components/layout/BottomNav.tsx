import { Link, useParams, useRouterState } from '@tanstack/react-router'
import { Filter, LayoutDashboard, LayoutGrid, List, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '#/lib/utils.ts'

interface NavItem {
  label: string
  screen: 'dashboard' | 'pavilhao' | 'stands' | 'comercial' | 'financas'
  icon: LucideIcon
}

const NAV: Array<NavItem> = [
  { label: 'Dashboard', screen: 'dashboard', icon: LayoutDashboard },
  { label: 'Pavilhão',  screen: 'pavilhao',  icon: LayoutGrid },
  { label: 'Stands',    screen: 'stands',    icon: List },
  { label: 'Comercial', screen: 'comercial', icon: Filter },
  { label: 'Finanças',  screen: 'financas',  icon: Wallet },
]

export function BottomNav() {
  const params   = useParams({ strict: false })
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 grid h-16 grid-cols-5 border-t border-border bg-sidebar lg:hidden">
      {NAV.map((item) => {
        const to = params.eventId
          ? `/events/${params.eventId}/${item.screen}`
          : '/'
        const isActive =
          params.eventId !== undefined &&
          pathname.startsWith(`/events/${params.eventId}/${item.screen}`)
        const Icon = item.icon

        return (
          <Link
            key={item.screen}
            to={to}
            className={cn(
              'flex flex-col items-center justify-center gap-1 text-fg-muted transition-colors',
              'hover:text-fg active:scale-95',
              isActive && 'text-brand-primary',
            )}
          >
            <Icon size={20} />
            <span
              className={cn(
                'text-[10px]',
                isActive ? 'font-bold text-brand-primary' : 'font-medium',
              )}
            >
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
