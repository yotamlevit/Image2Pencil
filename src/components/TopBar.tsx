'use client';

import { LoaderCircle, Moon, Pencil, Sun, TriangleAlert } from 'lucide-react';
import type { SketchStatus } from '@/hooks/useSketchWorker';
import type { Theme } from '@/hooks/useTheme';

interface TopBarProps {
  status: SketchStatus;
  busy: boolean;
  theme: Theme;
  onToggleTheme: () => void;
}

function EngineStatus({ status, busy }: { status: SketchStatus; busy: boolean }) {
  if (status === 'error') {
    return (
      <span className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-500">
        <TriangleAlert className="h-3.5 w-3.5" /> Engine error
      </span>
    );
  }
  if (status === 'booting') {
    return (
      <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted">
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Loading engine
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted">
      {busy ? (
        <LoaderCircle className="h-3.5 w-3.5 animate-spin text-accent" />
      ) : (
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
      )}
      {busy ? 'Rendering' : 'Ready'}
    </span>
  );
}

export function TopBar({ status, busy, theme, onToggleTheme }: TopBarProps) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2.5">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-contrast shadow-sm">
          <Pencil className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="leading-tight">
          <h1 className="text-sm font-semibold tracking-tight text-foreground">Image2Pencil</h1>
          <p className="hidden text-[11px] text-muted sm:block">Pencil-sketch studio for artists</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <EngineStatus status={status} busy={busy} />
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label="Toggle color theme"
          title="Toggle theme"
          className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface text-muted transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
}
