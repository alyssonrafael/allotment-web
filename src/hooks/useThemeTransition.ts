import { useEffect } from 'react'
import { useUIStore } from '#/stores/uiStore'

export function useThemeTransition() {
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggle = (e?: React.MouseEvent) => {
    const next = theme === 'dark' ? 'light' : 'dark'
    const x = e?.clientX ?? window.innerWidth / 2
    const y = e?.clientY ?? window.innerHeight / 2
    const r = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    )

    const apply = () => {
      document.documentElement.classList.toggle('dark', next === 'dark')
      try {
        window.localStorage.setItem('theme', next)
      } catch {
        // ignore (e.g. privacy mode)
      }
      setTheme(next)
    }

    const startViewTransition = (
      document as Document & {
        startViewTransition?: (cb: () => void) => { ready: Promise<void> }
      }
    ).startViewTransition

    if (typeof startViewTransition !== 'function') {
      apply()
      return
    }

    const transition = startViewTransition.call(document, apply)
    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${r}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 520,
          easing: 'cubic-bezier(.22,.61,.36,1)',
          pseudoElement: '::view-transition-new(root)',
        },
      )
    })
  }

  return { theme, toggle }
}
