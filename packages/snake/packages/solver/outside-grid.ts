import { Grid, Color, EMPTY } from "../types/grid";
import { Point, neighbors4 } from "../types/point";

export type Outside = Grid & { __outside: true };

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

    // Initialize all cells as "inside" (value 1)
    for (let x = outside.width; x--; ) {
      for (let y = outside.height; y--; ) {
        outside.setColor(x, y, 1 as Color);
      }
    }

    this.fillOutside(outside, grid, color);
    return outside;
  }

  /**
   * Performs a flood fill to mark cells reachable from the outside boundaries.
   *
   * @remarks
   * Iteratively updates the outside grid by marking cells as empty if they are reachable from the boundary
   * and their color is below or equal to the threshold. Used to maintain the outside grid after changes to the base grid.
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
    let changed = true;
    while (changed) {
      changed = false;
      for (let x = outside.width; x--; ) {
        for (let y = outside.height; y--; ) {
          const gridColor = this.getColorSafe(grid, x, y);
          if (
            (gridColor as number) <= (color as number) &&
            !this.isOutside(outside, x, y) &&
            neighbors4.some((dir) => this.isOutside(outside, x + dir.x, y + dir.y))
          ) {
            changed = true;
            outside.setColorEmpty(x, y);
          }
        }
      }
    }
  }

  /**
   * Checks if a position is outside (reachable from boundaries).
   *
   * @remarks
   * Determines whether a cell is considered "outside"—that is, reachable from the grid's boundary according to the outside grid.
   * Can be called with either coordinates (using the internal outside grid) or with an explicit grid and coordinates.
   *
   * Note: A cell is considered outside if it is out of bounds or marked empty in the grid, even if it's an isolated empty region not connected to the boundary.
   *
   * @param x - The x-coordinate of the cell (when using the internal outside grid).
   * @param y - The y-coordinate of the cell (when using the internal outside grid).
   * @param grid - The grid to check (optional, for explicit grid version).
   * @returns True if the cell is outside, false otherwise.
   */
  isOutside(x: number, y: number): boolean;
  isOutside(grid: Grid, x: number, y: number): boolean;
  isOutside(gridOrX: Grid | number, xOrY?: number, y?: number): boolean {
    if (typeof gridOrX === "number") {
      // Single parameter version - check against our outside grid
      const x = gridOrX;
      const y = xOrY!;
      // SNK's pattern: check if not in grid OR if empty in the outside grid
      return !this.grid.isInside(x, y) || this.grid.isEmptyCell(this.grid.getColor(x, y));
    } else {
      // Two parameter version (unused, but keeping for compatibility)
      // This version is confusing and shouldn't be used - the outside check
      // should always be against the outside grid, not an arbitrary grid
      const x = xOrY!;
      const _y = y!;
      return !this.grid.isInside(x, _y) || this.grid.isEmptyCell(this.grid.getColor(x, _y));
    }
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
