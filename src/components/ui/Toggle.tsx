'use client';

import type { ReactNode } from 'react';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: ReactNode;
  hint?: string;
  disabled?: boolean;
}

export function Toggle({ label, checked, onChange, icon, hint, disabled = false }: ToggleProps) {
  return (
    <div className={`flex items-center justify-between gap-3 ${disabled ? 'opacity-40' : ''}`}>
      <span className="min-w-0">
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          {icon}
          {label}
        </span>
        {hint ? <span className="mt-0.5 block text-[11px] leading-tight text-muted">{hint}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed ${
          checked ? 'bg-accent' : 'bg-border'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
