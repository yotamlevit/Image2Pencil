'use client';

import type { ReactNode } from 'react';
import {
  Contrast,
  Download,
  FlipHorizontal2,
  Grid3x3,
  ImagePlus,
  Layers,
  Link2,
  Maximize2,
  PenTool,
  TriangleAlert,
} from 'lucide-react';
import { GRID_DIVISIONS, type GridDivision, type SketchParams } from '@/lib/types';
import { Button } from './ui/Button';
import { Slider } from './ui/Slider';
import { Toggle } from './ui/Toggle';
import { Segmented } from './ui/Segmented';

interface ControlsPanelProps {
  hasImage: boolean;
  canExport: boolean;
  params: SketchParams;
  onParamChange: <K extends keyof SketchParams>(key: K, value: SketchParams[K]) => void;
  mirror: boolean;
  onMirrorChange: (value: boolean) => void;
  syncViews: boolean;
  onSyncViewsChange: (value: boolean) => void;
  gridOn: boolean;
  onGridOnChange: (value: boolean) => void;
  gridDivisions: GridDivision;
  onGridDivisionsChange: (value: GridDivision) => void;
  onOpenImage: () => void;
  onResetView: () => void;
  onExport: (withGrid: boolean) => void;
  fileName: string | null;
  error: string | null;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 border-b border-border px-4 py-5 last:border-b-0">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">{title}</h2>
      {children}
    </section>
  );
}

const strokeLabel = (v: number) => (v < 28 ? 'Fine pencil' : v < 64 ? 'Pencil' : 'Soft charcoal');

export function ControlsPanel(props: ControlsPanelProps) {
  const {
    hasImage,
    canExport,
    params,
    onParamChange,
    mirror,
    onMirrorChange,
    syncViews,
    onSyncViewsChange,
    gridOn,
    onGridOnChange,
    gridDivisions,
    onGridDivisionsChange,
    onOpenImage,
    onResetView,
    onExport,
    fileName,
    error,
  } = props;

  return (
    <div className="flex h-full flex-col overflow-y-auto scrollbar-thin">
      {error ? (
        <div className="flex items-start gap-2 border-b border-border bg-red-500/10 px-4 py-3 text-xs text-red-500">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0 break-words">{error}</span>
        </div>
      ) : null}

      <Section title="Image">
        <Button variant="outline" className="w-full" onClick={onOpenImage}>
          <ImagePlus className="h-4 w-4" />
          {hasImage ? 'Replace photo' : 'Open photo'}
        </Button>
        {fileName ? (
          <p className="truncate text-xs text-muted" title={fileName}>
            {fileName}
          </p>
        ) : null}
      </Section>

      <Section title="Pencil">
        <Slider
          label="Stroke"
          icon={<PenTool className="h-4 w-4 text-muted" />}
          min={1}
          max={100}
          value={params.stroke}
          onChange={(v) => onParamChange('stroke', v)}
          displayValue={strokeLabel(params.stroke)}
          hint="Blur radius — fine mechanical pencil through soft charcoal."
          disabled={!hasImage}
        />
        <Slider
          label="Contrast"
          icon={<Contrast className="h-4 w-4 text-muted" />}
          min={0.5}
          max={2.5}
          step={0.05}
          value={params.contrast}
          onChange={(v) => onParamChange('contrast', v)}
          displayValue={`${params.contrast.toFixed(2)}×`}
          hint="Push whites cleaner and pencil lines richer."
          disabled={!hasImage}
        />
        <Slider
          label="Squint"
          icon={<Layers className="h-4 w-4 text-muted" />}
          min={0}
          max={6}
          value={params.posterize}
          onChange={(v) => onParamChange('posterize', v)}
          displayValue={params.posterize < 2 ? 'Off' : `${params.posterize} values`}
          hint="Group tones into flat value steps to read shadow shapes."
          disabled={!hasImage}
        />
      </Section>

      <Section title="Study tools">
        <Toggle
          label="Mirror / flip"
          icon={<FlipHorizontal2 className="h-4 w-4 text-muted" />}
          checked={mirror}
          onChange={onMirrorChange}
          hint="Flip horizontally to catch proportion errors."
          disabled={!hasImage}
        />
        <Toggle
          label="Sync views"
          icon={<Link2 className="h-4 w-4 text-muted" />}
          checked={syncViews}
          onChange={onSyncViewsChange}
          hint="Pan and zoom both panels together."
          disabled={!hasImage}
        />
        <div className="space-y-3">
          <Toggle
            label="Teaching grid"
            icon={<Grid3x3 className="h-4 w-4 text-muted" />}
            checked={gridOn}
            onChange={onGridOnChange}
            disabled={!hasImage}
          />
          {gridOn ? (
            <Segmented
              ariaLabel="Grid divisions"
              value={gridDivisions}
              onChange={(v) => onGridDivisionsChange(v as GridDivision)}
              options={GRID_DIVISIONS.map((d) => ({ label: `${d}×${d}`, value: d }))}
              disabled={!hasImage}
            />
          ) : null}
        </div>
      </Section>

      <Section title="View">
        <Button variant="outline" className="w-full" onClick={onResetView} disabled={!hasImage}>
          <Maximize2 className="h-4 w-4" />
          Reset / fit view
        </Button>
      </Section>

      <Section title="Export">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="primary" onClick={() => onExport(false)} disabled={!canExport}>
            <Download className="h-4 w-4" />
            PNG
          </Button>
          <Button variant="outline" onClick={() => onExport(true)} disabled={!canExport}>
            <Grid3x3 className="h-4 w-4" />
            PNG + grid
          </Button>
        </div>
        <p className="text-[11px] leading-tight text-muted">
          Exports the generated sketch at working resolution{mirror ? ', mirrored to match your view' : ''}.
        </p>
      </Section>
    </div>
  );
}
