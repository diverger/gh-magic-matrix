import { Snake } from "../types/snake";
import { createRoundedRectPath, lerp, clamp } from "./canvas-utils";

/**
 * Configuration options for snake rendering.
 */
export interface SnakeRenderOptions {
  colorSnake: string;
  cellSize: number;
  /**
   * Optional array of colors for individual segments or function to generate colors
   * - Array: ['#ff0000', '#00ff00', '#0000ff'] - specific color for each segment
   * - Function: (index, total) => color - dynamically generate color for each segment
   * If provided, overrides colorSnake
   * If array is shorter than snake length, remaining segments use the last color
   */
  colorSegments?: string[] | ((segmentIndex: number, totalLength: number) => string);
  /**
   * Color shift mode for multi-color snakes (when colorSegments is an array)
   * - 'none': Static colors (default) - each segment keeps its assigned color
   * - 'every-step': Shift colors on every grid movement (creates flowing color animation)
   * - 'on-eat': Shift colors only when eating a colored cell (contribution-based shifting)
   * Note: Canvas renderer uses static colors; shift modes are primarily for SVG animation
   */
  colorShiftMode?: 'none' | 'every-step' | 'on-eat';
  /** Frame index for color shifting (used when colorShiftMode is active) */
  colorShiftOffset?: number;
}

/**
 * Helper function to create a color getter function for snake segments.
 * Ensures consistent gradient behavior across different rendering contexts.
 *
 * @param options - Rendering configuration options
 * @param totalSegments - Total number of segments being rendered
 * @returns Function that returns color for a given segment index
 */
const createColorGetter = (
  options: SnakeRenderOptions,
  totalSegments: number
): ((segmentIndex: number) => string) => {
  const colorSegments = options.colorSegments;
  const shiftMode = options.colorShiftMode || 'none';
  const shiftOffset = options.colorShiftOffset || 0;

  return (segmentIndex: number): string => {
    // Case 1: No custom segment colors - use default colorSnake
    if (!colorSegments) {
      return options.colorSnake;
    }

    // Case 2: colorSegments is a function - call it with total segments count
    if (typeof colorSegments === 'function') {
      return colorSegments(segmentIndex, totalSegments);
    }

    // Case 3: colorSegments is an array - apply shifting if enabled
    if (Array.isArray(colorSegments)) {
      let finalShiftOffset = 0;

      // Apply shift offset based on mode
      if (shiftMode === 'every-step' || shiftMode === 'on-eat') {
        finalShiftOffset = shiftOffset;
      }

      // Calculate color index with shift
      const colorIndex = (segmentIndex + finalShiftOffset) % colorSegments.length;
      return colorSegments[colorIndex];
    }

    return options.colorSnake;
  };
};

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
  const totalSegments = cells.length;

  // Create color getter with consistent total length
  const getColorForSegment = createColorGetter(options, totalSegments);

  for (let i = 0; i < cells.length; i++) {
    const padding = Math.min((i + 1) * 0.6, (options.cellSize - 2) / 2);

    ctx.save();
    ctx.fillStyle = getColorForSegment(i);
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
  const totalSegments = segmentCount;

  // Create color getter with consistent total length
  const getColorForSegment = createColorGetter(options, totalSegments);

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
    ctx.fillStyle = getColorForSegment(i);
    ctx.translate(x * options.cellSize + padding, y * options.cellSize + padding);

    const segmentSize = options.cellSize - padding * 2;
    const borderRadius = segmentSize * 0.25;

    ctx.beginPath();
    createRoundedRectPath(ctx, segmentSize, segmentSize, borderRadius);
    ctx.fill();
    ctx.restore();
  }
};