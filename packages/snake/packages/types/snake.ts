import { Point } from "./point";

export class Snake {
  // Using Uint8Array for efficient storage like snk
  // Stores pairs of coordinates as [x+2, y+2, x+2, y+2, ...]
  // The +2 offset prevents negative coordinates
  private data: Uint8Array;

  constructor(points: Point[]) {
    if (points.length === 0) {
      throw new Error("Snake must have at least one segment");
    }

    this.data = new Uint8Array(points.length * 2);
    for (let i = 0; i < points.length; i++) {
      this.data[i * 2] = points[i].x + 2;
      this.data[i * 2 + 1] = points[i].y + 2;
    }
  }

  /**
   * Create a snake from a single point (head only)
   */
  static fromPoint(point: Point): Snake {
    return new Snake([point]);
  }

  /**
   * Create a snake with multiple segments at the same position
   */
  static fromSinglePoint(point: Point, length: number): Snake {
    return new Snake(Array.from({ length }, () => point));
  }

  /**
   * Get the head position of the snake
   */
  getHead(): Point {
    return new Point(this.data[0] - 2, this.data[1] - 2);
  }

  /**
   * Get the head X coordinate
   */
  getHeadX(): number {
    return this.data[0] - 2;
  }

  /**
   * Get the head Y coordinate
   */
  getHeadY(): number {
    return this.data[1] - 2;
  }

  /**
   * Get the length of the snake
   */
  getLength(): number {
    return this.data.length / 2;
  }

  /**
   * Create a copy of this snake
   */
  clone(): Snake {
    const points = this.toCells();
    return new Snake(points);
  }

  /**
   * Check if two snakes are equal
   */
  equals(other: Snake): boolean {
    if (this.data.length !== other.data.length) return false;
    for (let i = 0; i < this.data.length; i++) {
      if (this.data[i] !== other.data[i]) return false;
    }
    return true;
  }

  /**
   * Returns a new Snake instance representing the next state after moving the head by (dx, dy).
   *
   * Every segment of the snake is shifted back by one position, and the head is moved by (dx, dy).
   *
   * @param dx - The change in x-coordinate for the head movement.
   * @param dy - The change in y-coordinate for the head movement.
   * @returns A new Snake object with the head moved and the body shifted accordingly.
   */
  nextSnake(dx: number, dy: number): Snake {
    const copy = new Uint8Array(this.data.length);
    // Shift all segments back by one position
    for (let i = 2; i < this.data.length; i++) {
      copy[i] = this.data[i - 2];
    }
    
    // Set new head position
    copy[0] = this.data[0] + dx;
    copy[1] = this.data[1] + dy;

    const snake = Object.create(Snake.prototype);
    snake.data = copy;
    return snake;
  }

  /**
   * Check if the snake will collide with itself when moving
   */
  willSelfCollide(dx: number, dy: number): boolean {
    const newHeadX = this.data[0] + dx;
    const newHeadY = this.data[1] + dy;

    // Check against all body segments except the tail (last segment)
    for (let i = 2; i < this.data.length - 2; i += 2) {
      if (this.data[i] === newHeadX && this.data[i + 1] === newHeadY) {
        return true;
      }
    }

    return false;
  }

  /**
   * Convert snake to array of Points
   */
  toCells(): Point[] {
    const points: Point[] = [];
    for (let i = 0; i < this.data.length; i += 2) {
      points.push(new Point(this.data[i] - 2, this.data[i + 1] - 2));
    }
    return points;
  }

  /**
   * Get the raw data array (for performance-critical operations)
   */
  getRawData(): Uint8Array {
    return this.data;
  }

  /**
   * Get a specific segment of the snake
   */
  getSegment(index: number): Point {
    if (index < 0 || index >= this.getLength()) {
      throw new RangeError(`Segment index ${index} out of range [0, ${this.getLength() - 1}]`);
    }
    return new Point(this.data[index * 2] - 2, this.data[index * 2 + 1] - 2);
  }

  /**
   * Check if the snake contains a specific point
   */
  containsPoint(point: Point): boolean {
    const targetX = point.x + 2;
    const targetY = point.y + 2;

    for (let i = 0; i < this.data.length; i += 2) {
      if (this.data[i] === targetX && this.data[i + 1] === targetY) {
        return true;
      }
    }
    return false;
  }
}
