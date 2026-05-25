import type { Allotment, Event } from '#/types'

export function detectOverlap(a: Allotment, b: Allotment): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}

export function isOutOfBounds(a: Allotment, event: Event): boolean {
  return (
    a.x < 0 ||
    a.y < 0 ||
    a.x + a.width > event.canvasWidth ||
    a.y + a.height > event.canvasHeight
  )
}

export function snapToGrid(value: number, gridSize = 1): number {
  return Math.round(value / gridSize) * gridSize
}
