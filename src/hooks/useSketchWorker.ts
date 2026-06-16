'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SketchParams, WorkerOutbound } from '@/lib/types';

export type SketchStatus = 'booting' | 'ready' | 'error';

export interface WorkingSize {
  width: number;
  height: number;
}

export interface SketchWorkerApi {
  status: SketchStatus;
  ready: boolean;
  busy: boolean;
  error: string | null;
  sketch: ImageBitmap | null;
  workingSize: WorkingSize | null;
  /** Send a decoded image to the worker (its pixel buffer is transferred). */
  loadImage: (imageData: ImageData) => void;
  /** Request a render with the given params (debounced; stale frames are dropped). */
  render: (params: SketchParams) => void;
  /** Forget the current source image. */
  clear: () => void;
}

const DEBOUNCE_MS = 90;

export function useSketchWorker(): SketchWorkerApi {
  const workerRef = useRef<Worker | null>(null);
  const [status, setStatus] = useState<SketchStatus>('booting');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sketch, setSketch] = useState<ImageBitmap | null>(null);
  const [workingSize, setWorkingSize] = useState<WorkingSize | null>(null);

  const hasSourceRef = useRef(false);
  const reqIdRef = useRef(0);
  const acceptIdRef = useRef(0);
  const debounceRef = useRef<number | null>(null);
  const pendingParamsRef = useRef<SketchParams | null>(null);

  useEffect(() => {
    const worker = new Worker('/workers/sketch.worker.js');
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerOutbound>) => {
      const msg = event.data;
      switch (msg.type) {
        case 'ready':
          setStatus('ready');
          break;
        case 'loaded':
          setWorkingSize({ width: msg.width, height: msg.height });
          break;
        case 'result':
          if (msg.id !== acceptIdRef.current) {
            msg.bitmap.close(); // a newer request superseded this one
            return;
          }
          setSketch((prev) => {
            prev?.close();
            return msg.bitmap;
          });
          setBusy(false);
          break;
        case 'error':
          setError(msg.message);
          setBusy(false);
          if (msg.stage === 'load-opencv') setStatus('error');
          break;
      }
    };

    worker.onerror = (event) => {
      setError(event.message || 'The image worker crashed.');
      setStatus('error');
    };

    return () => {
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const loadImage = useCallback((imageData: ImageData) => {
    const worker = workerRef.current;
    if (!worker) return;
    hasSourceRef.current = true;
    setError(null);
    setSketch((prev) => {
      prev?.close();
      return null;
    });
    const buffer = imageData.data.buffer;
    worker.postMessage(
      { type: 'load', buffer, width: imageData.width, height: imageData.height },
      [buffer]
    );
  }, []);

  const postProcess = useCallback((params: SketchParams) => {
    const worker = workerRef.current;
    if (!worker || !hasSourceRef.current) return;
    reqIdRef.current += 1;
    acceptIdRef.current = reqIdRef.current;
    setBusy(true);
    worker.postMessage({ type: 'process', id: reqIdRef.current, params });
  }, []);

  const render = useCallback(
    (params: SketchParams) => {
      pendingParamsRef.current = params;
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        debounceRef.current = null;
        if (pendingParamsRef.current) postProcess(pendingParamsRef.current);
      }, DEBOUNCE_MS);
    },
    [postProcess]
  );

  const clear = useCallback(() => {
    hasSourceRef.current = false;
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    setWorkingSize(null);
    setBusy(false);
    setSketch((prev) => {
      prev?.close();
      return null;
    });
    workerRef.current?.postMessage({ type: 'clear' });
  }, []);

  return {
    status,
    ready: status === 'ready',
    busy,
    error,
    sketch,
    workingSize,
    loadImage,
    render,
    clear,
  };
}
