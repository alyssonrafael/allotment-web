import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createAllotment,
  deleteAllotment,
  getAllotments,
  patchPosition,
  patchStatus,
  updateAllotment,
} from '#/api/allotments'
import type {
  CreateAllotmentPayload,
  PatchPositionPayload,
  PatchStatusPayload,
  UpdateAllotmentPayload,
} from '#/types'

export const allotmentsKeys = {
  byEvent: (eventId: string) => ['allotments', eventId] as const,
}

export function useAllotmentsQuery(eventId: string | undefined) {
  return useQuery({
    queryKey: eventId ? allotmentsKeys.byEvent(eventId) : ['allotments', 'none'],
    queryFn: () => getAllotments(eventId as string),
    enabled: Boolean(eventId),
  })
}

export function useCreateAllotment(eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAllotmentPayload) => createAllotment(eventId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: allotmentsKeys.byEvent(eventId) })
    },
  })
}

export function useUpdateAllotment(eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAllotmentPayload }) =>
      updateAllotment(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: allotmentsKeys.byEvent(eventId) })
    },
  })
}

export function usePatchPosition(eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PatchPositionPayload }) =>
      patchPosition(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: allotmentsKeys.byEvent(eventId) })
    },
  })
}

export function usePatchStatus(eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PatchStatusPayload }) =>
      patchStatus(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: allotmentsKeys.byEvent(eventId) })
    },
  })
}

export function useDeleteAllotment(eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteAllotment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: allotmentsKeys.byEvent(eventId) })
    },
  })
}
