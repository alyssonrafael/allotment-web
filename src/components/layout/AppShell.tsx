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
    <div className="flex min-h-screen bg-background text-fg">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header actions={actions} />
        <main className="flex-1 overflow-auto px-7 py-6">
          <div className="mx-auto w-full max-w-[1500px]">{children}</div>
        </main>
      </div>
    </div>
  )
}
