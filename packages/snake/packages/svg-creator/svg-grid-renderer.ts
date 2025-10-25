import { Grid, Color, EMPTY } from "../types/grid";
import { Point } from "../types/point";
import { createElement } from "./svg-utils";
import { createKeyframeAnimation, createCssRule, AnimationKeyframe } from "./css-utils";

/**
 * Represents a grid cell with animation properties.
 */
export interface AnimatedGridCell {
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
  /** Animation time offset (0-1), null for non-animated cells */
  animationTime: number | null;
  /** Cell color value */
  color: Color | typeof EMPTY;
}

/**
 * Configuration options for SVG grid rendering.
 */
export interface SvgGridRenderOptions {
  colorDots: Record<number, string>;
  colorEmpty: string;
  colorDotBorder: string;
  cellSize: number;
  dotSize: number;
  dotBorderRadius: number;
}

/**
 * Result of SVG grid rendering containing elements and styles.
 */
export interface SvgGridResult {
  svgElements: string[];
  styles: string[];
}

/**
 * Renders an animated SVG grid with cells that change color over time.
 *
 * @remarks
 * Creates SVG rectangle elements for each grid cell with CSS animations.
 * Cells with animation timing will transition from their original color to empty.
 * Uses CSS custom properties for theming and generates optimized animations.
 *
 * @param cells - Array of grid cells with animation and color data.
 * @param options - Rendering configuration options.
 * @param duration - Total animation duration in milliseconds.
 * @returns Object containing SVG elements and CSS styles.
 *
 * @example
 * ```typescript
 * const result = renderAnimatedSvgGrid(cells, {
 *   colorDots: { 1: '#ff0000', 2: '#00ff00' },
 *   colorEmpty: '#ffffff',
 *   colorDotBorder: '#000000',
 *   cellSize: 16,
 *   dotSize: 12,
 *   dotBorderRadius: 2
 * }, 5000);
 * ```
 */
export const renderAnimatedSvgGrid = (
  cells: AnimatedGridCell[],
  options: SvgGridRenderOptions,
  duration: number
): SvgGridResult => {
  const svgElements: string[] = [];
  const styles: string[] = [];

  // Base grid cell style
  const baseCellStyle = createCssRule(".grid-cell", {
    "shape-rendering": "geometricPrecision",
    fill: "var(--ce)",
    "stroke-width": "1px",
    stroke: "var(--cb)",
    /* animation assigned per-cell when needed */
    width: `${options.dotSize}px`,
    height: `${options.dotSize}px`,
  });

  styles.push(baseCellStyle);

  let animationIndex = 0;

  for (const cell of cells) {
    const { x, y, color, animationTime } = cell;
    const classes = ["grid-cell"];

    // Calculate position within cell
    const margin = (options.cellSize - options.dotSize) / 2;

    // Handle animated cells - only animate non-empty cells
    if (animationTime !== null && color > 0) {
      const t = Math.max(0, Math.min(1, animationTime));
      const animationId = `cell-${(animationIndex++).toString(36)}`;
      classes.push(animationId);

      // Match SNK's behavior: cell disappears when snake eats it and stays gone
      // Use 0.0001 offset for near-instant fade, preventing "sucking" effect
      const fadeOffset = 0.0001;
      const keyframes: AnimationKeyframe[] = [
        { t: Math.max(0, t - fadeOffset), style: `fill:var(--c${color})` },
        { t: Math.min(1, t + fadeOffset), style: `fill:var(--ce)` },
        { t: 1, style: `fill:var(--ce)` },
      ];

      const animationName = `anim-${animationId}`;

      styles.push(
        createKeyframeAnimation(animationName, keyframes),
        createCssRule(`.grid-cell.${animationId}`, {
          fill: `var(--c${color})`,
          animation: `${animationName} ${duration}ms linear infinite`,
        })
      );
    }

    // Create SVG rectangle element
    const rectElement = createElement("rect", {
      class: classes.join(" "),
      x: x * options.cellSize + margin,
      y: y * options.cellSize + margin,
      rx: options.dotBorderRadius,
      ry: options.dotBorderRadius,
    });

    svgElements.push(rectElement);
  }

  return { svgElements, styles };
};

/**
 * Creates grid cells from a Grid object with animation timing based on snake movement.
 *
 * @param initialGrid - The initial state of the grid.
 * @param snakeChain - Array of snake states representing the movement sequence.
 * @param visibleCells - Optional array of specific cells to include (null includes all).
 * @returns Array of animated grid cells with timing information.
 */
export const createAnimatedGridCells = (
  initialGrid: Grid,
  snakeChain: import("../types/snake").Snake[],
  visibleCells: Point[] | null
): AnimatedGridCell[] => {
  // Get all cells or use provided filter
  const allCells: Point[] = visibleCells ??
    Array.from({ length: initialGrid.width }, (_, x) =>
      Array.from({ length: initialGrid.height }, (_, y) => new Point(x, y))
    ).flat();

  // Initialize cells with original colors and no animation
  const animatedCells: AnimatedGridCell[] = allCells.map((point) => ({
    x: point.x,
    y: point.y,
    animationTime: null,
    color: initialGrid.getColor(point.x, point.y),
  }));

  // Simulate snake movement and mark consumption times
  const workingGrid = initialGrid.clone();

  for (let i = 0; i < snakeChain.length; i++) {
    const snake = snakeChain[i];
    const head = snake.getHead();

    if (workingGrid.isInside(head.x, head.y)) {
      const cellColor = workingGrid.getColor(head.x, head.y);
      const isEmpty = workingGrid.isEmptyCell(cellColor);

      // Mark non-empty cells as consumed (for grid rendering)
      if (!isEmpty) {
        workingGrid.setColorEmpty(head.x, head.y);
      }

      // Set animation time for ALL cells (including empty ones)
      // This enables progress stack to show animations for empty cells (L0 sprite)
      const cell = animatedCells.find(c => c.x === head.x && c.y === head.y);
      if (cell && cell.animationTime === null) {
        // SNK uses i / snakeChain.length - cell appears when snake head touches it
        // Only set animationTime on first visit (for return path, don't re-trigger animation)
        cell.animationTime = i / snakeChain.length;
      }
    } else {
      // Snake is outside the grid - add this position as an empty cell (L0 animation)
      // Check if this outside position already exists in animatedCells
      const existingCell = animatedCells.find(c => c.x === head.x && c.y === head.y);

      if (!existingCell) {
        // Create new cell for this outside position
        const outsideCell: AnimatedGridCell = {
          x: head.x,
          y: head.y,
          animationTime: i / snakeChain.length,
          color: EMPTY, // Empty cell (no contribution)
        };
        animatedCells.push(outsideCell);
      } else if (existingCell.animationTime === null) {
        // Position exists but hasn't been animated yet
        existingCell.animationTime = i / snakeChain.length;
      }
    }
  }

  return animatedCells;
};