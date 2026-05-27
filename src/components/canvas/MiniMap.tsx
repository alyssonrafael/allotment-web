import { useCallback, useEffect, useRef, useState } from 'react'
import type { Allotment } from '#/types'
import { STATUS_COLORS } from '#/lib/constants'

interface MiniMapProps {
  canvasWidth: number
  canvasHeight: number
  allotments: Array<Allotment>
  selectedId: string | null
  scrollWrapRef: React.RefObject<HTMLDivElement | null>
  /** px por metro (scale × zoom). */
  pixelsPerMeter: number
  /** padding interno do canvas em px dentro do scroll. */
  canvasPadding?: number
  onSelect: (id: string) => void
  /** Smooth scroll to center on coordinates (click-to-select). */
  onCenterOn: (xMeters: number, yMeters: number) => void
  /** Instant scroll for drag panning — avoids lag from smooth behavior. */
  onPan: (xMeters: number, yMeters: number) => void
}

interface Viewport {
  x: number
  y: number
  w: number
  h: number
}

const MAP_WIDTH = 100
const MAP_MIN_HEIGHT = 56

export function MiniMap({
  canvasWidth,
  canvasHeight,
  allotments,
  selectedId,
  scrollWrapRef,
  pixelsPerMeter,
  canvasPadding = 24,
  onSelect,
  onCenterOn,
  onPan,
}: MiniMapProps) {
  const sx = MAP_WIDTH / canvasWidth
  const mapHeight = Math.max(MAP_MIN_HEIGHT, canvasHeight * sx)
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, w: 0, h: 0 })

  const updateViewport = useCallback(() => {
    const wrap = scrollWrapRef.current
    if (!wrap) return
    setViewport({
      x: Math.max(0, (wrap.scrollLeft - canvasPadding) / pixelsPerMeter),
      y: Math.max(0, (wrap.scrollTop - canvasPadding) / pixelsPerMeter),
      w: wrap.clientWidth / pixelsPerMeter,
      h: wrap.clientHeight / pixelsPerMeter,
    })
  }, [scrollWrapRef, pixelsPerMeter, canvasPadding])

  useEffect(() => {
    const wrap = scrollWrapRef.current
    if (!wrap) return
    updateViewport()
    wrap.addEventListener('scroll', updateViewport, { passive: true })
    const ro = new ResizeObserver(updateViewport)
    ro.observe(wrap)
    return () => {
      wrap.removeEventListener('scroll', updateViewport)
      ro.disconnect()
    }
  }, [scrollWrapRef, updateViewport])

  const svgRef = useRef<SVGSVGElement | null>(null)
  const isPanningRef = useRef(false)

  function svgToMeters(clientX: number, clientY: number): { mx: number; my: number } | null {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    return {
      mx: (clientX - rect.left) / sx,
      my: (clientY - rect.top) / sx,
    }
  }

  function onSvgMouseDown(e: React.MouseEvent<SVGSVGElement>) {
    if ((e.target as SVGElement).getAttribute('data-stand-id')) return
    isPanningRef.current = true
    const coords = svgToMeters(e.clientX, e.clientY)
    if (coords) onPan(coords.mx, coords.my)
  }
  function onSvgMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!isPanningRef.current) return
    const coords = svgToMeters(e.clientX, e.clientY)
    if (coords) onPan(coords.mx, coords.my)
  }
  function onSvgMouseUp() {
    isPanningRef.current = false
  }

  return (
    <div
      className="absolute right-3 bottom-3 rounded-lg border border-border bg-card/90 p-1.5 shadow-md backdrop-blur"
      style={{ zIndex: 5 }}
    >
      <svg
        ref={svgRef}
        width={MAP_WIDTH}
        height={mapHeight}
        viewBox={`0 0 ${MAP_WIDTH} ${mapHeight}`}
        style={{
          background: 'var(--surface-2)',
          borderRadius: 6,
          cursor: 'crosshair',
          display: 'block',
        }}
        onMouseDown={onSvgMouseDown}
        onMouseMove={onSvgMouseMove}
        onMouseUp={onSvgMouseUp}
        onMouseLeave={onSvgMouseUp}
      >
        {allotments.map((s) => {
          const isSelected = selectedId === s.id
          return (
            <rect
              key={s.id}
              data-stand-id={s.id}
              x={s.x * sx}
              y={s.y * sx}
              width={Math.max(2, s.width * sx)}
              height={Math.max(2, s.height * sx)}
              fill={STATUS_COLORS[s.status]}
              opacity={isSelected ? 1 : 0.72}
              stroke={isSelected ? 'var(--brand-primary)' : 'none'}
              strokeWidth={isSelected ? 1.5 : 0}
              rx={1}
              onMouseDown={(e) => {
                e.stopPropagation()
                onSelect(s.id)
              }}
              style={{ cursor: 'pointer' }}
            >
              <title>
                {s.code} · {s.name}
              </title>
            </rect>
          )
        })}
        {viewport.w > 0 && (
          <rect
            x={viewport.x * sx}
            y={viewport.y * sx}
            width={Math.min(canvasWidth, viewport.w) * sx}
            height={Math.min(canvasHeight, viewport.h) * sx}
            fill="rgba(37, 99, 235, 0.12)"
            stroke="var(--brand-primary)"
            strokeWidth={1.5}
            rx={2}
            pointerEvents="none"
            style={{ transition: 'all 120ms var(--ease-out)' }}
          />
        )}
      </svg>
    </div>
  )
}
