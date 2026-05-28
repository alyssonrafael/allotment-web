import { forwardRef } from 'react'
import { Layer, Stage } from 'react-konva'
import type Konva from 'konva'
import type { Allotment, EventDetail } from '#/types'
import { SCALE } from '#/lib/constants'
import { Grid } from './Grid'
import { AllotmentNode } from './AllotmentNode'

interface ExportStageProps {
  event: EventDetail
  allotments: Array<Allotment>
}

const noop = () => {}

/**
 * Stage estático usado só para exportar (PNG/PDF): escala 1, pavilhão inteiro
 * e cores do tema claro forçadas (`forceLight`). Renderizado fora da tela; o
 * resultado independe do zoom/scroll/tema da visualização ao vivo.
 */
export const ExportStage = forwardRef<Konva.Stage, ExportStageProps>(
  function ExportStage({ event, allotments }, ref) {
    const widthPx = event.canvasWidth * SCALE
    const heightPx = event.canvasHeight * SCALE
    return (
      <Stage ref={ref} width={widthPx} height={heightPx}>
        <Layer>
          <Grid
            widthMeters={event.canvasWidth}
            heightMeters={event.canvasHeight}
            forceLight
          />
          {allotments.map((allotment) => (
            <AllotmentNode
              key={allotment.id}
              allotment={allotment}
              isSelected={false}
              isCollision={false}
              draggable={false}
              forceLight
              onSelect={noop}
              onDragMove={noop}
              onDragEnd={noop}
              canvasWidth={event.canvasWidth}
              canvasHeight={event.canvasHeight}
            />
          ))}
        </Layer>
      </Stage>
    )
  },
)
