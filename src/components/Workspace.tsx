'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LoaderCircle, TriangleAlert } from 'lucide-react';
import { useSketchWorker } from '@/hooks/useSketchWorker';
import { useTheme } from '@/hooks/useTheme';
import { fileToImageData, exportSketchPng } from '@/lib/image';
import { DEFAULT_PARAMS, type GridDivision, type SketchParams } from '@/lib/types';
import { TopBar } from './TopBar';
import { Dropzone } from './Dropzone';
import { ControlsPanel } from './ControlsPanel';
import { ZoomStage } from './ZoomStage';
import { LayerBox } from './LayerBox';

const MAX_DISPLAY = 2800;

interface OriginalImage {
  bitmap: ImageBitmap;
  width: number;
  height: number;
}

function fitWithin(width: number, height: number, max: number) {
  const scale = Math.min(1, max / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function exportName(name: string | null) {
  const base = (name ?? 'image').replace(/\.[^/.]+$/, '').trim() || 'image';
  return `${base}-pencil.png`;
}

export function Workspace() {
  const worker = useSketchWorker();
  const { theme, toggle } = useTheme();

  const [params, setParams] = useState<SketchParams>(DEFAULT_PARAMS);
  const [mirror, setMirror] = useState(false);
  const [syncViews, setSyncViews] = useState(true);
  const [gridOn, setGridOn] = useState(false);
  const [gridDivisions, setGridDivisions] = useState<GridDivision>(3);
  const [original, setOriginal] = useState<OriginalImage | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pendingSource, setPendingSource] = useState<ImageData | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [resetSignal, setResetSignal] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = useCallback(async (file: File) => {
    try {
      setDecodeError(null);
      const decoded = await fileToImageData(file);
      const display = fitWithin(decoded.width, decoded.height, MAX_DISPLAY);
      setOriginal((prev) => {
        prev?.bitmap.close();
        return { bitmap: decoded.bitmap, width: display.width, height: display.height };
      });
      setFileName(file.name);
      setPendingSource(decoded.imageData);
      setResetSignal((s) => s + 1);
    } catch {
      setDecodeError('Could not read that image. Try a different JPG, PNG, or WebP file.');
    }
  }, []);

  // Hand the decoded source to the worker once OpenCV is ready (transfers the buffer).
  // A ref guards the one-shot load so we never re-send (and re-detach) the same buffer.
  const { ready, loadImage } = worker;
  const loadedSourceRef = useRef<ImageData | null>(null);
  useEffect(() => {
    if (ready && pendingSource && pendingSource !== loadedSourceRef.current) {
      loadedSourceRef.current = pendingSource;
      loadImage(pendingSource);
    }
  }, [ready, pendingSource, loadImage]);

  // Re-render whenever the parameters or the loaded image change (debounced in the hook).
  const { workingSize, render } = worker;
  useEffect(() => {
    if (ready && workingSize) render(params);
  }, [ready, workingSize, params, render]);

  const onParamChange = useCallback(
    <K extends keyof SketchParams>(key: K, value: SketchParams[K]) => {
      setParams((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const openImage = useCallback(() => fileInputRef.current?.click(), []);
  const resetView = useCallback(() => setResetSignal((s) => s + 1), []);

  const { sketch } = worker;
  const onExport = useCallback(
    async (withGrid: boolean) => {
      if (!sketch || !workingSize) return;
      try {
        await exportSketchPng({
          bitmap: sketch,
          width: workingSize.width,
          height: workingSize.height,
          mirror,
          divisions: withGrid ? gridDivisions : undefined,
          filename: exportName(fileName),
        });
      } catch {
        setDecodeError('Export failed while encoding the PNG.');
      }
    },
    [sketch, workingSize, mirror, gridDivisions, fileName]
  );

  const hasImage = original !== null;
  const effectiveGrid = gridOn ? gridDivisions : 0;
  const error = decodeError ?? worker.error;

  const sketchOverlay = (() => {
    if (sketch) return undefined;
    if (worker.status === 'error') {
      return (
        <span className="flex items-center gap-2 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white">
          <TriangleAlert className="h-4 w-4 text-red-400" /> Engine error
        </span>
      );
    }
    return (
      <span className="flex items-center gap-2 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white">
        <LoaderCircle className="h-4 w-4 animate-spin" /> Generating sketch…
      </span>
    );
  })();

  const referenceBox = original ? (
    <LayerBox
      label="Reference"
      bitmap={original.bitmap}
      width={original.width}
      height={original.height}
      mirror={mirror}
      gridDivisions={effectiveGrid}
    />
  ) : null;

  const sketchBox = original ? (
    <LayerBox
      label="Pencil sketch"
      bitmap={sketch}
      width={workingSize?.width ?? original.width}
      height={workingSize?.height ?? original.height}
      mirror={mirror}
      gridDivisions={effectiveGrid}
      overlay={sketchOverlay}
    />
  ) : null;

  return (
    <div className="flex min-h-screen flex-col lg:h-screen lg:min-h-0">
      <TopBar status={worker.status} busy={worker.busy} theme={theme} onToggleTheme={toggle} />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main className="relative h-[55vh] min-h-0 lg:h-auto lg:flex-1">
          {hasImage ? (
            syncViews ? (
              <ZoomStage resetSignal={resetSignal}>
                <div className="flex h-full w-full flex-col sm:flex-row">
                  <div className="min-h-0 min-w-0 flex-1 border-b border-border sm:border-b-0 sm:border-r">
                    {referenceBox}
                  </div>
                  <div className="min-h-0 min-w-0 flex-1">{sketchBox}</div>
                </div>
              </ZoomStage>
            ) : (
              <div className="flex h-full w-full flex-col gap-px bg-border sm:flex-row">
                <div className="min-h-0 min-w-0 flex-1">
                  <ZoomStage resetSignal={resetSignal}>{referenceBox}</ZoomStage>
                </div>
                <div className="min-h-0 min-w-0 flex-1">
                  <ZoomStage resetSignal={resetSignal}>{sketchBox}</ZoomStage>
                </div>
              </div>
            )
          ) : (
            <Dropzone
              onFile={handleFile}
              disabled={worker.status === 'error'}
              hint={
                worker.status === 'booting'
                  ? 'Loading the sketch engine — drop a photo now and it will render in a moment.'
                  : undefined
              }
            />
          )}
        </main>

        <aside className="border-t border-border bg-surface lg:w-80 lg:shrink-0 lg:overflow-hidden lg:border-t-0 lg:border-l">
          <ControlsPanel
            hasImage={hasImage}
            canExport={!!sketch}
            params={params}
            onParamChange={onParamChange}
            mirror={mirror}
            onMirrorChange={setMirror}
            syncViews={syncViews}
            onSyncViewsChange={setSyncViews}
            gridOn={gridOn}
            onGridOnChange={setGridOn}
            gridDivisions={gridDivisions}
            onGridDivisionsChange={setGridDivisions}
            onOpenImage={openImage}
            onResetView={resetView}
            onExport={onExport}
            fileName={fileName}
            error={error}
          />
        </aside>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
          event.currentTarget.value = '';
        }}
      />
    </div>
  );
}
