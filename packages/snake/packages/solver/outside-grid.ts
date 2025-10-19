import { Grid, Color, EMPTY } from "../types/grid";
import { Point, neighbors4 } from "../types/point";

export type Outside = Grid & { __outside: true };

export class OutsideGrid {
  private grid: Outside;

  constructor(baseGrid: Grid, color: Color | typeof EMPTY = EMPTY) {
    this.grid = this.createOutside(baseGrid, color);
  }

  /**
   * Create an outside grid marking reachable cells from boundaries
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
   * @description
   * Iteratively updates the outside grid by marking cells as empty if they are reachable from the boundary
   * and their color is below or equal to the threshold. Used to maintain the outside grid after changes to the base grid.
   *
   * @param {Grid} outside The outside grid to update.
   * @param {Grid} grid The base grid used for color checks.
   * @param {Color | typeof EMPTY} color The color threshold for marking outside cells.
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
   * Check if a position is outside (reachable from boundaries)
   */
  isOutside(x: number, y: number): boolean;
  isOutside(grid: Grid, x: number, y: number): boolean;
  isOutside(gridOrX: Grid | number, xOrY?: number, y?: number): boolean {
    if (typeof gridOrX === "number") {
      // Single grid version
      return this.isOutside(this.grid, gridOrX, xOrY!);
    } else {
      // Explicit grid version
      const grid = gridOrX;
      const x = xOrY!;
      const _y = y!;
      return !grid.isInside(x, _y) || grid.isEmptyCell(grid.getColor(x, _y));
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
   * @description
   * Recomputes which cells are reachable from the boundaries by performing a flood fill on the outside grid
   * using the provided base grid and color threshold. Should be called after any mutation to the base grid
   * that affects cell accessibility.
   *
   * @param {Grid} baseGrid The grid to use for recalculating outside cells.
   * @param {Color | typeof EMPTY} [color=EMPTY] The color threshold for marking outside cells.
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
