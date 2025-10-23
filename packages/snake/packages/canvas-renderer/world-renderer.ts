import { Grid, Color } from "../types/grid";
import { Snake } from "../types/snake";
import { Point } from "../types/point";
import { renderGrid, GridRenderOptions } from "./grid-renderer";
import { renderSnake, renderSnakeWithInterpolation, SnakeRenderOptions } from "./snake-renderer";
import { renderCircularStack, CircularStackRenderOptions } from "./circular-stack";

/**
 * Complete configuration options for world rendering.
 */
export interface WorldRenderOptions {
  colorDots: Record<number, string>;
  colorEmpty: string;
  colorDotBorder: string;
  colorSnake: string;
  cellSize: number;
  dotSize: number;
  dotBorderRadius: number;
}

/**
 * Renders a horizontal stack visualization.
 *
 * @remarks
 * Displays stack items as a linear progression, useful for showing collected
 * items or progress. Each item is rendered as a colored rectangle with the
 * width proportional to the total stack size.
 *
 * @param ctx - The canvas rendering context.
 * @param stack - Array of color values representing the stack items.
 * @param maxItems - Maximum number of items for width calculation.
 * @param totalWidth - Total width available for the stack.
 * @param options - Color mapping for stack items.
 */
export const renderHorizontalStack = (
  ctx: CanvasRenderingContext2D,
  stack: number[],
  maxItems: number,
  totalWidth: number,
  options: { colorDots: Record<number, string> }
): void => {
  if (stack.length === 0) return;

  ctx.save();

  const safeMax = Math.max(maxItems, Math.max(1, stack.length));
  const itemWidth = totalWidth / safeMax;

  for (let i = 0; i < stack.length; i++) {
    const color = options.colorDots[stack[i]];
    if (!color) continue;

    ctx.fillStyle = color;
    ctx.fillRect(
      i * itemWidth,
      0,
      Math.min(itemWidth + totalWidth * 0.005, totalWidth - i * itemWidth),
      10
    );
  }

  ctx.restore();
};

/**
 * Renders a complete world scene with grid, snake, and stack.
 *
 * @remarks
 * Combines grid, snake, and stack visualizations into a cohesive scene.
 * The grid and snake are rendered in the main area, while the stack is
 * displayed below as a progress indicator. Includes proper spacing and
 * positioning for all elements.
 *
 * @param ctx - The canvas rendering context.
 * @param grid - The game grid to render.
 * @param visibleCells - Optional array of cells to highlight (null renders all).
 * @param snake - The snake to render.
 * @param stack - Array of collected items to display as progress.
 * @param options - Complete rendering configuration.
 */
export const renderWorld = (
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  visibleCells: Point[] | null,
  snake: Snake,
  stack: number[],
  options: WorldRenderOptions
): void => {
  // Render main game area
  ctx.save();
  ctx.translate(options.cellSize, 2 * options.cellSize);

  renderGrid(ctx, grid, visibleCells, {
    colorDots: options.colorDots,
    colorEmpty: options.colorEmpty,
    colorDotBorder: options.colorDotBorder,
    cellSize: options.cellSize,
    dotSize: options.dotSize,
    dotBorderRadius: options.dotBorderRadius,
  });

  renderSnake(ctx, snake, {
    colorSnake: options.colorSnake,
    cellSize: options.cellSize,
  });

  ctx.restore();

  // Render progress stack
  ctx.save();
  ctx.translate(options.cellSize, (grid.height + 4) * options.cellSize);

  const gridTotal = grid.data.reduce((sum, x) => sum + (x ? 1 : 0), 0);
  const maxItems = Math.max(gridTotal, stack.length);
  renderHorizontalStack(ctx, stack, maxItems, grid.width * options.cellSize, {
    colorDots: options.colorDots,
  });

  ctx.restore();
};

/**
 * Renders a world scene with interpolated snake animation.
 *
 * @remarks
 * Similar to renderWorld but with smooth snake animation between two states.
 * Useful for creating fluid transitions during snake movement or game state
 * changes. The interpolation factor controls the animation progress.
 *
 * @param ctx - The canvas rendering context.
 * @param grid - The game grid to render.
 * @param visibleCells - Optional array of cells to highlight (null renders all).
 * @param snakeStart - Starting snake state for interpolation.
 * @param snakeEnd - Ending snake state for interpolation.
 * @param stack - Array of collected items to display as progress.
 * @param interpolationFactor - Animation progress (0-1).
 * @param options - Complete rendering configuration.
 */
export const renderWorldWithInterpolation = (
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  visibleCells: Point[] | null,
  snakeStart: Snake,
  snakeEnd: Snake,
  stack: number[],
  interpolationFactor: number,
  options: WorldRenderOptions
): void => {
  // Render main game area with interpolated snake
  ctx.save();
  ctx.translate(options.cellSize, 2 * options.cellSize);

  renderGrid(ctx, grid, visibleCells, {
    colorDots: options.colorDots,
    colorEmpty: options.colorEmpty,
    colorDotBorder: options.colorDotBorder,
    cellSize: options.cellSize,
    dotSize: options.dotSize,
    dotBorderRadius: options.dotBorderRadius,
  });

  renderSnakeWithInterpolation(ctx, snakeStart, snakeEnd, interpolationFactor, {
    colorSnake: options.colorSnake,
    cellSize: options.cellSize,
  });

  ctx.restore();

  // Render progress stack
  ctx.save();
  ctx.translate(options.cellSize, (grid.height + 4) * options.cellSize);

  const gridTotal = grid.data.reduce((sum, x) => sum + (x ? 1 : 0), 0);
  const maxItems = Math.max(gridTotal, stack.length);
  renderHorizontalStack(ctx, stack, maxItems, grid.width * options.cellSize, {
    colorDots: options.colorDots,
  });

  ctx.restore();
};