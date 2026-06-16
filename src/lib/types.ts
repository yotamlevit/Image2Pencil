/** Tunable parameters for the pencil-sketch pipeline. */
export interface SketchParams {
  /** 1..100 — drives the Gaussian blur kernel (fine pencil -> soft charcoal). */
  stroke: number;
  /** 0.5..2.5 — linear contrast, pivoted on mid-gray. 1 = no change. */
  contrast: number;
  /** 0 = off, otherwise 2..6 distinct gray steps (squint / value grouping). */
  posterize: number;
}

export const DEFAULT_PARAMS: SketchParams = {
  stroke: 14,
  contrast: 1.15,
  posterize: 0,
};

/** Teaching-grid divisions offered in the UI (NxN). */
export const GRID_DIVISIONS = [2, 3, 4, 8] as const;
export type GridDivision = (typeof GRID_DIVISIONS)[number];

/** Messages sent from the main thread into the worker. */
export type WorkerInbound =
  | { type: 'load'; buffer: ArrayBuffer; width: number; height: number }
  | { type: 'process'; id: number; params: SketchParams }
  | { type: 'clear' };

/** Messages posted from the worker back to the main thread. */
export type WorkerOutbound =
  | { type: 'ready' }
  | { type: 'loaded'; width: number; height: number }
  | { type: 'result'; id: number; width: number; height: number; bitmap: ImageBitmap }
  | { type: 'error'; id?: number; stage?: string; message: string };
