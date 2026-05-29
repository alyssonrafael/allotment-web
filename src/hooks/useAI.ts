import { useMutation } from '@tanstack/react-query'
import { parseEvent, parseVenue } from '#/api/ai'
import type { ParseEventRequest, ParseVenueRequest } from '#/types'

/** Interpreta um turno da conversa num pavilhão (ou pede mais dados). */
export function useParseVenue() {
  return useMutation({
    mutationFn: (req: ParseVenueRequest) => parseVenue(req),
  })
}

/** Interpreta um turno da conversa num evento + layout (ou pede mais dados). */
export function useParseEvent() {
  return useMutation({
    mutationFn: (req: ParseEventRequest) => parseEvent(req),
  })
}
