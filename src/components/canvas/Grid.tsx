import { Group, Line, Rect } from 'react-konva'
import { SCALE } from '#/lib/constants'
import { useCssTokens } from '#/hooks/useCssTokens'

interface GridProps {
  widthMeters: number
  heightMeters: number
}

const TOKEN_NAMES = [
  '--border-color',
  '--border-strong',
  '--surface-2',
] as const

export function Grid({ widthMeters, heightMeters }: GridProps) {
  const tokens = useCssTokens(TOKEN_NAMES)
  const widthPx = widthMeters * SCALE
  const heightPx = heightMeters * SCALE
  const fine = tokens['--border-color'] || '#e6e8f0'
  const strong = tokens['--border-strong'] || '#d4d8e6'
  const surface2 = tokens['--surface-2'] || '#f1f3f9'

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
}
