import { useEffect, useState } from 'react'
import { useUIStore } from '#/stores/uiStore'

export function useCssTokens<TName extends string>(
  names: ReadonlyArray<TName>,
): Record<TName, string> {
  const theme = useUIStore((s) => s.theme)
  const [values, setValues] = useState<Record<TName, string>>(() => {
    const initial = {} as Record<TName, string>
    for (const n of names) initial[n] = ''
    return initial
  })

  const key = names.join(',')
  useEffect(() => {
    if (typeof window === 'undefined') return
    const style = getComputedStyle(document.documentElement)
    const next = {} as Record<TName, string>
    for (const n of names) next[n] = style.getPropertyValue(n).trim()
    setValues(next)
  }, [theme, key, names])

  return values
}
