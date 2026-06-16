'use client';

import { useCallback, useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { Button } from './ui/Button';

interface DropzoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
  hint?: string;
}

export function Dropzone({ onFile, disabled = false, hint }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const choose = useCallback(
    (files: FileList | null) => {
      const file = files && files[0];
      if (file && file.type.startsWith('image/')) onFile(file);
    },
    [onFile]
  );

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  return (
    <div className="grid h-full w-full place-items-center p-6">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={openPicker}
        onKeyDown={(event) => {
          if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(event) => {
          if (disabled) return;
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          if (disabled) return;
          event.preventDefault();
          setDragging(false);
          choose(event.dataTransfer.files);
        }}
        className={`flex w-full max-w-xl flex-col items-center gap-5 rounded-2xl border-2 border-dashed px-8 py-14 text-center transition-colors ${
          dragging ? 'border-accent bg-accent/10' : 'border-border bg-surface'
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-accent/60 hover:bg-surface-2'}`}
      >
        <span className="grid h-16 w-16 place-items-center rounded-full bg-accent/10 text-accent">
          <ImagePlus className="h-8 w-8" strokeWidth={1.5} />
        </span>
        <div className="space-y-1.5">
          <p className="text-lg font-semibold text-foreground">
            {disabled ? 'Sketch engine unavailable' : 'Drop a photo to begin'}
          </p>
          <p className="text-sm text-muted">
            or click to browse — JPG, PNG, WebP. Portraits and high-contrast scenes sketch best.
          </p>
        </div>
        <Button
          variant="primary"
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            openPicker();
          }}
        >
          Choose photo
        </Button>
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {hint ?? 'Runs entirely in your browser — your images never leave your device.'}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            choose(event.target.files);
            event.currentTarget.value = '';
          }}
        />
      </div>
    </div>
  );
}
