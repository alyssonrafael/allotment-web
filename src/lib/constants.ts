import type { ActivityType, AllotmentStatus, EventStatus, EventType } from '#/types'
import type { LucideIcon } from 'lucide-react'
import {
  Ban,
  BadgeDollarSign,
  CheckCircle,
  Handshake,
  Pencil,
  PlusCircle,
  Trash2,
} from 'lucide-react'

export const GRID_SIZE = 1
export const SCALE = 50

export const toPixels = (meters: number): number => meters * SCALE
export const toMeters = (pixels: number): number => pixels / SCALE

// ── Allotment status ────────────────────────────────────────────────────────

export const STATUS_COLORS: Record<AllotmentStatus, string> = {
  AVAILABLE: '#10b981',
  RESERVED: '#f59e0b',
  SOLD: '#8b5cf6',
  BLOCKED: '#94a3b8',
}

export const STATUS_LABELS: Record<AllotmentStatus, string> = {
  AVAILABLE: 'Livre',
  RESERVED: 'Reservado',
  SOLD: 'Vendido',
  BLOCKED: 'Bloqueado',
}

export const STATUS_TOKEN: Record<AllotmentStatus, 'livre' | 'reservado' | 'vendido' | 'bloqueado'> =
  {
    AVAILABLE: 'livre',
    RESERVED: 'reservado',
    SOLD: 'vendido',
    BLOCKED: 'bloqueado',
  }

// ── Venue visuals ───────────────────────────────────────────────────────────

export const VENUE_PHOTOS = [
  {
    id: 'blue' as const,
    accent: '#2563eb',
    photo: 'linear-gradient(135deg, #2563eb 0%, #6366f1 60%, #8b5cf6 100%)',
  },
  {
    id: 'orange' as const,
    accent: '#f97316',
    photo: 'linear-gradient(135deg, #f97316 0%, #ea580c 60%, #c2410c 100%)',
  },
  {
    id: 'violet' as const,
    accent: '#8b5cf6',
    photo: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 60%, #ec4899 100%)',
  },
  {
    id: 'green' as const,
    accent: '#10b981',
    photo: 'linear-gradient(135deg, #10b981 0%, #059669 60%, #047857 100%)',
  },
] as const

export type VenuePhotoId = (typeof VENUE_PHOTOS)[number]['id']

export const VENUE_SIZE_PRESETS = [
  { id: 'small' as const,  label: 'Pequeno', width: 20, height: 15 },
  { id: 'medium' as const, label: 'Médio',   width: 40, height: 30 },
  { id: 'large' as const,  label: 'Grande',  width: 50, height: 35 },
  { id: 'huge' as const,   label: 'Enorme',  width: 80, height: 50 },
] as const

// ── Event types ─────────────────────────────────────────────────────────────

export const EVENT_TYPES: Array<{ id: EventType; label: string; color: string }> = [
  { id: 'FEIRA',     label: 'Feira',       color: '#2563eb' },
  { id: 'CONGRESSO', label: 'Congresso',   color: '#8b5cf6' },
  { id: 'EXPO',      label: 'Exposição',   color: '#f97316' },
  { id: 'CORPORATE', label: 'Corporativo', color: '#10b981' },
]

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  FEIRA:     'Feira',
  CONGRESSO: 'Congresso',
  EXPO:      'Exposição',
  CORPORATE: 'Corporativo',
}

// ── Event lifecycle status ──────────────────────────────────────────────────

export const EVENT_STATUS_TOKENS: Record<
  EventStatus,
  { label: string; color: string; bg: string }
> = {
  upcoming: { label: 'Próximo',   color: '#2563eb', bg: '#eff6ff' },
  active:   { label: 'Em curso',  color: '#10b981', bg: '#ecfdf5' },
  finished: { label: 'Encerrado', color: '#94a3b8', bg: '#f8fafc' },
}

// ── Event workspace screen labels ───────────────────────────────────────────

export const EVENT_SCREEN_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  pavilhao:  'Pavilhão',
  stands:    'Stands',
  comercial: 'Comercial',
  financas:  'Finanças',
}

// ── Activity icons & colors ─────────────────────────────────────────────────

export const ACTIVITY_ICONS: Record<ActivityType, LucideIcon> = {
  CREATED:   PlusCircle,
  UPDATED:   Pencil,
  DELETED:   Trash2,
  SOLD:      BadgeDollarSign,
  RESERVED:  Handshake,
  BLOCKED:   Ban,
  AVAILABLE: CheckCircle,
}

export const ACTIVITY_COLORS: Record<ActivityType, string> = {
  CREATED:   'text-status-livre',
  UPDATED:   'text-brand-primary',
  DELETED:   'text-red-500',
  SOLD:      'text-status-vendido',
  RESERVED:  'text-status-reservado',
  BLOCKED:   'text-status-bloqueado',
  AVAILABLE: 'text-status-livre',
}
