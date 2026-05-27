import { useCallback, useEffect, useRef, useState } from 'react'
import { Layer, Stage, Transformer } from 'react-konva'
import type Konva from 'konva'
import type { Allotment, EventDetail } from '#/types'
import { SCALE } from '#/lib/constants'
import { detectOverlap, isOutOfBounds } from '#/lib/collision'
import { useCssTokens } from '#/hooks/useCssTokens'
import { Grid } from './Grid'
import { AllotmentNode } from './AllotmentNode'

const TRANSFORMER_TOKENS = ['--brand-primary', '--surface'] as const

interface PavilionStageProps {
  event: EventDetail
  allotments: Array<Allotment>
  selectedId: string | null
  selectedIds: Array<string>
  zoom: number
  onSelect: (id: string, shift: boolean) => void
  onClearSelection: () => void
  onPositionCommit: (id: string, x: number, y: number) => void
  onTransformCommit: (
    id: string,
    payload: { x: number; y: number; width: number; height: number },
  ) => void
  onInvalidMove?: (reason: 'overlap' | 'bounds') => void
  scrollWrapRef: React.RefObject<HTMLDivElement | null>
  canvasPadding?: number
}

const AUTOPAN_DEAD_ZONE = 40
const AUTOPAN_SPEED = 14

export function PavilionStage({
  event,
  allotments,
  selectedId: _selectedId,
  selectedIds,
  zoom,
  onSelect,
  onClearSelection,
  onPositionCommit,
  onTransformCommit,
  onInvalidMove,
  scrollWrapRef,
  canvasPadding = 24,
}: PavilionStageProps) {
  const stageRef = useRef<Konva.Stage | null>(null)
  const transformerRef = useRef<Konva.Transformer | null>(null)
  const dragOriginsRef = useRef<Map<string, { x: number; y: number }>>(new Map())
  const tokens = useCssTokens(TRANSFORMER_TOKENS)
  const brandColor = tokens['--brand-primary'] || '#2563eb'
  const surfaceColor = tokens['--surface'] || '#ffffff'
  const [collisionIds, setCollisionIds] = useState<Array<string>>([])
  const [mounted, setMounted] = useState(false)
  const [isTransforming, setIsTransforming] = useState(false)

  // Auto-pan refs
  const autoPanRafRef = useRef<number | null>(null)
  const lastCursorRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Attach transformer to selected node (only when exactly one is selected)
  useEffect(() => {
    const transformer = transformerRef.current
    const stage = stageRef.current
    if (!transformer || !stage) return
    if (selectedIds.length !== 1) {
      transformer.nodes([])
      transformer.getLayer()?.batchDraw()
      return
    }
    const id = selectedIds[0]
    const node = stage.findOne<Konva.Node>(`#${id}`)
    if (node) {
      transformer.nodes([node])
      transformer.getLayer()?.batchDraw()
    } else {
      transformer.nodes([])
    }
  }, [selectedIds, allotments])

  const widthPx = event.canvasWidth * SCALE
  const heightPx = event.canvasHeight * SCALE
  // O boundBoxFunc do Konva opera em coordenadas absolutas do stage (já
  // multiplicadas pelo scale). Por isso o clamping precisa considerar o zoom.
  const maxRight = event.canvasWidth * SCALE * zoom
  const maxBottom = event.canvasHeight * SCALE * zoom
  const minSize = SCALE * zoom

  const stopAutoPan = useCallback(() => {
    if (autoPanRafRef.current !== null) {
      cancelAnimationFrame(autoPanRafRef.current)
      autoPanRafRef.current = null
    }
    lastCursorRef.current = null
  }, [])

  const autoPanTick = useCallback(() => {
    const wrap = scrollWrapRef.current
    const cur = lastCursorRef.current
    if (!wrap || !cur) {
      autoPanRafRef.current = null
      return
    }
    const rect = wrap.getBoundingClientRect()
    let dx = 0
    let dy = 0
    if (cur.x - rect.left < AUTOPAN_DEAD_ZONE) dx = -AUTOPAN_SPEED
    else if (rect.right - cur.x < AUTOPAN_DEAD_ZONE) dx = AUTOPAN_SPEED
    if (cur.y - rect.top < AUTOPAN_DEAD_ZONE) dy = -AUTOPAN_SPEED
    else if (rect.bottom - cur.y < AUTOPAN_DEAD_ZONE) dy = AUTOPAN_SPEED
    if (dx === 0 && dy === 0) {
      autoPanRafRef.current = null
      return
    }
    wrap.scrollLeft += dx
    wrap.scrollTop += dy
    autoPanRafRef.current = requestAnimationFrame(autoPanTick)
  }, [scrollWrapRef])

  const handleDragCursor = useCallback(
    (clientX: number, clientY: number) => {
      lastCursorRef.current = { x: clientX, y: clientY }
      if (autoPanRafRef.current === null) {
        autoPanRafRef.current = requestAnimationFrame(autoPanTick)
      }
    },
    [autoPanTick],
  )

  // Auto-pan durante o resize: o Konva Transformer não expõe um onMove com a
  // posição do cursor, então escutamos mousemove na janela enquanto o
  // `isTransforming` está ativo. Quando termina, paramos o loop.
  useEffect(() => {
    if (!isTransforming) return
    const onMouseMove = (e: MouseEvent) => {
      handleDragCursor(e.clientX, e.clientY)
    }
    window.addEventListener('mousemove', onMouseMove)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      stopAutoPan()
    }
  }, [isTransforming, handleDragCursor, stopAutoPan])

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAutoPan()
  }, [stopAutoPan])

  if (!mounted) {
    return (
      <div
        style={{
          width: widthPx * zoom + canvasPadding * 2,
          height: heightPx * zoom + canvasPadding * 2,
          padding: canvasPadding,
        }}
      />
    )
  }

  return (
    <div
      style={{
        width: widthPx * zoom + canvasPadding * 2,
        height: heightPx * zoom + canvasPadding * 2,
        padding: canvasPadding,
      }}
    >
      <Stage
        ref={stageRef}
        width={widthPx * zoom}
        height={heightPx * zoom}
        scaleX={zoom}
        scaleY={zoom}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) onClearSelection()
        }}
      >
        <Layer>
          <Grid widthMeters={event.canvasWidth} heightMeters={event.canvasHeight} />

          {allotments.map((allotment) => {
            const isSelected = selectedIds.includes(allotment.id)
            const isCollision = collisionIds.includes(allotment.id)
            // Esconde labels do stand sendo transformado (resize) — evita deformação.
            const hideLabels = isTransforming && isSelected && selectedIds.length === 1
            return (
              <AllotmentNode
                key={allotment.id}
                allotment={allotment}
                isSelected={isSelected}
                isCollision={isCollision}
                hideLabels={hideLabels}
                draggable={true}
                canvasWidth={event.canvasWidth}
                canvasHeight={event.canvasHeight}
                onSelect={onSelect}
                onDragStart={(id) => {
                  const a = allotments.find((s) => s.id === id)
                  if (a) dragOriginsRef.current.set(id, { x: a.x, y: a.y })
                  setCollisionIds([])
                }}
                onDragCursor={handleDragCursor}
                onDragMove={(id, x, y) => {
                  const moving = { ...allotment, x, y }
                  const obstructors = allotments
                    .filter((s) => s.id !== id)
                    .filter((s) => detectOverlap(s, moving))
                  setCollisionIds(
                    obstructors.length > 0 ? [...obstructors.map((s) => s.id), id] : [],
                  )
                }}
                onDragEnd={(id, x, y) => {
                  stopAutoPan()
                  const moving = { ...allotment, x, y }
                  const obstructors = allotments
                    .filter((s) => s.id !== id)
                    .filter((s) => detectOverlap(s, moving))
                  if (obstructors.length > 0) {
                    const origin = dragOriginsRef.current.get(id)
                    if (origin) {
                      const node = stageRef.current?.findOne<Konva.Node>(`#${id}`)
                      if (node) {
                        node.x(origin.x * SCALE)
                        node.y(origin.y * SCALE)
                      }
                    }
                    setCollisionIds([])
                    onInvalidMove?.('overlap')
                    return
                  }
                  if (isOutOfBounds(moving, event)) {
                    const origin = dragOriginsRef.current.get(id)
                    if (origin) {
                      const node = stageRef.current?.findOne<Konva.Node>(`#${id}`)
                      if (node) {
                        node.x(origin.x * SCALE)
                        node.y(origin.y * SCALE)
                      }
                    }
                    setCollisionIds([])
                    onInvalidMove?.('bounds')
                    return
                  }
                  setCollisionIds([])
                  dragOriginsRef.current.delete(id)
                  onPositionCommit(id, x, y)
                }}
              />
            )
          })}

          <Transformer
            ref={transformerRef}
            rotateEnabled={false}
            keepRatio={false}
            ignoreStroke={true}
            anchorSize={10}
            anchorCornerRadius={2}
            borderStroke={brandColor}
            anchorStroke={brandColor}
            anchorFill={surfaceColor}
            boundBoxFunc={(oldBox, newBox) => {
              // Sem snap aqui — cursor segue livre durante o drag. O snap em grid
              // acontece no `onTransformEnd`. Aqui só fazemos clamping mínimo,
              // ancorando ao lado oposto da mão do usuário para evitar pulos.
              // Todas as coordenadas são absolutas (já incluem zoom); por isso
              // `minSize`, `maxRight` e `maxBottom` são multiplicados pelo zoom.
              if (newBox.width < minSize) {
                if (Math.abs(newBox.x - oldBox.x) > 0.5) {
                  // Usuário arrasta lado oeste — preserva borda leste
                  newBox.x = oldBox.x + oldBox.width - minSize
                }
                newBox.width = minSize
              }
              if (newBox.height < minSize) {
                if (Math.abs(newBox.y - oldBox.y) > 0.5) {
                  newBox.y = oldBox.y + oldBox.height - minSize
                }
                newBox.height = minSize
              }
              // Clamping contra canvas
              if (newBox.x < 0) {
                newBox.width += newBox.x
                newBox.x = 0
              }
              if (newBox.y < 0) {
                newBox.height += newBox.y
                newBox.y = 0
              }
              if (newBox.x + newBox.width > maxRight) {
                newBox.width = maxRight - newBox.x
              }
              if (newBox.y + newBox.height > maxBottom) {
                newBox.height = maxBottom - newBox.y
              }
              if (newBox.width < minSize) newBox.width = minSize
              if (newBox.height < minSize) newBox.height = minSize
              return newBox
            }}
            onTransformStart={() => {
              setIsTransforming(true)
            }}
            onTransform={() => {
              if (selectedIds.length !== 1) return
              const id = selectedIds[0]
              const node = stageRef.current?.findOne<Konva.Group>(`#${id}`)
              const allotment = allotments.find((s) => s.id === id)
              if (!node || !allotment) return
              const w = Math.max(1, Math.round((allotment.width * node.scaleX() * SCALE) / SCALE))
              const h = Math.max(1, Math.round((allotment.height * node.scaleY() * SCALE) / SCALE))
              const x = Math.round(node.x() / SCALE)
              const y = Math.round(node.y() / SCALE)
              const candidate = { ...allotment, x, y, width: w, height: h }
              const hits = allotments
                .filter((s) => s.id !== id)
                .filter((s) => detectOverlap(s, candidate))
              setCollisionIds(hits.length > 0 ? [...hits.map((s) => s.id), id] : [])
            }}
            onTransformEnd={() => {
              setIsTransforming(false)
              setCollisionIds([])
              if (selectedIds.length !== 1) return
              const id = selectedIds[0]
              const stage = stageRef.current
              if (!stage) return
              const node = stage.findOne<Konva.Group>(`#${id}`)
              if (!node) return
              const allotment = allotments.find((s) => s.id === id)
              if (!allotment) return
              const scaleX = node.scaleX()
              const scaleY = node.scaleY()
              node.scaleX(1)
              node.scaleY(1)
              const newWidth = Math.max(
                1,
                Math.round((allotment.width * scaleX * SCALE) / SCALE),
              )
              const newHeight = Math.max(
                1,
                Math.round((allotment.height * scaleY * SCALE) / SCALE),
              )
              const newX = Math.max(0, Math.round(node.x() / SCALE))
              const newY = Math.max(0, Math.round(node.y() / SCALE))
              const next = { x: newX, y: newY, width: newWidth, height: newHeight }
              const candidate = { ...allotment, ...next }
              if (isOutOfBounds(candidate, event)) {
                node.x(allotment.x * SCALE)
                node.y(allotment.y * SCALE)
                onInvalidMove?.('bounds')
                return
              }
              const obstructors = allotments
                .filter((s) => s.id !== id)
                .filter((s) => detectOverlap(s, candidate))
              if (obstructors.length > 0) {
                node.x(allotment.x * SCALE)
                node.y(allotment.y * SCALE)
                onInvalidMove?.('overlap')
                return
              }
              onTransformCommit(id, next)
            }}
          />
        </Layer>
      </Stage>
    </div>
  )
}
