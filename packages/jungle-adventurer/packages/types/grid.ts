export type Color = (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9) & { _tag: "__Color__" };
export type Empty = 0 & { _tag: "__Empty__" };
export const EMPTY: Empty = 0 as Empty;

export class Grid {
  width: number;
  height: number;
  data: Uint8Array;

  constructor(width: number, height: number, data?: Uint8Array) {
    this.width = width;
    this.height = height;
    this.data = data ? Uint8Array.from(data) : new Uint8Array(width * height);
  }

  static createEmpty(width: number, height: number): Grid {
    return new Grid(width, height);
  }

  isInside(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

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
    // Remove branding for storage
    this.data[this.getIndex(x, y)] = (color as number) || 0;
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
    return this.data.every((_, i) => this.data[i] === other.data[i]);
  }

  clone(): Grid {
    return new Grid(this.width, this.height, this.data);
  }
}
