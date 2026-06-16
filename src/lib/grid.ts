/** Interior grid line fractions (0..1), excluding the outer border. */
export function gridFractions(divisions: number): number[] {
  const out: number[] = [];
  for (let i = 1; i < divisions; i += 1) out.push(i / divisions);
  return out;
}

export interface DrawGridOptions {
  color?: string;
  lineWidth?: number;
}

/**
 * Draw an NxN teaching grid onto a 2D canvas context covering `width`x`height`.
 * Used by the PNG export path (the live overlay is rendered as crisp SVG).
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  divisions: number,
  options: DrawGridOptions = {}
): void {
  if (divisions < 2) return;
  const { color = 'rgba(56, 189, 248, 0.7)', lineWidth = Math.max(1, Math.round(width / 1200)) } =
    options;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  for (const f of gridFractions(divisions)) {
    const x = Math.round(f * width) + 0.5;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (const f of gridFractions(divisions)) {
    const y = Math.round(f * height) + 0.5;
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();

  // Outer frame.
  ctx.lineWidth = lineWidth * 1.5;
  ctx.strokeRect(0, 0, width, height);
  ctx.restore();
}
