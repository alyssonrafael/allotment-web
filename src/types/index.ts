export type AllotmentStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'BLOCKED'
export type EventType       = 'FEIRA' | 'CONGRESSO' | 'EXPO' | 'CORPORATE'
export type EventStatus     = 'upcoming' | 'active' | 'finished'

// ── Venue ──────────────────────────────────────────────────────────────────

export interface Venue {
  id: string
  name: string
  description: string | null
  width: number      // metros
  height: number     // metros
  city: string
  state: string      // sigla UF: 'SP'
  street: string | null
  neighborhood: string | null
  zipCode: string | null
  accent: string     // CSS color token — ex: 'var(--primary)'
  photo: string      // CSS gradient — ex: 'linear-gradient(135deg, #2563eb 0%, ...)'
  createdAt: string
  updatedAt: string
}

export interface VenueListItem extends Venue {
  _count: { events: number }
}

export interface VenueWithEvents extends Venue {
  events: Array<{ id: string; name: string; startDate: string; endDate: string }>
}

export type CreateVenuePayload = {
  name: string
  description?: string
  width: number
  height: number
  city: string
  state: string
  street?: string
  neighborhood?: string
  zipCode?: string
  accent: string
  photo: string
}

export type UpdateVenuePayload = Partial<CreateVenuePayload>

// ── Event ──────────────────────────────────────────────────────────────────

export interface Event {
  id: string
  name: string
  startDate: string    // ISO 8601
  endDate: string      // ISO 8601
  status: EventStatus  // campo computado pelo backend — nunca enviar no body
  type: EventType
  venueId: string
  canvasWidth: number
  canvasHeight: number
  createdAt: string
  updatedAt: string
}

export interface EventListItem extends Event {
  venue: { id: string; name: string }
  _count: { allotments: number }
}

export interface EventDetail extends Event {
  venue: { id: string; name: string; width: number; height: number }
  allotments: Allotment[]
}

export type CreateEventPayload = {
  name: string
  startDate: string
  endDate: string
  type: EventType
  venueId: string
  canvasWidth?: number
  canvasHeight?: number
}

export type UpdateEventPayload = {
  name?: string
  startDate?: string
  endDate?: string
  type?: EventType
  canvasWidth?: number
  canvasHeight?: number
}

// ── Allotment ──────────────────────────────────────────────────────────────

export interface Allotment {
  id: string
  name: string
  code: string
  x: number
  y: number
  width: number
  height: number
  status: AllotmentStatus
  price: number
  eventId: string
  createdAt: string
  updatedAt: string
}

export type CreateAllotmentPayload = {
  name: string
  code: string
  x: number
  y: number
  width: number
  height: number
  status?: AllotmentStatus
  price: number
}

export type UpdateAllotmentPayload = Partial<
  Omit<Allotment, 'id' | 'eventId' | 'code' | 'createdAt' | 'updatedAt'>
>

export type PatchPositionPayload = { x: number; y: number }
export type PatchStatusPayload   = { status: AllotmentStatus }
