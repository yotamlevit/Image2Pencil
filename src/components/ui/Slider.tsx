'use client';

import type { ReactNode } from 'react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  displayValue?: ReactNode;
  hint?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  displayValue,
  hint,
  icon,
  disabled = false,
}: SliderProps) {
  return (
    <div className={disabled ? 'opacity-40' : undefined}>
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          {icon}
          {label}
        </span>
        <span className="font-mono text-xs tabular-nums text-muted">
          {displayValue ?? value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ accentColor: 'var(--accent)' }}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed"
      />
      {hint ? <p className="mt-1.5 text-[11px] leading-tight text-muted">{hint}</p> : null}
    </div>
  );
}
