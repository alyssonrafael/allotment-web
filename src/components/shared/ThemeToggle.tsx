import { Moon, Sun } from 'lucide-react'
import { cn } from '#/lib/utils.ts'
import { useThemeTransition } from '#/hooks/useThemeTransition'

export function ThemeToggle() {
  const { theme, toggle } = useThemeTransition()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Alternar tema"
      aria-pressed={isDark}
      className={cn(
        'relative h-7 w-13 rounded-full border bg-surface-2',
        'transition-colors hover:bg-surface-3 cursor-pointer',
      )}
    >
      <span
        className={cn(
          'pointer-events-none absolute inset-y-0 left-1.5 flex items-center text-fg-subtle transition-opacity',
          isDark ? 'opacity-0' : 'opacity-70',
        )}
      >
        <Moon size={12} />
      </span>
      <span
        className={cn(
          'pointer-events-none absolute inset-y-0 right-1.5 flex items-center text-fg-subtle transition-opacity',
          isDark ? 'opacity-70' : 'opacity-0',
        )}
      >
        <Sun size={12} />
      </span>
      <span
        className={cn(
          'absolute top-0.5 left-0.5 flex h-6 w-6 items-center justify-center rounded-full text-white shadow-md transition-transform duration-300 ease-out',
          isDark
            ? 'translate-x-0 bg-brand-accent'
            : 'translate-x-6 bg-brand-primary',
        )}
      >
        {isDark ? <Moon size={13} /> : <Sun size={13} />}
      </span>
    </button>
  )
}
