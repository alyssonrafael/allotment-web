import { useMemo } from 'react'
import type { AIGeneratedAllotment } from '#/types'

interface LayoutPreviewProps {
  canvasWidth: number
  canvasHeight: number
  allotments: Array<AIGeneratedAllotment>
}

const VIEW_WIDTH = 320
const MIN_HEIGHT = 120

// Paleta para colorir por grupo (tamanho). Determinística por ordem de aparição.
const GROUP_PALETTE = [
  '#2563eb',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#84cc16',
]

/**
 * Mini-canvas read-only que desenha os stands gerados dentro do canvas do
 * evento. Mesma matemática de escala do MiniMap (`sx = VIEW_WIDTH / canvasW`).
 * Colore por grupo (cada `${width}x${height}` único recebe uma cor da paleta).
 */
export function LayoutPreview({
  canvasWidth,
  canvasHeight,
  allotments,
}: LayoutPreviewProps) {
  const sx = VIEW_WIDTH / canvasWidth
  const viewHeight = Math.max(MIN_HEIGHT, canvasHeight * sx)

  const colorByGroup = useMemo(() => {
    const map = new Map<string, string>()
    let i = 0
    for (const a of allotments) {
      const key = `${a.width}x${a.height}`
      if (!map.has(key)) {
        map.set(key, GROUP_PALETTE[i % GROUP_PALETTE.length])
        i++
      }
    }
    return map
  }, [allotments])

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${viewHeight}`}
      className="h-auto w-full rounded-lg border border-border-strong"
      style={{ background: 'var(--surface-2)' }}
      role="img"
      aria-label="Pré-visualização do layout dos stands"
    >
      {allotments.map((a) => (
        <rect
          key={a.code}
          x={a.x * sx}
          y={a.y * sx}
          width={Math.max(2, a.width * sx)}
          height={Math.max(2, a.height * sx)}
          rx={1}
          fill={colorByGroup.get(`${a.width}x${a.height}`) ?? '#10b981'}
          fillOpacity={0.85}
        />
      ))}
    </svg>
  )
}
