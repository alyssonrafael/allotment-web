import { useNavigate, useParams } from '@tanstack/react-router'
import { useHotkeys } from 'react-hotkeys-hook'
import { useCanvasStore } from '#/stores/canvasStore'

type Screen = 'dashboard' | 'pavilhao' | 'stands' | 'comercial' | 'financas'

export function useGlobalHotkeys() {
  const navigate = useNavigate()
  const params = useParams({ strict: false })
  const clearSelection = useCanvasStore((s) => s.clearSelection)

  const goto = (screen: Screen) => {
    if (!params.eventId) return
    navigate({ to: `/events/${params.eventId}/${screen}` })
  }

  useHotkeys('g+d', () => goto('dashboard'), { preventDefault: true })
  useHotkeys('g+p', () => goto('pavilhao'), { preventDefault: true })
  useHotkeys('g+s', () => goto('stands'), { preventDefault: true })
  useHotkeys('g+c', () => goto('comercial'), { preventDefault: true })
  useHotkeys('g+f', () => goto('financas'), { preventDefault: true })
  useHotkeys('escape', () => clearSelection())
}
