'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { GridOverlay } from './GridOverlay';

interface LayerBoxProps {
  label: string;
  bitmap: ImageBitmap | null;
  width: number;
  height: number;
  mirror: boolean;
  gridDivisions: number;
  overlay?: ReactNode;
}

/**
 * One viewer cell: a fit-contained canvas with the optional teaching grid stacked
 * exactly on top (CSS grid, single cell). Designed to live inside a zoom/pan stage.
 */
export function LayerBox({
  label,
  bitmap,
  width,
  height,
  mirror,
  gridDivisions,
  overlay,
}: LayerBoxProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (bitmap) ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  }, [bitmap, width, height]);

  return (
    <div className="relative grid h-full w-full place-items-center p-3 sm:p-5">
      <canvas
        ref={canvasRef}
        width={Math.max(1, width)}
        height={Math.max(1, height)}
        className="col-start-1 row-start-1 max-h-full max-w-full rounded-[3px] bg-white shadow-md ring-1 ring-black/5"
        style={{ transform: mirror ? 'scaleX(-1)' : undefined }}
      />
      <GridOverlay width={width} height={height} divisions={gridDivisions} mirror={mirror} />
      <span className="pointer-events-none absolute top-2 left-2 z-10 rounded-md bg-black/55 px-2 py-0.5 text-[11px] font-medium tracking-wide text-white backdrop-blur-sm">
        {label}
      </span>
      {overlay ? (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
          {overlay}
        </div>
      ) : null}
    </div>
  );
}
