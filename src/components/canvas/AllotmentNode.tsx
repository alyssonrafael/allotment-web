import { forwardRef, useMemo } from 'react'
import { Group, Rect, Text } from 'react-konva'
import type Konva from 'konva'
import type { Allotment, AllotmentStatus } from '#/types'
import { SCALE, STATUS_COLORS, STATUS_LABELS } from '#/lib/constants'
import { fmtBRLcompact } from '#/lib/format'
import { useCssTokens } from '#/hooks/useCssTokens'

interface AllotmentNodeProps {
  allotment: Allotment
  isSelected: boolean
  isCollision: boolean
  draggable: boolean
  hideLabels?: boolean
  /** Força cores do tema claro (usado na exportação). */
  forceLight?: boolean
  onSelect: (id: string, shift: boolean) => void
  onDragMove: (id: string, xMeters: number, yMeters: number) => void
  onDragEnd: (id: string, xMeters: number, yMeters: number) => void
  onDragStart?: (id: string) => void
  onDragCursor?: (clientX: number, clientY: number) => void
  canvasWidth: number
  canvasHeight: number
}

const STATUS_SOFT_BG: Record<AllotmentStatus, string> = {
  AVAILABLE: 'rgba(16, 185, 129, 0.18)',
  RESERVED: 'rgba(245, 158, 11, 0.20)',
  SOLD: 'rgba(139, 92, 246, 0.22)',
  BLOCKED: 'rgba(148, 163, 184, 0.24)',
}

const STATUS_SOFT_BG_BOTTOM: Record<AllotmentStatus, string> = {
  AVAILABLE: 'rgba(16, 185, 129, 0.08)',
  RESERVED: 'rgba(245, 158, 11, 0.10)',
  SOLD: 'rgba(139, 92, 246, 0.10)',
  BLOCKED: 'rgba(148, 163, 184, 0.12)',
}

const STATUS_TEXT_COLORS: Record<AllotmentStatus, string> = {
  AVAILABLE: '#047857',
  RESERVED: '#b45309',
  SOLD: '#6d28d9',
  BLOCKED: '#475569',
}

const TOKEN_NAMES = ['--surface', '--fg', '--fg-muted', '--brand-primary', '--status-erro'] as const

