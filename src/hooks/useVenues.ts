import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createVenue,
  deleteVenue,
  getVenue,
  getVenueRevenue,
  getVenues,
  updateVenue,
} from '#/api/venues'
import type { CreateVenuePayload, UpdateVenuePayload } from '#/types'

export const venuesKeys = {
  all: ['venues'] as const,
  detail: (id: string) => ['venue', id] as const,
  revenue: (id: string) => ['venue', id, 'revenue'] as const,
}

export function useVenuesQuery() {
  return useQuery({
    queryKey: venuesKeys.all,
    queryFn: getVenues,
  })
}

export function useVenueQuery(id: string | undefined) {
  return useQuery({
    queryKey: id ? venuesKeys.detail(id) : ['venue', 'none'],
    queryFn: () => getVenue(id as string),
    enabled: Boolean(id),
  })
}

export function useVenueRevenueQuery(id: string | undefined) {
  return useQuery({
    queryKey: id ? venuesKeys.revenue(id) : ['venue', 'none', 'revenue'],
    queryFn: () => getVenueRevenue(id as string),
    enabled: Boolean(id),
  })
}

export function useCreateVenue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateVenuePayload) => createVenue(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: venuesKeys.all })
    },
  })
}

export function useUpdateVenue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateVenuePayload }) =>
      updateVenue(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: venuesKeys.all })
      qc.invalidateQueries({ queryKey: venuesKeys.detail(id) })
    },
  })
}

export function useDeleteVenue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteVenue(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: venuesKeys.all })
    },
  })
}
