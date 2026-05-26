import { useMemo } from 'react'
import { Map } from 'lucide-react'
import { cn } from '#/lib/utils'
import { Card } from '#/components/ui/card'
import type { Allotment, AllotmentStatus } from '#/types'

const STATUS_FILL: Record<AllotmentStatus, string> = {
  AVAILABLE: 'var(--status-livre)',
  RESERVED:  'var(--status-reservado)',
  SOLD:      'var(--status-vendido)',
  BLOCKED:   'var(--status-bloqueado)',
}

interface HeatmapCardProps {
  allotments: Allotment[]
  canvasWidth: number
  canvasHeight: number
}

export function HeatmapCard({ allotments, canvasWidth, canvasHeight }: HeatmapCardProps) {
  const grid = useMemo(() => {
    const g = Array.from({ length: canvasHeight }, () =>
      Array.from({ length: canvasWidth }, () => null as AllotmentStatus | null),
    )
    for (const a of allotments) {
      for (let row = a.y; row < a.y + a.height && row < canvasHeight; row++) {
        for (let col = a.x; col < a.x + a.width && col < canvasWidth; col++) {
          g[row][col] = a.status
        }
      }
    }
    return g
  }, [allotments, canvasWidth, canvasHeight])

  const ariaLabel = useMemo(() => {
    const c: Record<AllotmentStatus, number> = { AVAILABLE: 0, RESERVED: 0, SOLD: 0, BLOCKED: 0 }
    for (const a of allotments) c[a.status]++
    return `Mapa de ocupação do pavilhão ${canvasWidth} por ${canvasHeight} metros. ${c.SOLD} stands vendidos, ${c.RESERVED} reservados, ${c.AVAILABLE} livres, ${c.BLOCKED} bloqueados.`
  }, [allotments, canvasWidth, canvasHeight])

  const cell = canvasWidth > 0 ? Math.max(6, Math.min(12, Math.floor(420 / canvasWidth))) : 8
  const gap = 1
  const svgW = canvasWidth * cell + Math.max(0, canvasWidth - 1) * gap
  const svgH = canvasHeight * cell + Math.max(0, canvasHeight - 1) * gap

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-h2">Mapa de calor</h3>
          <p className="mt-0.5 text-[12px] text-fg-muted">
            Visão por status — {canvasWidth}×{canvasHeight} m
          </p>
        </div>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-brand-primary/10 text-brand-primary">
          <Map size={15} />
        </div>
      </div>

      {canvasWidth > 0 && canvasHeight > 0 ? (
        <div className="mt-4 flex flex-1 min-h-0 items-center justify-center max-h-62.5">
          <svg
            role="img"
            aria-label={ariaLabel}
            viewBox={`0 0 ${svgW} ${svgH}`}
            preserveAspectRatio="xMidYMid meet"
            width="100%"
            height="100%"
            overflow="visible"
            style={{ display: 'block' }}
          >
            <title>Mapa de ocupação por status</title>
            {grid.map((row, y) =>
              row.map((status, x) => (
                <rect
                  key={`${x}-${y}`}
                  x={x * (cell + gap)}
                  y={y * (cell + gap)}
                  width={cell}
                  height={cell}
                  rx={2}
                  fill={status ? STATUS_FILL[status] : 'var(--border)'}
                  className={cn(
                    'cursor-default transform-fill origin-center',
                    'transition-[filter,opacity,transform] duration-200 ease-out',
                    'hover:brightness-[1.2] hover:scale-[1.15] hover:opacity-100',
                    status ? 'opacity-90' : 'opacity-100',
                  )}
                />
              )),
            )}
          </svg>
        </div>
      ) : (
        <div className="mt-4 flex flex-1 min-h-0 items-center justify-center rounded-md border border-dashed border-border text-[12px] text-fg-subtle max-h-62.5">
          Dimensões do pavilhão não disponíveis
        </div>
      )}
    </Card>
  )
}