import type { ParseEventResponse, ParseVenueResponse } from '#/types'

/**
 * Salvaguarda defensiva: a IA (ou o backend) pode devolver números quebrados
 * para quantidades e dimensões de stands. O domínio só aceita inteiros — stands
 * têm tamanho/quantidade inteira e ficam numa grade. Estas funções arredondam
 * tudo ao receber a resposta, antes de exibir ou criar (4.3 → 4, 4.6 → 5).
 *
 * Lógica pura, sem React (convenção de `src/lib/`).
 */

/** Largura/altura em metros — inteiro, mínimo 1. */
export function roundDim(value: number): number {
  return Math.max(1, Math.round(value))
}

/** Quantidades/contagens — inteiro, mínimo 0. */
export function roundCount(value: number): number {
  return Math.max(0, Math.round(value))
}

/** Coordenadas x/y em metros — inteiro, mínimo 0. */
export function roundCoord(value: number): number {
  return Math.max(0, Math.round(value))
}

/** Arredonda os campos numéricos do resultado de parse-event (no-op se needs_info). */
export function sanitizeParseEvent(res: ParseEventResponse): ParseEventResponse {
  if (res.status !== 'complete') return res
  return {
    ...res,
    event: {
      ...res.event,
      canvasWidth: roundDim(res.event.canvasWidth),
      canvasHeight: roundDim(res.event.canvasHeight),
    },
    allotments: res.allotments.map((a) => ({
      ...a,
      x: roundCoord(a.x),
      y: roundCoord(a.y),
      width: roundDim(a.width),
      height: roundDim(a.height),
      price: Math.round(a.price),
    })),
    summary: {
      ...res.summary,
      total: roundCount(res.summary.total),
      placed: roundCount(res.summary.placed),
      discarded: roundCount(res.summary.discarded),
      groups: res.summary.groups.map((g) => ({
        width: roundDim(g.width),
        height: roundDim(g.height),
        count: roundCount(g.count),
        placed: roundCount(g.placed),
      })),
    },
  }
}

/** Arredonda os campos numéricos do resultado de parse-venue (no-op se needs_info). */
export function sanitizeParseVenue(res: ParseVenueResponse): ParseVenueResponse {
  if (res.status !== 'complete') return res
  return {
    ...res,
    venue: {
      ...res.venue,
      width: roundDim(res.venue.width),
      height: roundDim(res.venue.height),
    },
    suggestedEvent: res.suggestedEvent
      ? {
          ...res.suggestedEvent,
          canvasWidth: roundDim(res.suggestedEvent.canvasWidth),
          canvasHeight: roundDim(res.suggestedEvent.canvasHeight),
        }
      : res.suggestedEvent,
  }
}
