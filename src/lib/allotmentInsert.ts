import type { Allotment, Event } from '#/types'
import { detectOverlap } from '#/lib/collision'

type Rect = Pick<Allotment, 'x' | 'y' | 'width' | 'height'>

export function findFreeSlot(
  width: number,
  height: number,
  event: Pick<Event, 'canvasWidth' | 'canvasHeight'>,
  existing: Array<Rect>,
): { x: number; y: number } | null {
  for (let y = 0; y + height <= event.canvasHeight; y++) {
    for (let x = 0; x + width <= event.canvasWidth; x++) {
      const candidate = { x, y, width, height } as Allotment
      const collides = existing.some((s) =>
        detectOverlap(candidate, { ...s, x: s.x, y: s.y } as Allotment),
      )
      if (!collides) return { x, y }
    }
  }
  return null
}

export function generateCode(existing: Array<Pick<Allotment, 'code'>>): string {
  const prefix = String.fromCharCode(65 + Math.min(5, Math.floor(existing.length / 3)))
  let n = 1
  while (existing.some((s) => s.code === `${prefix}-${String(n).padStart(2, '0')}`)) n++
  return `${prefix}-${String(n).padStart(2, '0')}`
}
