import { api } from './client'
import type {
  CreateVenuePayload,
  UpdateVenuePayload,
  Venue,
  VenueListItem,
  VenueWithEvents,
} from '#/types'

export async function getVenues(): Promise<VenueListItem[]> {
  const { data } = await api.get<VenueListItem[]>('/venues')
  return data
}

export async function getVenue(id: string): Promise<VenueWithEvents> {
  const { data } = await api.get<VenueWithEvents>(`/venues/${id}`)
  return data
}

export async function createVenue(payload: CreateVenuePayload): Promise<Venue> {
  const { data } = await api.post<Venue>('/venues', payload)
  return data
}

export async function updateVenue(
  id: string,
  payload: UpdateVenuePayload,
): Promise<Venue> {
  const { data } = await api.put<Venue>(`/venues/${id}`, payload)
  return data
}

export async function deleteVenue(id: string): Promise<void> {
  await api.delete(`/venues/${id}`)
}
