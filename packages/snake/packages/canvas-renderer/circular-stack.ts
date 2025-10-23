import { Point } from "../types/point";

/**
 * Generates cell positions arranged in a circular pattern.
 *
 * @remarks
 * Creates a spiral pattern of points starting from the center and moving outward.
 * Points are sorted by their distance from center and angular position to create
 * a smooth circular filling pattern. Used for circular stack visualizations.
 *
 * @param cellCount - Number of cells to generate.
 * @returns Array of points with x, y coordinates.
 */
export const generateCircularCellPattern = (cellCount: number): Point[] => {
  const gridSize = Math.ceil(Math.sqrt(cellCount));
  const cells: Array<{ x: number; y: number; sortKey: number }> = [];

  for (let x = -gridSize; x <= gridSize; x++) {
    for (let y = -gridSize; y <= gridSize; y++) {
      // Calculate angle for consistent spiral pattern
      const angle = (Math.atan2(y, x) + (5 * Math.PI) / 2) % (Math.PI * 2);

      // Sort by radial distance with angle as tie-breaker (spiral)
      const dist = Math.hypot(x, y);
      const sortKey = dist * 100 + angle;

      cells.push({ x, y, sortKey });
    }
  }

  // Sort by the spiral pattern and return only the required number
  return cells
    .sort((a, b) => a.sortKey - b.sortKey)
    .slice(0, cellCount)
    .map(({ x, y }) => new Point(x, y));
};

/**
 * Configuration options for circular stack rendering.
 */
export interface CircularStackRenderOptions {
  colorDots: Record<number, string>;
  colorBorder: string;
  cellSize: number;
  dotSize: number;
  borderRadius: number;
}

/**
 * Renders a circular stack visualization.
 *
 * @remarks
 * Displays stack items in a circular pattern emanating from the center.
 * Each stack item is rendered as a colored dot positioned according to
 * the circular cell pattern. Useful for showing collected items or progress.
 *
 * @param ctx - The canvas rendering context.
 * @param stack - Array of color values representing the stack items.
 * @param options - Rendering configuration options.
 */
export const renderCircularStack = (
  ctx: CanvasRenderingContext2D,
  stack: number[],
  options: CircularStackRenderOptions
): void => {
  if (stack.length === 0) return;

  const cellPositions = generateCircularCellPattern(stack.length);

  ctx.save();

  for (let i = 0; i < stack.length; i++) {
    const position = cellPositions[i];
    const color = options.colorDots[stack[i]];

    if (!color) continue;

    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = options.colorBorder;
    ctx.lineWidth = 1;

    ctx.translate(
      position.x * options.cellSize + options.cellSize / 2,
      position.y * options.cellSize + options.cellSize / 2
    );

    ctx.beginPath();
    ctx.roundRect(
      -options.dotSize / 2,
      -options.dotSize / 2,
      options.dotSize,
      options.dotSize,
      options.borderRadius
    );
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  ctx.restore();
};