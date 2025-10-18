import { Grid, Color, EMPTY } from '../types/grid';
import { Point } from '../types/point';
import { Tunnel } from './Tunnel';

/**
 * Solver class for pathfinding and grid solving algorithms.
 * Migrated from snk's solver with OOP design.
 */
export class Solver {
  grid: Grid;

  constructor(grid: Grid) {
    this.grid = grid;
  }

  /**
   * Find a path from start to end using A* pathfinding
   * @param start - Starting point
   * @param end - Target point
   * @returns Array of points representing the path, or null if no path exists
   */
  findPath(start: Point, end: Point): Point[] | null {
    const openList: PathNode[] = [new PathNode(start, null, 0, this.heuristic(start, end))];
    const closedSet = new Set<string>();

    while (openList.length > 0) {
      // Get node with lowest f score
      openList.sort((a, b) => a.f - b.f);
      const current = openList.shift()!;

      // Check if we reached the goal
      if (current.point.x === end.x && current.point.y === end.y) {
        return this.reconstructPath(current);
      }

      const key = this.pointToKey(current.point);
      if (closedSet.has(key)) continue;
      closedSet.add(key);

      // Explore neighbors
      const neighbors = this.getNeighbors(current.point);
      for (const neighbor of neighbors) {
        const neighborKey = this.pointToKey(neighbor);
        if (closedSet.has(neighborKey)) continue;

        const g = current.g + 1;
        const h = this.heuristic(neighbor, end);
        const f = g + h;

        const neighborNode = new PathNode(neighbor, current, g, f);
        openList.push(neighborNode);
      }
    }

    return null; // No path found
  }

  /**
   * Get valid neighboring cells
   */
  private getNeighbors(point: Point): Point[] {
    const neighbors: Point[] = [];
    const directions = [
      { x: 1, y: 0 },   // right
      { x: 0, y: -1 },  // up
      { x: -1, y: 0 },  // left
      { x: 0, y: 1 },   // down
    ];

    for (const dir of directions) {
      const nx = point.x + dir.x;
      const ny = point.y + dir.y;

      if (this.grid.isInside(nx, ny)) {
        const color = this.grid.getColor(nx, ny);
        if (this.grid.isEmptyCell(color)) {
          neighbors.push(new Point(nx, ny));
        }
      }
    }

    return neighbors;
  }

  /**
   * Manhattan distance heuristic
   */
  private heuristic(a: Point, b: Point): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  /**
   * Reconstruct path from goal node to start
   */
  private reconstructPath(node: PathNode): Point[] {
    const path: Point[] = [];
    let current: PathNode | null = node;

    while (current !== null) {
      path.unshift(current.point);
      current = current.parent;
    }

    return path;
  }

  /**
   * Convert point to string key for Set/Map
   */
  private pointToKey(point: Point): string {
    return `${point.x},${point.y}`;
  }

  /**
   * Extract all unique colors from the grid (excluding empty)
   */
  extractColors(): Color[] {
    const colorSet = new Set<number>();

    for (let x = 0; x < this.grid.width; x++) {
      for (let y = 0; y < this.grid.height; y++) {
        const color = this.grid.getColor(x, y);
        if (!this.grid.isEmptyCell(color)) {
          colorSet.add(color as number);
        }
      }
    }

    return Array.from(colorSet)
      .sort((a, b) => a - b)
      .map(c => c as Color);
  }

  /**
   * Clear all cells with a specific color
   */
  clearColor(color: Color): void {
    for (let x = 0; x < this.grid.width; x++) {
      for (let y = 0; y < this.grid.height; y++) {
        const cellColor = this.grid.getColor(x, y);
        if (cellColor === color) {
          this.grid.setColorEmpty(x, y);
        }
      }
    }
  }

  /**
   * Check if a point is outside the grid boundaries
   */
  isOutside(point: Point): boolean {
    return !this.grid.isInside(point.x, point.y);
  }

  /**
   * Clone the solver with a new grid instance
   */
  clone(): Solver {
    return new Solver(this.grid.clone());
  }

  /**
   * Create an "outside" grid marking cells that are accessible from the border
   */
  createOutside(maxColor: Color | typeof EMPTY = EMPTY): Grid {
    const outside = Grid.createEmpty(this.grid.width, this.grid.height);

    // Initialize all cells as "inside" (non-zero)
    for (let x = 0; x < outside.width; x++) {
      for (let y = 0; y < outside.height; y++) {
        outside.setColor(x, y, 1 as Color);
      }
    }

    this.fillOutside(outside, maxColor);
    return outside;
  }

