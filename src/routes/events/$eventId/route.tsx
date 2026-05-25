import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { AppShell } from '#/components/layout/AppShell'
import { useUIStore } from '#/stores/uiStore'

export const Route = createFileRoute('/events/$eventId')({
  component: EventWorkspaceLayout,
})

function EventWorkspaceLayout() {
  const { eventId } = Route.useParams()
  const setActiveEvent = useUIStore((s) => s.setActiveEvent)

  useEffect(() => {
    setActiveEvent(eventId)
    return () => setActiveEvent(null)
  }, [eventId, setActiveEvent])

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
