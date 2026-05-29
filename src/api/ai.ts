import { api } from '#/api/client'
import { sanitizeParseEvent, sanitizeParseVenue } from '#/lib/aiSanitize'
import type {
  ParseEventRequest,
  ParseEventResponse,
  ParseVenueRequest,
  ParseVenueResponse,
} from '#/types'

// OpenAI pode levar mais que o timeout padrão do client (10s).
const AI_TIMEOUT = 60_000

export async function parseVenue(
  body: ParseVenueRequest,
): Promise<ParseVenueResponse> {
  const { data } = await api.post<ParseVenueResponse>('/ai/parse-venue', body, {
    timeout: AI_TIMEOUT,
  })
  return sanitizeParseVenue(data)
}

export async function parseEvent(
  body: ParseEventRequest,
): Promise<ParseEventResponse> {
  const { data } = await api.post<ParseEventResponse>('/ai/parse-event', body, {
    timeout: AI_TIMEOUT,
  })
  return sanitizeParseEvent(data)
}
