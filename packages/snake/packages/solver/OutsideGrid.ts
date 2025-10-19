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
   * Flood fill to mark cells reachable from outside
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
   * Update the outside grid after grid changes
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