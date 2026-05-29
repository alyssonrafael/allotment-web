import { memo, useMemo } from 'react'
import { Group, Line, Rect } from 'react-konva'
import { SCALE } from '#/lib/constants'

/** Cores de tema já resolvidas, passadas de cima. */
export interface GridColors {
  fine: string
  strong: string
  surface2: string
}

const LIGHT_COLORS: GridColors = {
  fine: '#e6e8f0',
  strong: '#d4d8e6',
  surface2: '#f1f3f9',
}

interface GridProps {
  widthMeters: number
  heightMeters: number
  /** Força cores do tema claro (usado na exportação). */
  forceLight?: boolean
  /** Cores resolvidas; se ausente (ou forceLight) usa o tema claro. */
  colors?: GridColors
}

function GridInner({ widthMeters, heightMeters, forceLight = false, colors }: GridProps) {
  const widthPx = widthMeters * SCALE
  const heightPx = heightMeters * SCALE
  const { fine, strong, surface2 } = forceLight ? LIGHT_COLORS : colors ?? LIGHT_COLORS

  return useMemo(() => {
  const fineLines: Array<React.ReactElement> = []
  for (let i = 1; i < widthMeters; i++) {
    if (i % 5 === 0) continue
    fineLines.push(
      <Line
        key={`v-${i}`}
        points={[i * SCALE, 0, i * SCALE, heightPx]}
        stroke={fine}
        strokeWidth={1}
        listening={false}
      />,
    )
  }
  for (let i = 1; i < heightMeters; i++) {
    if (i % 5 === 0) continue
    fineLines.push(
      <Line
        key={`h-${i}`}
        points={[0, i * SCALE, widthPx, i * SCALE]}
        stroke={fine}
        strokeWidth={1}
        listening={false}
      />,
    )
  }

  const strongLines: Array<React.ReactElement> = []
  for (let i = 5; i < widthMeters; i += 5) {
    strongLines.push(
      <Line
        key={`vs-${i}`}
        points={[i * SCALE, 0, i * SCALE, heightPx]}
        stroke={strong}
        strokeWidth={1}
        opacity={0.7}
        listening={false}
      />,
    )
  }
  for (let i = 5; i < heightMeters; i += 5) {
    strongLines.push(
      <Line
        key={`hs-${i}`}
        points={[0, i * SCALE, widthPx, i * SCALE]}
        stroke={strong}
        strokeWidth={1}
        opacity={0.7}
        listening={false}
      />,
    )
  }

  return (
    <Group listening={false}>
      <Rect x={0} y={0} width={widthPx} height={heightPx} fill={surface2} />
      {fineLines}
      {strongLines}
      {/* Borda neutra do canvas */}
      <Rect
        x={0}
        y={0}
        width={widthPx}
        height={heightPx}
        stroke={strong}
        strokeWidth={2}
        cornerRadius={8}
        listening={false}
      />
    </Group>
  )
  }, [widthMeters, heightMeters, widthPx, heightPx, fine, strong, surface2])
}

/** Memoizado: a grade é estática durante drag/zoom — não reconstrói as linhas. */
export const Grid = memo(GridInner)
