import { Link, useParams, useRouterState } from '@tanstack/react-router'
import {
  Filter,
  LayoutDashboard,
  LayoutGrid,
  List,
  Sparkles,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '#/lib/utils.ts'
import { ThemeToggle } from '#/components/shared/ThemeToggle'

interface NavItem {
  label: string
  screen: 'dashboard' | 'pavilhao' | 'stands' | 'comercial' | 'financas'
  icon: LucideIcon
}

const NAV: Array<NavItem> = [
  { label: 'Dashboard', screen: 'dashboard', icon: LayoutDashboard },
  { label: 'Pavilhão', screen: 'pavilhao', icon: LayoutGrid },
  { label: 'Stands', screen: 'stands', icon: List },
  { label: 'Comercial', screen: 'comercial', icon: Filter },
  { label: 'Finanças', screen: 'financas', icon: Wallet },
]

export function Sidebar() {
  const params = useParams({ strict: false })
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <aside className="flex h-screen w-[240px] flex-col border-r border-border bg-sidebar px-4 py-5">
      <div className="flex items-center gap-3 px-2">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand-primary text-base font-extrabold text-primary-foreground shadow-md">
          A
        </span>
        <div className="leading-tight">
          <div className="text-[13px] font-extrabold text-fg">Allotment</div>
          <div className="text-[11px] text-fg-subtle">Manager · v1.0</div>
        </div>
      </div>

      <div className="mt-7 px-2 text-caption">Workspace</div>

      <nav className="mt-2 flex flex-col gap-0.5">
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
                'group relative flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-semibold text-fg-muted',
                'transition-colors hover:bg-surface-2 hover:text-fg',
                isActive && 'bg-surface-2 text-fg',
              )}
            >
              <span
                className={cn(
                  'absolute left-0 h-5 w-[3px] rounded-r-full bg-brand-primary opacity-0 transition-opacity',
                  isActive && 'opacity-100',
                )}
              />
              <Icon size={16} className={isActive ? 'text-brand-primary' : ''} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <div className="rounded-xl border border-border bg-surface-2/60 p-3">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-brand-violet">
            <Sparkles size={12} />
            Atalho do dia
          </div>
          <div className="mt-2 text-[12px] text-fg-muted">
            Pressione <span className="kbd">G</span> + <span className="kbd">P</span> para abrir o
            editor de pavilhão.
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-brand-violet/15 text-[11px] font-extrabold text-brand-violet">
              LM
            </span>
            <div className="leading-tight">
              <div className="text-[12px] font-bold text-fg">Lucas M.</div>
              <div className="text-[10.5px] text-fg-subtle">Gestor</div>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}
