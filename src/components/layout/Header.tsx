import { HeaderBreadcrumb } from './HeaderBreadcrumb'
import { ThemeToggle } from '#/components/shared/ThemeToggle'

interface HeaderProps {
  actions?: React.ReactNode
}

export function Header({ actions }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-7">
      <HeaderBreadcrumb />
      <div className="flex items-center gap-2">
        {actions}
        <ThemeToggle />
      </div>
    </header>
  )
}
