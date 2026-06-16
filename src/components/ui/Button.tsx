'use client';

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'outline' | 'ghost';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-contrast hover:opacity-90 active:opacity-80 shadow-sm',
  outline:
    'border border-border bg-surface text-foreground hover:bg-surface-2',
  ghost: 'text-muted hover:text-foreground hover:bg-surface-2',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-2.5 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'outline', size = 'md', className = '', type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex select-none items-center justify-center rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
});
