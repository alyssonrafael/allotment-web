import { useCallback, useEffect, useRef, useState } from 'react'

interface UseAutosaveOptions {
  enabled: boolean
  delay?: number
  onFlush: (ids: Array<string>) => void
}

/**
 * Acumula IDs com mudanças pendentes e dispara `onFlush` após `delay` ms sem
 * novas chamadas a `schedule`. Cada chamada nova reseta o timer.
 *
 * Expõe `isPending` para a UI mostrar "Salvando em Ns…" e oferecer um Cancelar.
 */
export function useAutosave({ enabled, delay = 2000, onFlush }: UseAutosaveOptions) {
  const pendingRef = useRef<Set<string>>(new Set())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onFlushRef = useRef(onFlush)
  const enabledRef = useRef(enabled)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    onFlushRef.current = onFlush
  }, [onFlush])

  useEffect(() => {
    enabledRef.current = enabled
    if (!enabled && timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
      pendingRef.current.clear()
      setIsPending(false)
    }
  }, [enabled])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const schedule = useCallback(
    (id: string) => {
      if (!enabledRef.current) return
      pendingRef.current.add(id)
      if (timerRef.current) clearTimeout(timerRef.current)
      setIsPending(true)
      timerRef.current = setTimeout(() => {
        const ids = Array.from(pendingRef.current)
        pendingRef.current.clear()
        timerRef.current = null
        setIsPending(false)
        if (ids.length > 0) onFlushRef.current(ids)
      }, delay)
    },
    [delay],
  )

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    pendingRef.current.clear()
    setIsPending(false)
  }, [])

  return { schedule, cancel, isPending }
}