export const AllotmentNode = forwardRef<Konva.Group, AllotmentNodeProps>(function AllotmentNode(
  {
    allotment,
    isSelected,
    isCollision,
    draggable,
    hideLabels = false,
    forceLight = false,
    onSelect,
    onDragMove,
    onDragEnd,
    onDragStart,
    onDragCursor,
    canvasWidth,
    canvasHeight,
  },
  ref,
) {
  const tokens = useCssTokens(TOKEN_NAMES)
  const widthPx = allotment.width * SCALE
  const heightPx = allotment.height * SCALE
  const isCompact = widthPx < 140 || heightPx < 90
  const statusColor = STATUS_COLORS[allotment.status]
  const statusText = STATUS_TEXT_COLORS[allotment.status]
  const surface = forceLight ? '#fff' : tokens['--surface'] || '#fff'
  const fg = forceLight ? '#0d1020' : tokens['--fg'] || '#0d1020'
  const fgMuted = forceLight ? '#525873' : tokens['--fg-muted'] || '#525873'
  const primary = forceLight ? '#2563eb' : tokens['--brand-primary'] || '#2563eb'
  const erro = forceLight ? '#ef4444' : tokens['--status-erro'] || '#ef4444'

  const dimensionsLabel = `${allotment.width}×${allotment.height}m`
  const priceLabel = fmtBRLcompact(allotment.price)

  const stripeFill = useMemo(() => statusColor, [statusColor])

  return (
    <Group
      ref={ref}
      id={allotment.id}
      name="allotment"
      x={allotment.x * SCALE}
      y={allotment.y * SCALE}
      draggable={draggable}
      onMouseDown={(e) => {
        const shift = e.evt.shiftKey || e.evt.metaKey
        onSelect(allotment.id, shift)
      }}
      onTap={() => onSelect(allotment.id, false)}
      onMouseEnter={(e) => {
        const stage = e.target.getStage()
        if (stage) stage.container().style.cursor = draggable ? 'grab' : 'pointer'
      }}
      onMouseLeave={(e) => {
        const stage = e.target.getStage()
        if (stage) stage.container().style.cursor = ''
      }}
      onDragStart={(e) => {
        const stage = e.target.getStage()
        if (stage) stage.container().style.cursor = 'grabbing'
        onDragStart?.(allotment.id)
      }}
      onDragMove={(e) => {
        const node = e.target
        const xMeters = Math.round(node.x() / SCALE)
        const yMeters = Math.round(node.y() / SCALE)
        const cx = Math.max(0, Math.min(canvasWidth - allotment.width, xMeters))
        const cy = Math.max(0, Math.min(canvasHeight - allotment.height, yMeters))
        node.x(cx * SCALE)
        node.y(cy * SCALE)
        onDragMove(allotment.id, cx, cy)
        if (onDragCursor) onDragCursor(e.evt.clientX, e.evt.clientY)
      }}
      onDragEnd={(e) => {
        const node = e.target
        const stage = node.getStage()
        if (stage) stage.container().style.cursor = 'grab'
        const xMeters = Math.round(node.x() / SCALE)
        const yMeters = Math.round(node.y() / SCALE)
        const cx = Math.max(0, Math.min(canvasWidth - allotment.width, xMeters))
        const cy = Math.max(0, Math.min(canvasHeight - allotment.height, yMeters))
        node.x(cx * SCALE)
        node.y(cy * SCALE)
        onDragEnd(allotment.id, cx, cy)
      }}
    >
      {/* Background */}
      <Rect
        x={0}
        y={0}
        width={widthPx}
        height={heightPx}
        cornerRadius={10}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: 0, y: heightPx }}
        fillLinearGradientColorStops={[
          0,
          mixWithSurface(STATUS_SOFT_BG[allotment.status], surface, 0.85),
          1,
          mixWithSurface(STATUS_SOFT_BG_BOTTOM[allotment.status], surface, 0.95),
        ]}
        stroke={isCollision ? erro : statusColor}
        strokeWidth={isCollision ? 2 : 1}
        opacity={1}
        shadowColor={isSelected ? primary : statusColor}
        shadowBlur={isSelected ? 18 : 4}
        shadowOpacity={isSelected ? 0.45 : 0.18}
        shadowOffsetY={isSelected ? 6 : 2}
      />

      {/* Top stripe */}
      <Rect
        x={0}
        y={0}
        width={widthPx}
        height={3}
        fill={stripeFill}
        cornerRadius={[10, 10, 0, 0]}
        listening={false}
      />

      {/* Selection ring */}
      {isSelected && (
        <Rect
          x={-2}
          y={-2}
          width={widthPx + 4}
          height={heightPx + 4}
          cornerRadius={12}
          stroke={primary}
          strokeWidth={2}
          listening={false}
        />
      )}

      {!hideLabels && (
        <>
          {/* Code badge */}
          <Group x={10} y={10} listening={false}>
            <Rect
              x={0}
              y={0}
              width={Math.max(38, allotment.code.length * 7 + 14)}
              height={18}
              fill={statusColor}
              cornerRadius={5}
            />
            <Text
              x={0}
              y={0}
              width={Math.max(38, allotment.code.length * 7 + 14)}
              height={18}
              text={allotment.code}
              fontFamily="JetBrains Mono, ui-monospace, monospace"
              fontSize={10.5}
              fontStyle="800"
              fill="#fff"
              align="center"
              verticalAlign="middle"
              letterSpacing={0.4}
            />
          </Group>

          {/* Status label (normal mode) */}
          {!isCompact && (
            <Text
              x={0}
              y={12}
              width={widthPx - 12}
              text={STATUS_LABELS[allotment.status].toUpperCase()}
              fontFamily="Inter, sans-serif"
              fontSize={9.5}
              fontStyle="700"
              letterSpacing={1.2}
              fill={statusText}
              align="right"
              listening={false}
              opacity={0.85}
            />
          )}

          {/* Name */}
          <Text
            x={12}
            y={isCompact ? 34 : 38}
            width={widthPx - 24}
            height={isCompact ? heightPx - 42 : heightPx - 78}
            text={allotment.name}
            fontFamily="Inter, sans-serif"
            fontSize={isCompact ? 11 : 12.5}
            fontStyle="800"
            fill={fg}
            wrap="word"
            ellipsis={true}
            lineHeight={1.2}
            listening={false}
          />

          {/* Bottom: dimensions chip + price */}
          {!isCompact && (
            <>
              <Group x={12} y={heightPx - 24} listening={false}>
                <Rect
                  x={0}
                  y={0}
                  width={Math.max(40, dimensionsLabel.length * 6 + 10)}
                  height={16}
                  fill="rgba(82, 88, 115, 0.10)"
                  cornerRadius={4}
                />
                <Text
                  x={0}
                  y={0}
                  width={Math.max(40, dimensionsLabel.length * 6 + 10)}
                  height={16}
                  text={dimensionsLabel}
                  fontFamily="Inter, sans-serif"
                  fontSize={9.5}
                  fontStyle="700"
                  fill={fgMuted}
                  align="center"
                  verticalAlign="middle"
                />
              </Group>
              <Text
                x={12}
                y={heightPx - 22}
                width={widthPx - 24}
                text={priceLabel}
                fontFamily="Inter, sans-serif"
                fontSize={10.5}
                fontStyle="800"
                fill={statusText}
                align="right"
                listening={false}
              />
            </>
          )}
        </>
      )}
    </Group>
  )
})

/**
 * Mistura uma cor rgba/hex com a surface (fundo). Como Konva não suporta
 * color-mix do CSS, retornamos a cor traduzida (a rgba já é translúcida
 * sobre a surface, então funciona visualmente).
 */
function mixWithSurface(color: string, _surface: string, _alpha: number): string {
  return color
}
