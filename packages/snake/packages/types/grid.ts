export type Color = (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9) & { _tag: "__Color__" };
export type Empty = 0 & { _tag: "__Empty__" };
export const EMPTY: Empty = 0 as Empty;

export class Grid {

  width: number;
  height: number;
  data: Uint8Array;

  /**
   * Default random function for randomlyFill
   */
  static defaultRand(a: number, b: number): number {
    if (b < a) {
      throw new RangeError(`Invalid range: b (${b}) < a (${a}) in Grid.defaultRand.`);
    }
    return Math.floor(Math.random() * (b - a + 1)) + a;
  }

  /**
   * Fills the grid with random colors and empty cells.
   * @param options - { colors?: Color[]; emptyP?: number }
   * @param rand - Optional random function
   */
  randomlyFill(options?: { colors?: Color[]; emptyP?: number }, rand?: (a: number, b: number) => number) {
    const { colors = [1, 2, 3] as Color[], emptyP = 2 } = options || {};
    const randomFn = rand || Grid.defaultRand;
    for (let x = this.width; x--; )
      for (let y = this.height; y--; ) {
        const k = randomFn(-emptyP, colors.length - 1);
        if (k >= 0) this.setColor(x, y, colors[k]);
        else this.setColorEmpty(x, y);
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
    if (!Number.isFinite(n) || n < 0 || n > 9) {
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
    if (this.width !== other.width || this.height !== other.height) return false;
    return this.data.every((val, i) => val === other.data[i]);
  }

  clone(): Grid {
    return new Grid(this.width, this.height, this.data);
  }
}
