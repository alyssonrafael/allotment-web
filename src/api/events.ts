import { api } from './client'
import type {
  CreateEventPayload,
  Event,
  EventDetail,
  EventListItem,
  EventStatus,
  EventType,
  UpdateEventPayload,
} from '#/types'

interface GetEventsParams {
  venueId?: string
  type?: EventType
  status?: EventStatus
}

export async function getEvents(params?: GetEventsParams): Promise<EventListItem[]> {
  const { data } = await api.get<EventListItem[]>('/events', { params })
  return data
}

export async function getEvent(id: string): Promise<EventDetail> {
  const { data } = await api.get<EventDetail>(`/events/${id}`)
  return data
}

export async function createEvent(
  payload: CreateEventPayload,
): Promise<Event & { venue: { id: string; name: string } }> {
  const { data } = await api.post<Event & { venue: { id: string; name: string } }>(
    '/events',
    payload,
  )
  return data
}

export async function updateEvent(
  id: string,
  payload: UpdateEventPayload,
): Promise<Event> {
  const { data } = await api.put<Event>(`/events/${id}`, payload)
  return data
}

export async function deleteEvent(id: string): Promise<void> {
  await api.delete(`/events/${id}`)
}