  /**
   * Fill the outside grid, marking accessible cells from borders
   */
  fillOutside(outside: Grid, maxColor: Color | typeof EMPTY = EMPTY): void {
    let changed = true;
    const directions = [
      { x: 1, y: 0 },   // right
      { x: 0, y: -1 },  // up
      { x: -1, y: 0 },  // left
      { x: 0, y: 1 },   // down
    ];

    while (changed) {
      changed = false;
      for (let x = 0; x < outside.width; x++) {
        for (let y = 0; y < outside.height; y++) {
          const gridColor = this.grid.getColor(x, y);
          const outsideColor = outside.getColor(x, y);

          if ((gridColor as number) <= (maxColor as number) &&
              !this.grid.isEmptyCell(outsideColor)) {
            // Check if any neighbor is outside
            const hasOutsideNeighbor = directions.some(dir => {
              const nx = x + dir.x;
              const ny = y + dir.y;
              return this.isOutsideCell(outside, nx, ny);
            });

            if (hasOutsideNeighbor) {
              changed = true;
              outside.setColorEmpty(x, y);
            }
          }
        }
      }
    }
  }

  /**
   * Check if a cell is considered "outside"
   */
  private isOutsideCell(outside: Grid, x: number, y: number): boolean {
    if (!outside.isInside(x, y)) return true;
    const color = outside.getColor(x, y);
    return this.grid.isEmptyCell(color);
  }

  /**
   * Clear a clean colored layer - cells that can be tunneled through
   */
  clearCleanColoredLayer(outside: Grid, color: Color): Point[] {
    const tunnelablePoints = this.getTunnelablePoints(outside, color);
    const path: Point[] = [];

    // Implement simplified version - full implementation would require snake tracking
    // This is a placeholder that shows the structure
    for (const point of tunnelablePoints) {
      if (!this.grid.isEmptyCell(this.grid.getColor(point.x, point.y))) {
        this.grid.setColorEmpty(point.x, point.y);
        path.push(point);
      }
    }

    this.fillOutside(outside, color);
    return path;
  }

  /**
   * Get all cells that can be tunneled through
   */
  private getTunnelablePoints(outside: Grid, color: Color): Point[] {
    const points: Point[] = [];

    for (let x = 0; x < this.grid.width; x++) {
      for (let y = 0; y < this.grid.height; y++) {
        const cellColor = this.grid.getColor(x, y);
        if (!this.grid.isEmptyCell(cellColor) && (cellColor as number) <= (color as number)) {
          // Try to find a tunnel from this point
          const tunnel = Tunnel.findBestTunnel(this.grid, outside, x, y, color);
          if (tunnel && !tunnel.isEmpty()) {
            // Add all points in the tunnel that aren't empty
            for (const point of tunnel.toArray()) {
              if (!this.grid.isEmptyCell(this.grid.getColor(point.x, point.y))) {
                points.push(point);
              }
            }
          }
        }
      }
    }

    return points;
  }

  /**
   * Find the best tunnel from a specific point
   */
  findBestTunnel(outside: Grid, x: number, y: number, maxColor: Color): Tunnel | null {
    return Tunnel.findBestTunnel(this.grid, outside, x, y, maxColor);
  }

  /**
   * Check if a cell can be tunneled through
   */
  private canBeTunneled(outside: Grid, x: number, y: number, maxColor: Color): boolean {
    // Simplified check - cell must not be outside and color must be <= maxColor
    if (this.isOutsideCell(outside, x, y)) return false;

    const cellColor = this.grid.getColor(x, y);
    return !this.grid.isEmptyCell(cellColor) && (cellColor as number) <= (maxColor as number);
  }

  /**
   * Get the best route through the grid clearing all colors
   */
  getBestRoute(): Point[][] {
    const gridCopy = this.grid.clone();
    const solver = new Solver(gridCopy);
    const outside = solver.createOutside();
    const routes: Point[][] = [];

    const colors = solver.extractColors();

    for (const color of colors) {
      const route = solver.clearCleanColoredLayer(outside, color);
      if (route.length > 0) {
        routes.push(route);
      }
    }

    return routes;
  }
}

/**
 * Helper class for A* pathfinding nodes
 */
class PathNode {
  point: Point;
  parent: PathNode | null;
  g: number; // Cost from start
  f: number; // Total cost (g + h)

  constructor(point: Point, parent: PathNode | null, g: number, f: number) {
    this.point = point;
    this.parent = parent;
    this.g = g;
    this.f = f;
  }
}
