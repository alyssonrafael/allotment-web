import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createEvent,
  deleteEvent,
  getEvent,
  getEventActivities,
  getEventRevenue,
  getEvents,
  updateEvent,
} from '#/api/events'
import type { CreateEventPayload, EventStatus, EventType, UpdateEventPayload } from '#/types'

interface UseEventsQueryParams {
  venueId?: string
  type?: EventType
  status?: EventStatus
}

export const eventsKeys = {
  all: ['events'] as const,
  filtered: (params: UseEventsQueryParams) => ['events', params] as const,
  detail: (id: string) => ['event', id] as const,
  revenue: (id: string) => ['event', id, 'revenue'] as const,
  activities: (id: string) => ['event', id, 'activities'] as const,
}

export function useEventsQuery(params?: UseEventsQueryParams) {
  return useQuery({
    queryKey: params ? eventsKeys.filtered(params) : eventsKeys.all,
    queryFn: () => getEvents(params),
  })
}

export function useEventQuery(id: string | undefined) {
  return useQuery({
    queryKey: id ? eventsKeys.detail(id) : ['event', 'none'],
    queryFn: () => getEvent(id as string),
    enabled: Boolean(id),
  })
}

export function useCreateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateEventPayload) => createEvent(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventsKeys.all })
    },
  })
}

export function useUpdateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateEventPayload }) =>
      updateEvent(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: eventsKeys.all })
      qc.invalidateQueries({ queryKey: eventsKeys.detail(id) })
    },
  })
}

export function useEventRevenueQuery(id: string | undefined) {
  return useQuery({
    queryKey: id ? eventsKeys.revenue(id) : ['event', 'none', 'revenue'],
    queryFn: () => getEventRevenue(id as string),
    enabled: Boolean(id),
  })
}

export function useEventActivitiesQuery(id: string | undefined) {
  return useQuery({
    queryKey: id ? eventsKeys.activities(id) : ['event', 'none', 'activities'],
    queryFn: () => getEventActivities(id as string),
    enabled: Boolean(id),
    refetchInterval: 30_000,
  })
}

export function useDeleteEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventsKeys.all })
    },
  })
}
