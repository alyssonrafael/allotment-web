import { useState } from 'react'
import { Link, useParams, useRouterState } from '@tanstack/react-router'
import {
  Building2,
  Filter,
  Keyboard,
  LayoutDashboard,
  LayoutGrid,
  List,
  MousePointerClick,
  Sparkles,
  Trash2,
  Undo2,
  Wallet,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEventQuery } from '#/hooks/useEvents'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { cn } from '#/lib/utils.ts'

// ── nav ────────────────────────────────────────────────────────────────────

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

// ── shortcuts ──────────────────────────────────────────────────────────────

interface ShortcutItem {
  keys: string[]
  label: string
  icon: LucideIcon
}

interface ShortcutGroup {
  label: string
  items: ShortcutItem[]
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    label: 'Navegação',
    items: [
      { keys: ['G', 'D'], label: 'Ir para Dashboard',  icon: LayoutDashboard },
      { keys: ['G', 'P'], label: 'Ir para Pavilhão',   icon: LayoutGrid },
      { keys: ['G', 'S'], label: 'Ir para Stands',     icon: List },
      { keys: ['G', 'C'], label: 'Ir para Comercial',  icon: Filter },
      { keys: ['G', 'F'], label: 'Ir para Finanças',   icon: Wallet },
    ],
  }
]

// Atalho do dia — rotação determinística por dia do calendário
const DAY_TIPS = SHORTCUT_GROUPS[0].items  // somente navegação para o tip
const dayIndex = Math.floor(Date.now() / 86_400_000)
const todayTip = DAY_TIPS[dayIndex % DAY_TIPS.length]

// ── component ──────────────────────────────────────────────────────────────

export function Sidebar() {
  const params   = useParams({ strict: false })
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const eventQuery = useEventQuery(params.eventId)
  const venueId = eventQuery.data?.venue.id

  return (
    <>
      <aside className="flex h-screen w-60 flex-col border-r border-border bg-sidebar px-4 py-5">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand-primary text-base font-extrabold text-primary-foreground shadow-md">
            A
          </span>
          <div className="leading-tight">
            <div className="text-[13px] font-extrabold text-fg">Allotment</div>
            <div className="text-[11px] text-fg-subtle">Manager · v1.0</div>
          </div>
        </div>

        {/* Section label */}
        <div className="mt-7 flex items-center gap-2 px-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-fg-subtle">
            Workspace
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Nav */}
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
                    'absolute left-0 h-5 w-0.75 rounded-r-full bg-brand-primary opacity-0 transition-opacity',
                    isActive && 'opacity-100',
                  )}
                />
                <Icon size={16} className={isActive ? 'text-brand-primary' : ''} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Atalho do dia + botão pavilhão */}
        <div className="mt-auto flex flex-col gap-2 px-2">
          <button
            onClick={() => setShortcutsOpen(true)}
            className="w-full rounded-xl border border-border bg-surface-2/60 p-3 text-left transition-colors hover:bg-surface-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-brand-violet">
                <Sparkles size={12} />
                Atalho do dia
              </div>
              <Keyboard size={11} className="text-fg-subtle" />
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              {todayTip.keys.map((k) => (
                <Kbd key={k}>{k}</Kbd>
              ))}
              {todayTip.keys.length > 1 && (
                <span className="text-[10px] text-fg-subtle">→</span>
              )}
            </div>
            <p className="mt-1.5 text-[12px] text-fg-muted">{todayTip.label}</p>
            <p className="mt-2 text-[10px] text-fg-subtle">Clique para ver todos os atalhos</p>
          </button>

          <Link
            to={venueId ? `/venues/${venueId}` : '/'}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-2/60 px-3 py-2.5 text-[13px] font-semibold text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <Building2 size={14} />
            Eventos do pavilhão
          </Link>
        </div>
      </aside>

      {/* Modal de atalhos */}
      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard size={16} className="text-brand-primary" />
              Atalhos de teclado
            </DialogTitle>
          </DialogHeader>
          <div className="mt-1 space-y-5">
            {SHORTCUT_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-fg-subtle">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <div
                        key={item.label}
                        className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-surface-2"
                      >
                        <div className="flex items-center gap-2.5 text-[13px] text-fg-muted">
                          <Icon size={14} className="shrink-0 text-fg-subtle" />
                          {item.label}
                        </div>
                        <div className="flex items-center gap-1">
                          {item.keys.map((k, i) => (
                            <span key={k} className="flex items-center gap-1">
                              <Kbd>{k}</Kbd>
                              {i < item.keys.length - 1 && (
                                <span className="text-[10px] text-fg-subtle">+</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── Kbd ───────────────────────────────────────────────────────────────────

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center rounded border border-border bg-surface-3 px-1.5 py-0.5 font-mono text-[10px] font-bold text-fg">
      {children}
    </span>
  )
}
