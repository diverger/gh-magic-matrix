import { Grid, Color, EMPTY } from "../types/grid";
import { Point, neighbors4 } from "../types/point";

export type Outside = Grid & { __outside: true };

// Sentinel value for cells marked as "inside" (not reachable from boundary)
const INSIDE: Color = 1 as Color;

export class OutsideGrid {
  private grid: Outside;

  constructor(baseGrid: Grid, color: Color | typeof EMPTY = EMPTY) {
    this.grid = this.createOutside(baseGrid, color);
  }

  /**
   * Creates an outside grid marking cells that are reachable from the boundaries.
   *
   * @remarks
   * Initializes a grid of the same size as the base grid, sets all cells as "inside" by default, and then
   * performs a flood fill to mark cells as empty if they are reachable from the boundary and meet the color threshold.
   * Used to track which cells are accessible from the grid's edge for pathfinding and tunnel validation.
   *
   * @param grid - The base grid to use for outside calculation.
   * @param color - The color threshold for marking outside cells.
   * @returns The initialized outside grid with reachable cells marked.
   *
   * @example
   * ```ts
   * const outside = createOutside(baseGrid, EMPTY);
   * ```
   */
  private createOutside(grid: Grid, color: Color | typeof EMPTY): Outside {
    const outside = Grid.createEmpty(grid.width, grid.height) as Outside;

    // Initialize all cells as "inside" (not reachable from boundary)
    for (let x = outside.width; x--; ) {
      for (let y = outside.height; y--; ) {
        outside.setColor(x, y, INSIDE);
      }
    }

    this.fillOutside(outside, grid, color);
    return outside;
  }

  /**
   * Performs a flood fill to mark cells reachable from the outside boundaries using queue-based BFS.
   *
   * @remarks
   * Uses a queue-based breadth-first search (O(W·H)) instead of iterative full-grid sweeps.
   * Seeds the queue with boundary-adjacent cells that meet the color threshold, then propagates
   * the "outside" marking to connected cells in a single pass.
   *
   * Note: The 'outside' grid itself is always a regular rectangle with the same size as the base grid, but the empty region and its edge may be irregular.
   *
   * @param outside - The outside grid to update.
   * @param grid - The base grid used for color checks.
   * @param color - The color threshold for marking outside cells.
   *
   * @example
   * ```ts
   * fillOutside(outsideGrid, baseGrid, EMPTY);
   * ```
   */
  private fillOutside(outside: Grid, grid: Grid, color: Color | typeof EMPTY): void {
    const queue: Point[] = [];
    const visited = new Set<string>();

    // Seed queue with all boundary cells that meet the color threshold
    for (let x = 0; x < outside.width; x++) {
      for (let y = 0; y < outside.height; y++) {
        const isOnBoundary = x === 0 || x === outside.width - 1 || y === 0 || y === outside.height - 1;
        if (isOnBoundary) {
          const gridColor = this.getColorSafe(grid, x, y);
          if ((gridColor as number) <= (color as number)) {
            const key = `${x},${y}`;
            queue.push(new Point(x, y));
            visited.add(key);
            outside.setColorEmpty(x, y);
          }
        }
      }
    }

    // BFS propagation: mark and enqueue connected cells
    while (queue.length > 0) {
      const current = queue.shift()!;

      for (const dir of neighbors4) {
        const nx = current.x + dir.x;
        const ny = current.y + dir.y;
        const key = `${nx},${ny}`;

        if (!visited.has(key) && outside.isInside(nx, ny)) {
          const gridColor = this.getColorSafe(grid, nx, ny);
          if ((gridColor as number) <= (color as number)) {
            visited.add(key);
            queue.push(new Point(nx, ny));
            outside.setColorEmpty(nx, ny);
          }
        }
      }
    }
  }

  /**
   * Checks if a position is outside (reachable from boundaries).
   *
   * **Primary Public API**: Use this method to check if a cell is outside.
   *
   * @remarks
   * Determines whether a cell is considered "outside"—that is, reachable from the grid's boundary according to the outside grid.
   *
   * Note: A cell is considered outside if:
   * 1. It is out of bounds (beyond the grid dimensions), OR
   * 2. It is marked empty in the outside grid (connected to boundary via fillOutside)
   *
   * Important: Isolated empty regions NOT connected to the boundary are NOT considered outside.
   *
   * @param x - The x-coordinate of the cell.
   * @param y - The y-coordinate of the cell.
   * @returns True if the cell is outside, false otherwise.
   */
  isOutside(x: number, y: number): boolean {
    // SNK's pattern: check if not in grid OR if empty in the outside grid
    return !this.grid.isInside(x, y) || this.grid.isEmptyCell(this.grid.getColor(x, y));
  }

  /**
   * Internal helper to check if a position is outside in a specific grid.
   * Used during flood-fill operations to check against a working grid.
   *
   * @internal
   * @param grid - The grid to check against.
   * @param x - The x-coordinate of the cell.
   * @param y - The y-coordinate of the cell.
   * @returns True if the cell is outside in the given grid, false otherwise.
   */
  private isOutsideInGrid(grid: Grid, x: number, y: number): boolean {
    return !grid.isInside(x, y) || grid.isEmptyCell(grid.getColor(x, y));
  }

  /**
   * Get the outside grid
   */
  getGrid(): Outside {
    return this.grid;
  }

  /**
   * Updates the outside grid after changes to the base grid.
   *
   * @remarks
   * Recomputes which cells are reachable from the boundaries by performing a flood fill on the outside grid
   * using the provided base grid and color threshold. Should be called after any mutation to the base grid
   * that affects cell accessibility.
   *
   * Note: The outside grid remains a regular rectangle, but the region marked as outside may change and become irregular after updates.
   *
   * @param baseGrid - The grid to use for recalculating outside cells.
   * @param color - The color threshold for marking outside cells. Defaults to EMPTY.
   */
  update(baseGrid: Grid, color: Color | typeof EMPTY = EMPTY): void {
    this.fillOutside(this.grid, baseGrid, color);
  }

  /**
   * Safe color getter that returns EMPTY for out-of-bounds
   */
  private getColorSafe(grid: Grid, x: number, y: number): Color | typeof EMPTY {
    return grid.isInside(x, y) ? grid.getColor(x, y) : EMPTY;
  }
}
