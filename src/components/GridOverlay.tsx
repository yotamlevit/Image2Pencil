'use client';

import { gridFractions } from '@/lib/grid';

interface GridOverlayProps {
  width: number;
  height: number;
  divisions: number;
  mirror?: boolean;
}

/**
 * Crisp vector teaching grid. Given explicit width/height attributes + a matching
 * viewBox and `max-h/max-w-full`, the SVG fits-contains exactly like the sibling
 * canvas, so it overlays pixel-perfectly at any zoom (non-scaling strokes stay thin).
 */
export function GridOverlay({ width, height, divisions, mirror = false }: GridOverlayProps) {
  if (divisions < 2 || width <= 0 || height <= 0) return null;
  const xs = gridFractions(divisions).map((f) => f * width);
  const ys = gridFractions(divisions).map((f) => f * height);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
      className="pointer-events-none col-start-1 row-start-1 max-h-full max-w-full"
      style={{ transform: mirror ? 'scaleX(-1)' : undefined }}
    >
      <g stroke="var(--accent)" fill="none">
        {xs.map((x, i) => (
          <line
            key={`v-${i}`}
            x1={x}
            y1={0}
            x2={x}
            y2={height}
            strokeWidth={1}
            strokeOpacity={0.6}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {ys.map((y, i) => (
          <line
            key={`h-${i}`}
            x1={0}
            y1={y}
            x2={width}
            y2={y}
            strokeWidth={1}
            strokeOpacity={0.6}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          strokeWidth={1.5}
          strokeOpacity={0.45}
          vectorEffect="non-scaling-stroke"
        />
      </g>
    </svg>
  );
}
