import { Grid, Color, EMPTY } from '../types/grid';
import { Point } from '../types/point';

/**
 * Tunnel class represents a path through the grid that can be traversed.
 * Migrated from snk's tunnel functionality with OOP design.
 */
export class Tunnel {
  path: Point[];
  grid: Grid;

  constructor(grid: Grid, path: Point[] = []) {
    this.grid = grid;
    this.path = [...path]; // Copy the path
  }

  /**
   * Get the length of the tunnel
   */
  get length(): number {
    return this.path.length;
  }

  /**
   * Check if the tunnel is empty
   */
  isEmpty(): boolean {
    return this.path.length === 0;
  }

  /**
   * Get the start point of the tunnel
   */
  getStart(): Point | null {
    return this.path.length > 0 ? this.path[0] : null;
  }

  /**
   * Get the end point of the tunnel
   */
  getEnd(): Point | null {
    return this.path.length > 0 ? this.path[this.path.length - 1] : null;
  }

  /**
   * Update tunnel by removing empty cells from the start
   */
  trimStart(): void {
    while (this.path.length > 0) {
      const { x, y } = this.path[0];
      if (this.isEmptySafe(x, y)) {
        this.path.shift();
      } else {
        break;
      }
    }
  }

  /**
   * Update tunnel by removing empty cells from the end
   */
  trimEnd(): void {
    while (this.path.length > 0) {
      const i = this.path.length - 1;
      const { x, y } = this.path[i];

      if (this.isEmptySafe(x, y) || this.isDuplicate(i)) {
        this.path.pop();
      } else {
        break;
      }
    }
  }

  /**
   * Check if a point at index i is a duplicate (appears earlier in the path)
   */
  private isDuplicate(index: number): boolean {
    const point = this.path[index];
    return this.path.findIndex(p => p.x === point.x && p.y === point.y) < index;
  }

  /**
   * Trim both start and end
   */
  trim(): void {
    this.trimStart();
    this.trimEnd();
  }

  /**
   * Update tunnel by removing points that match toDelete array
   */
  update(toDelete: Point[]): void {
    // Remove from start
    while (this.path.length > 0) {
      const { x, y } = this.path[0];
      if (this.isEmptySafe(x, y) || this.containsPoint(toDelete, x, y)) {
        this.path.shift();
      } else {
        break;
      }
    }

    // Remove from end
    while (this.path.length > 0) {
      const { x, y } = this.path[this.path.length - 1];
      if (this.isEmptySafe(x, y) || this.containsPoint(toDelete, x, y)) {
        this.path.pop();
      } else {
        break;
      }
    }
  }

  /**
   * Check if a point exists in an array
   */
  private containsPoint(points: Point[], x: number, y: number): boolean {
    return points.some(p => p.x === x && p.y === y);
  }

  /**
   * Check if a cell is empty (or outside the grid)
   */
  private isEmptySafe(x: number, y: number): boolean {
    if (!this.grid.isInside(x, y)) return true;
    const color = this.grid.getColor(x, y);
    return this.grid.isEmptyCell(color);
  }

  /**
   * Calculate the score/priority of this tunnel
   * Higher priority for tunnels with more low-value cells and fewer high-value cells
   */
  getPriority(targetColor: Color): number {
    let nColor = 0;
    let nLess = 0;

    for (let i = 0; i < this.path.length; i++) {
      const { x, y } = this.path[i];

      if (!this.grid.isInside(x, y)) continue;

      const cellColor = this.grid.getColor(x, y);

      if (!this.grid.isEmptyCell(cellColor) && i === this.findFirstIndex(x, y)) {
        if (cellColor === targetColor) {
          nColor += 1;
        } else if ((cellColor as number) < (targetColor as number)) {
          nLess += (targetColor as number) - (cellColor as number);
        }
      }
    }

    if (nColor === 0) return 99999;
    return nLess / nColor;
  }

  /**
   * Find the first index where a point appears in the path
   */
  private findFirstIndex(x: number, y: number): number {
    return this.path.findIndex(p => p.x === x && p.y === y);
  }

  /**
   * Clone this tunnel
   */
  clone(): Tunnel {
    return new Tunnel(this.grid, this.path);
  }

  /**
   * Convert tunnel to array of points
   */
  toArray(): Point[] {
    return [...this.path];
  }

  /**
   * Static method to find the best tunnel from a point to outside the grid
   */
  static findBestTunnel(
    grid: Grid,
    outside: Grid,
    startX: number,
    startY: number,
    maxColor: Color,
    pathLength: number = 3
  ): Tunnel | null {
    // This is a simplified version - full implementation would require
    // more complex pathfinding similar to snk's getBestTunnel

    const tunnel = new Tunnel(grid);
    const visited = new Set<string>();
    const queue: { x: number; y: number; path: Point[]; cost: number }[] = [
      { x: startX, y: startY, path: [new Point(startX, startY)], cost: 0 }
    ];

    const directions = [
      { x: 1, y: 0 },
      { x: 0, y: -1 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
    ];

    while (queue.length > 0) {
      queue.sort((a, b) => a.cost - b.cost);
      const current = queue.shift()!;

      // Check if we reached outside
      if (!outside.isInside(current.x, current.y) ||
          outside.isEmptyCell(outside.getColor(current.x, current.y))) {
        tunnel.path = current.path;
        tunnel.trim();
        return tunnel;
      }

      const key = `${current.x},${current.y}`;
      if (visited.has(key)) continue;
      visited.add(key);

      // Explore neighbors
      for (const dir of directions) {
        const nx = current.x + dir.x;
        const ny = current.y + dir.y;

        if (grid.isInside(nx, ny)) {
          const cellColor = grid.getColor(nx, ny);
          const colorValue = cellColor as number;
          const maxColorValue = maxColor as number;

          if (colorValue <= maxColorValue) {
            const newPath = [...current.path, new Point(nx, ny)];
            const cost = current.cost + 1 + (cellColor === maxColor ? 1000 : 0);
            queue.push({ x: nx, y: ny, path: newPath, cost });
          }
        }
      }
    }

    return null;
  }
}
