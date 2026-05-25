import { api } from './client'
import type {
  Allotment,
  CreateAllotmentPayload,
  PatchPositionPayload,
  PatchStatusPayload,
  UpdateAllotmentPayload,
} from '#/types'

export async function getAllotments(eventId: string): Promise<Allotment[]> {
  const { data } = await api.get<Allotment[]>(`/events/${eventId}/allotments`)
  return data
}

export async function createAllotment(
  eventId: string,
  payload: CreateAllotmentPayload,
): Promise<Allotment> {
  const { data } = await api.post<Allotment>(`/events/${eventId}/allotments`, payload)
  return data
}

export async function updateAllotment(
  id: string,
  payload: UpdateAllotmentPayload,
): Promise<Allotment> {
  const { data } = await api.put<Allotment>(`/allotments/${id}`, payload)
  return data
}

export async function patchPosition(
  id: string,
  payload: PatchPositionPayload,
): Promise<Allotment> {
  const { data } = await api.patch<Allotment>(`/allotments/${id}/position`, payload)
  return data
}

export async function patchStatus(
  id: string,
  payload: PatchStatusPayload,
): Promise<Allotment> {
  const { data } = await api.patch<Allotment>(`/allotments/${id}/status`, payload)
  return data
}

export async function deleteAllotment(id: string): Promise<void> {
  await api.delete(`/allotments/${id}`)
}
