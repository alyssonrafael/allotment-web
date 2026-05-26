import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useGlobalHotkeys } from '#/hooks/useGlobalHotkeys'

interface AppShellProps {
  actions?: React.ReactNode
  children: React.ReactNode
}

export function AppShell({ actions, children }: AppShellProps) {
  useGlobalHotkeys()

  return (
    <div className="flex h-screen overflow-hidden bg-background text-fg">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header actions={actions} />
        <main className="flex-1 overflow-y-auto px-7 py-6">
          <div className="mx-auto w-full max-w-375">{children}</div>
        </main>
      </div>
    </div>
  )
}
