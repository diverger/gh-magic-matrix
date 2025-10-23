import { Snake } from "../types/snake";
import { createRoundedRectPath, lerp, clamp } from "./canvas-utils";

/**
 * Configuration options for snake rendering.
 */
export interface SnakeRenderOptions {
  colorSnake: string;
  cellSize: number;
}

/**
 * Renders a snake on the canvas.
 *
 * @remarks
 * Draws each segment of the snake as a rounded rectangle with decreasing size
 * from head to tail. The snake segments are rendered with padding that increases
 * based on the segment index to create a tapered effect.
 *
 * @param ctx - The canvas rendering context.
 * @param snake - The snake to render.
 * @param options - Rendering configuration options.
 */
export const renderSnake = (
  ctx: CanvasRenderingContext2D,
  snake: Snake,
  options: SnakeRenderOptions
): void => {
  const cells = snake.toCells();

  for (let i = 0; i < cells.length; i++) {
    const padding = Math.min((i + 1) * 0.6, (options.cellSize - 2) / 2);

    ctx.save();
    ctx.fillStyle = options.colorSnake;
    ctx.translate(
      cells[i].x * options.cellSize + padding,
      cells[i].y * options.cellSize + padding
    );

    const segmentSize = Math.max(2, options.cellSize - padding * 2);
    const borderRadius = segmentSize * 0.25;

    ctx.beginPath();
    createRoundedRectPath(ctx, segmentSize, segmentSize, borderRadius);
    ctx.fill();
    ctx.restore();
  }
};

/**
 * Renders a snake with interpolation between two states for smooth animation.
 *
 * @remarks
 * Creates smooth transitions between two snake states by interpolating the position
 * of each segment. Uses a cascading animation where segments follow the head with
 * a slight delay, creating a natural snake movement effect.
 *
 * @param ctx - The canvas rendering context.
 * @param snakeStart - The starting snake state.
 * @param snakeEnd - The ending snake state.
 * @param interpolationFactor - Animation progress (0-1).
 * @param options - Rendering configuration options.
 */
export const renderSnakeWithInterpolation = (
  ctx: CanvasRenderingContext2D,
  snakeStart: Snake,
  snakeEnd: Snake,
  interpolationFactor: number,
  options: SnakeRenderOptions
): void => {
  const animationSpread = 0.8;

  // Compute cells once before the loop
  const startCells = snakeStart.toCells();
  const endCells = snakeEnd.toCells();
  const segmentCount = Math.min(startCells.length, endCells.length);

  for (let i = 0; i < segmentCount; i++) {
    const padding = Math.min((i + 1) * 0.6, (options.cellSize - 2) / 2);

    // Calculate delayed animation for this segment
    const delayOffset = (1 - animationSpread) * (i / Math.max(segmentCount - 1, 1));
    const segmentInterpolation = clamp(
      (interpolationFactor - delayOffset) / animationSpread,
      0,
      1
    );

    const startX = startCells[i]?.x ?? 0;
    const startY = startCells[i]?.y ?? 0;
    const endX = endCells[i]?.x ?? 0;
    const endY = endCells[i]?.y ?? 0;

    // Interpolate position
    const x = lerp(segmentInterpolation, startX, endX);
    const y = lerp(segmentInterpolation, startY, endY);

    ctx.save();
    ctx.fillStyle = options.colorSnake;
    ctx.translate(x * options.cellSize + padding, y * options.cellSize + padding);

    const segmentSize = options.cellSize - padding * 2;
    const borderRadius = segmentSize * 0.25;

    ctx.beginPath();
    createRoundedRectPath(ctx, segmentSize, segmentSize, borderRadius);
    ctx.fill();
    ctx.restore();
  }
};