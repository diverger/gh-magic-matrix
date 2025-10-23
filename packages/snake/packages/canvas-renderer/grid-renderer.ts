import { Grid, Color } from "../types/grid";
import { Point } from "../types/point";
import { createRoundedRectPath } from "./canvas-utils";

/**
 * Configuration options for grid rendering.
 */
export interface GridRenderOptions {
  colorDots: Record<number, string>;
  colorEmpty: string;
  colorDotBorder: string;
  cellSize: number;
  dotSize: number;
  dotBorderRadius: number;
}

/**
 * Renders a grid with colored dots on a canvas.
 *
 * @remarks
 * Draws each cell in the grid as a colored dot with rounded corners and borders.
 * Only renders cells that are included in the optional cells filter array.
 * Uses the grid's color values to determine dot colors from the colorDots mapping.
 *
 * @param ctx - The canvas rendering context.
 * @param grid - The grid to render.
 * @param cells - Optional array of specific cells to render (null renders all).
 * @param options - Rendering configuration options.
 */
export const renderGrid = (
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  cells: Point[] | null,
  options: GridRenderOptions
): void => {
  // Create a Set for O(1) cell lookups if filtering is enabled
  const cellSet = cells
    ? new Set(cells.map(cell => `${cell.x},${cell.y}`))
    : null;

  for (let x = grid.width; x--; ) {
    for (let y = grid.height; y--; ) {
      // Skip if cells filter is provided and this cell is not included
      if (cellSet && !cellSet.has(`${x},${y}`)) {
        continue;
      }

      const cellColor = grid.getColor(x, y);
      const fillColor = grid.isEmptyCell(cellColor)
        ? options.colorEmpty
        : options.colorDots[cellColor as number] || options.colorEmpty;

      ctx.save();

      // Position the dot within the cell
      ctx.translate(
        x * options.cellSize + (options.cellSize - options.dotSize) / 2,
        y * options.cellSize + (options.cellSize - options.dotSize) / 2
      );

      // Set drawing styles
      ctx.fillStyle = fillColor;
      ctx.strokeStyle = options.colorDotBorder;
      ctx.lineWidth = 1;

      // Draw the rounded rectangle
      ctx.beginPath();
      createRoundedRectPath(ctx, options.dotSize, options.dotSize, options.dotBorderRadius);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  }
};