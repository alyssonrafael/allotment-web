import type { EventStatus } from '#/types'

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 2,
})

export function fmtBRL(value: number): string {
  return brlFormatter.format(value)
}

export function fmtBRLcompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1).replace('.', ',')}M`
  }
  if (Math.abs(value) >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(1).replace('.', ',')}k`
  }
  return brlFormatter.format(value)
}

export function fmtDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('pt-BR')
}

export function fmtDateLong(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function fmtDateRange(startDate: string, endDate: string): string {
  const s = new Date(startDate)
  const e = new Date(endDate)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
    return `${startDate} – ${endDate}`
  }
  const fmt = (d: Date) => d.toLocaleDateString('pt-BR')
  if (s.toDateString() === e.toDateString()) return fmt(s)
  return `${fmt(s)} – ${fmt(e)}`
}

export function computeEventStatus(startDate: string, endDate: string): EventStatus {
  const now = new Date()
  const s = new Date(startDate)
  const e = new Date(endDate)
  e.setHours(23, 59, 59)
  if (now > e) return 'finished'
  if (now >= s) return 'active'
  return 'upcoming'
}

interface VenueAddressFlat {
  city: string
  state: string
  street?: string | null
  neighborhood?: string | null
}

export function fmtRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `há ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `há ${hrs}h`
  return fmtDate(iso)
}

export function formatVenueAddress(
  addr: VenueAddressFlat,
  mode: 'short' | 'full' = 'short',
): string {
  if (mode === 'short') return `${addr.city} · ${addr.state}`
  const neigh = addr.neighborhood ? ` — ${addr.neighborhood}` : ''
  const street = addr.street ?? ''
  return `${street}${neigh}, ${addr.city} · ${addr.state}`
}
