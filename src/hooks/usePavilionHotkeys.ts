import { useEffect } from 'react'

interface UsePavilionHotkeysOptions {
  enabled?: boolean
  onDelete?: () => void
  onSelectAll?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onZoomIn?: () => void
  onZoomOut?: () => void
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  )
}

export function usePavilionHotkeys({
  enabled = true,
  onDelete,
  onSelectAll,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
}: UsePavilionHotkeysOptions) {
  useEffect(() => {
    if (!enabled) return
    function onKeyDown(e: KeyboardEvent) {
      if (isEditableTarget(e.target)) return

      const mod = e.metaKey || e.ctrlKey
      const k = e.key.toLowerCase()

      if (mod && k === 'z') {
        if (e.shiftKey) {
          if (onRedo) {
            e.preventDefault()
            onRedo()
          }
        } else {
          if (onUndo) {
            e.preventDefault()
            onUndo()
          }
        }
        return
      }

      if (mod && k === 'y') {
        if (onRedo) {
          e.preventDefault()
          onRedo()
        }
        return
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && onDelete) {
        e.preventDefault()
        onDelete()
        return
      }

      if (mod && k === 'a' && onSelectAll) {
        e.preventDefault()
        onSelectAll()
        return
      }

      // Zoom: + (com ou sem shift) e =, − e _
      if ((e.key === '+' || e.key === '=') && onZoomIn) {
        e.preventDefault()
        onZoomIn()
        return
      }
      if ((e.key === '-' || e.key === '_') && onZoomOut) {
        e.preventDefault()
        onZoomOut()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled, onDelete, onSelectAll, onUndo, onRedo, onZoomIn, onZoomOut])
}
