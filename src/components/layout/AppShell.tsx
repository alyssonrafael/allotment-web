import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { useGlobalHotkeys } from '#/hooks/useGlobalHotkeys'

interface AppShellProps {
  actions?: React.ReactNode
  children: React.ReactNode
}

export function AppShell({ actions, children }: AppShellProps) {
  useGlobalHotkeys()

  return (
    <div className="flex h-screen overflow-hidden bg-background text-fg">
      <div className="hidden lg:flex">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header actions={actions} />
        <main className="flex-1 overflow-y-auto px-4 py-4 pb-20 sm:px-6 sm:py-5 lg:px-7 lg:py-6 lg:pb-6">
          <div className="mx-auto w-full max-w-375">{children}</div>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
