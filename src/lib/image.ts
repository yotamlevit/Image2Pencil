import { drawGrid } from './grid';

export interface DecodedImage {
  /** Full-resolution bitmap, kept for the reference (original) panel. */
  bitmap: ImageBitmap;
  /** Pixel data handed to the worker (its buffer is transferred). */
  imageData: ImageData;
  width: number;
  height: number;
}

/** Decode a user file into an ImageBitmap (display) + ImageData (worker input). */
export async function fileToImageData(file: File): Promise<DecodedImage> {
  const bitmap = await decodeToBitmap(file);
  const { width, height } = bitmap;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not acquire a 2D canvas context.');
  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, width, height);
  return { bitmap, imageData, width, height };
}

async function decodeToBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    // Fallback for browsers/formats that reject createImageBitmap(File).
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return await createImageBitmap(img);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

export interface ExportOptions {
  bitmap: ImageBitmap;
  width: number;
  height: number;
  mirror: boolean;
  /** When >= 2, the teaching grid is baked into the PNG. */
  divisions?: number;
  filename: string;
}

/** Render the sketch (optionally mirrored / gridded) to a PNG and trigger a download. */
export async function exportSketchPng(opts: ExportOptions): Promise<void> {
  const { bitmap, width, height, mirror, divisions, filename } = opts;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not acquire a 2D canvas context.');

  // Sketches sit on white paper — guarantee an opaque background.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  if (mirror) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  ctx.restore();

  if (divisions && divisions >= 2) {
    drawGrid(ctx, width, height, divisions, { color: 'rgba(15, 23, 42, 0.55)' });
  }

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png')
  );
  if (!blob) throw new Error('Failed to encode the PNG.');

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
