export type Color = (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9) & { _tag: "__Color__" };
export type Empty = 0 & { _tag: "__Empty__" };
export const EMPTY: Empty = 0 as Empty;

/**
 * Grid class representing a 2D game board.
 *
 * **IMPORTANT: Storage Order**
 * This grid uses **column-major ordering** (x * height + y).
 * Data is stored as: [col0_row0, col0_row1, ..., col1_row0, col1_row1, ...]
 * This differs from typical row-major ordering (y * width + x).
 *
 * Example for 3x2 grid:
 * - Visual layout: (0,0) (1,0) (2,0)
 *                  (0,1) (1,1) (2,1)
 * - Storage order: [data[0,0], data[0,1], data[1,0], data[1,1], data[2,0], data[2,1]]
 */
export class Grid {

  width: number;
  height: number;
  data: Uint8Array;

  /**
   * Fills the grid with random colors and empty cells.
   * @param options - { colors?: Color[]; emptyP?: number } where emptyP is the probability (0..1) of a cell being empty
   * @param rand - Optional random function that returns values in [0, 1)
   */
  randomlyFill(options?: { colors?: Color[]; emptyP?: number }, rand?: () => number) {
    const { colors = [1, 2, 3] as Color[], emptyP = 0.2 } = options || {};
    const randomFn = rand || Math.random;

    // Validate emptyP is a valid probability
    if (emptyP < 0 || emptyP > 1) {
      throw new RangeError(`emptyP must be in range [0, 1], got ${emptyP}`);
    }
    // Validate color palette
    if (colors.length === 0 && emptyP < 1) {
      throw new RangeError("colors must be non-empty when emptyP < 1");
    }

    for (let x = this.width; x--; )
      for (let y = this.height; y--; ) {
        if (randomFn() < emptyP) {
          this.setColorEmpty(x, y);
        } else {
          const r = randomFn();
          const idx = Math.min(colors.length - 1, Math.max(0, Math.floor(r * colors.length)));
          const colorIndex = idx;
          this.setColor(x, y, colors[colorIndex]);
        }
      }
  }

  constructor(width: number, height: number, data?: Uint8Array) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
      throw new RangeError(`Invalid grid size: ${width}x${height}. Must be positive integers.`);
    }
    this.width = width;
    this.height = height;
    const expected = width * height;
    if (data !== undefined) {
      if (!(data instanceof Uint8Array)) {
        throw new TypeError("data must be a Uint8Array");
      }
      if (data.length !== expected) {
        throw new RangeError(`data.length (${data.length}) must equal width*height (${expected}).`);
      }
      this.data = new Uint8Array(data);
    } else {
      this.data = new Uint8Array(expected);
    }
  }

  static createEmpty(width: number, height: number): Grid {
    return new Grid(width, height);
  }

  isInside(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  /**
   * Checks if the coordinate (x, y) is inside the grid, allowing for a margin (buffer) of m cells
   * beyond the normal grid boundaries. This expands the valid area by m in all directions.
   *
   * @param m - The margin (number of cells to expand the boundary)
   * @param x - The x coordinate to check
   * @param y - The y coordinate to check
   * @returns true if (x, y) is within the expanded area, false otherwise
   */
  isInsideLarge(m: number, x: number, y: number): boolean {
    return x >= -m && y >= -m && x < this.width + m && y < this.height + m;
  }


  private getIndex(x: number, y: number): number {
    return x * this.height + y;
  }

  getColor(x: number, y: number): Color | Empty {
    if (!this.isInside(x, y)) {
      throw new RangeError(
        `getColor out of bounds: (${x},${y}) not in ${this.width}x${this.height}`
      );
    }
    const value = this.data[this.getIndex(x, y)];
    if (value === 0) return EMPTY;
    if (value >= 1 && value <= 9) return value as Color;
    throw new RangeError(
      `Invalid color value ${value} at (${x},${y}); expected 0..9`
    );
  }


  setColor(x: number, y: number, color: Color | Empty): void {
    if (!this.isInside(x, y)) {
      throw new RangeError(`setColor out of bounds: (${x},${y}) not in ${this.width}x${this.height}`);
    }
    const n = color as number;
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0 || n > 9) {
      throw new RangeError(`Color out of range: ${n}. Expected 0..9`);
    }
    this.data[this.getIndex(x, y)] = n;
  }


  setColorEmpty(x: number, y: number): void {
    this.setColor(x, y, EMPTY);
  }


  isEmptyCell(color: Color | Empty): color is Empty {
    return (color as number) === 0;
  }

  isGridEmpty(): boolean {
    return this.data.every((x) => x === 0);
  }

  equals(other: Grid): boolean {
    // Fast path: check dimensions first
    if (this.width !== other.width || this.height !== other.height) return false;
    // Fast path: check data length mismatch
    if (this.data.length !== other.data.length) return false;
    return this.data.every((val, i) => val === other.data[i]);
  }

  clone(): Grid {
    // Use direct buffer copy to avoid double validation
    return new Grid(this.width, this.height, new Uint8Array(this.data));
  }
}
