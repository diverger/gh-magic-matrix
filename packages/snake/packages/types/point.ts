
//! Note that it assumes the top left is (0,0), so the coord is counter-clockwise rotating
export const neighbors4  = [
  { x: 1, y: 0 },   // right
  { x: 0, y: -1 },  // up
  { x: -1, y: 0 },  // left
  { x: 0, y: 1 },   // down
] as const;

export class Point {
  readonly x: number;
  readonly y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  equals(other: Point): boolean {
    return this.x === other.x && this.y === other.y;
  }

  add(other: Point): Point {
    return new Point(this.x + other.x, this.y + other.y);
  }

  distanceTo(other: Point): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  clone(): Point {
    return new Point(this.x, this.y);
  }
}
