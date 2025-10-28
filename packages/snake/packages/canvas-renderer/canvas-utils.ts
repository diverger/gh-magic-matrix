/**
 * Canvas utility functions for drawing operations.
 */

/**
 * Creates a rounded rectangle path on the canvas context.
 *
 * @param ctx - The canvas rendering context.
 * @param width - The width of the rectangle.
 * @param height - The height of the rectangle.
 * @param borderRadius - The radius for rounded corners.
 */
export const createRoundedRectPath = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  borderRadius: number
): void => {
  const r = Math.max(0, Math.min(borderRadius, Math.min(width, height) / 2));
  ctx.moveTo(r, 0);
  ctx.arcTo(width, 0, width, height, r);
  ctx.arcTo(width, height, 0, height, r);
  ctx.arcTo(0, height, 0, 0, r);
  ctx.arcTo(0, 0, width, 0, r);
  ctx.closePath();
};

/**
 * Linear interpolation between two values.
 *
 * @param t - Interpolation factor (0-1).
 * @param start - Start value.
 * @param end - End value.
 * @returns Interpolated value.
 */
export const lerp = (t: number, start: number, end: number): number => {
  return (1 - t) * start + t * end;
};

/**
 * Clamps a value between min and max bounds.
 *
 * @param value - The value to clamp.
 * @param min - Minimum bound.
 * @param max - Maximum bound.
 * @returns Clamped value.
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Checks if a point is inside a circle using sampling.
 *
 * @param x - X coordinate.
 * @param y - Y coordinate.
 * @param radius - Circle radius.
 * @param samples - Number of samples per axis (default: 6).
 * @returns True if the point is inside the circle.
 */
export const isInsideCircle = (
  x: number,
  y: number,
  radius: number,
  samples: number = 6
): boolean => {
  let insideCount = 0;
  const r2 = radius * radius;
  const total = samples * samples;
  const threshold = Math.floor(total * 0.6) + 1; // >60%

  for (let dx = 0; dx < samples; dx++) {
    for (let dy = 0; dy < samples; dy++) {
      const sampleX = x + (dx + 0.5) / samples;
      const sampleY = y + (dy + 0.5) / samples;

      if (sampleX * sampleX + sampleY * sampleY < r2 && ++insideCount >= threshold) return true;
    }
  }

  return insideCount >= threshold;
};