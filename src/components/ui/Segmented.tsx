'use client';

interface SegmentedOption<T> {
  label: string;
  value: T;
}

interface SegmentedProps<T extends string | number> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  disabled = false,
  ariaLabel,
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`flex gap-1 rounded-lg border border-border bg-surface-2 p-1 ${
        disabled ? 'opacity-40' : ''
      }`}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed ${
              active
                ? 'bg-accent text-accent-contrast shadow-sm'
                : 'text-muted hover:bg-surface hover:text-foreground'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
