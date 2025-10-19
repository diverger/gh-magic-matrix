import { Grid, Color, EMPTY } from "../types/grid";
import { Point } from "../types/point";
import { Snake } from "../types/snake";
import { OutsideGrid } from "./outside-grid";
import { Pathfinder } from "./pathfinder";
import { Tunnel } from "./tunnel";

interface TunnelablePoint {
  x: number;
  y: number;
  tunnel: Tunnel;
  priority: number;
}

export class SnakeSolver {
  private grid: Grid;
  private outside: OutsideGrid;
  private pathfinder: Pathfinder;

  constructor(grid: Grid) {
    this.grid = grid.clone();
    this.outside = new OutsideGrid(this.grid);
    this.pathfinder = new Pathfinder(this.grid);
  }

  /**
   * \brief Compute the optimal route for the snake to clear all colored cells on the grid.
   */
  solve(startSnake: Snake): Snake[] {
    const colors = this.extractColors();
    const chain: Snake[] = [startSnake];

    for (const color of colors) {
      // Phase 1: Clear residual colors (lower than current)
      if ((color as number) > 1) {
        const residualMoves = this.clearResidualColoredLayer(chain[0], color);
        chain.unshift(...residualMoves);
      }

      // Phase 2: Clear current color
      const cleanMoves = this.clearCleanColoredLayer(chain[0], color);
      chain.unshift(...cleanMoves);
    }

    return chain.reverse();
  }

  private clearResidualColoredLayer(snake: Snake, targetColor: Color): Snake[] {
    const snakeLength = snake.getLength();
    let tunnelablePoints = this.getTunnelablePoints(snakeLength, targetColor, true);

    // Sort by priority (highest first)
    tunnelablePoints.sort((a, b) => b.priority - a.priority);

    const chain: Snake[] = [snake];

    while (tunnelablePoints.length > 0) {
      // Get the best tunnel among those with highest priority
      const bestTunnel = this.getNextTunnel(tunnelablePoints, chain[0]);

      // Navigate to tunnel start
      const pathToTunnel = this.pathfinder.findPath(
        chain[0],
        bestTunnel.toArray()[0].x,
        bestTunnel.toArray()[0].y
      );
      if (pathToTunnel) {
        chain.unshift(...pathToTunnel);
      }

      // Navigate through tunnel
      const tunnelMoves = bestTunnel.toSnakeMovements(chain[0]);
      chain.unshift(...tunnelMoves);

      // Update grid by removing consumed cells
      for (const point of bestTunnel.toArray()) {
        this.setEmptySafe(point.x, point.y);
      }

      // Update outside grid
      this.outside.update(this.grid);

      // Update tunnelable points list
      this.updateTunnelablePoints(tunnelablePoints, snakeLength, targetColor);

      // Re-sort by priority
      tunnelablePoints.sort((a, b) => b.priority - a.priority);
    }

    chain.pop(); // Remove initial snake position
    return chain;
  }

  private clearCleanColoredLayer(snake: Snake, targetColor: Color): Snake[] {
    const snakeLength = snake.getLength();
    let tunnelablePoints = this.getTunnelablePointsForColor(snakeLength, targetColor);

    const chain: Snake[] = [snake];

    while (tunnelablePoints.length > 0) {
      // Find closest reachable point using BFS
      const pathToNext = this.findPathToNextPoint(chain[0], targetColor, tunnelablePoints);
      if (!pathToNext) break;

      // Remove the reached point from the list
      const reachedPoint = pathToNext[pathToNext.length - 1].getHead();
      tunnelablePoints = tunnelablePoints.filter(
        (p) => !(p.x === reachedPoint.x && p.y === reachedPoint.y)
      );

      pathToNext.pop(); // Remove final position
      chain.unshift(...pathToNext);

      // Mark consumed cells as empty
      for (const snakeState of pathToNext) {
        const head = snakeState.getHead();
        this.setEmptySafe(head.x, head.y);
      }
    }

    this.outside.update(this.grid);
    chain.pop(); // Remove initial snake position
    return chain;
  }

  private getTunnelablePoints(snakeLength: number, targetColor: Color, isResidual: boolean): TunnelablePoint[] {
    const points: TunnelablePoint[] = [];

    for (let x = 0; x < this.grid.width; x++) {
      for (let y = 0; y < this.grid.height; y++) {
        const color = this.grid.getColor(x, y);
        const colorValue = color as number;
        const targetValue = targetColor as number;

        if (
          !this.grid.isEmptyCell(color) &&
          (isResidual ? colorValue < targetValue : colorValue <= targetValue)
        ) {
          const tunnel = Tunnel.findBestTunnel(
            this.grid,
            this.outside,
            x,
            y,
            targetColor,
            snakeLength
          );

          if (tunnel && !tunnel.isEmpty()) {
            const priority = tunnel.getPriority(this.grid, targetColor);
            const pt = new Point(x, y);
            (pt as any).tunnel = tunnel;
            (pt as any).priority = priority;
            points.push(pt as unknown as TunnelablePoint);
          }
        }
      }
    }

    return points;
  }

  private getTunnelablePointsForColor(snakeLength: number, targetColor: Color): Point[] {
    const points: Point[] = [];

    for (let x = 0; x < this.grid.width; x++) {
      for (let y = 0; y < this.grid.height; y++) {
        const color = this.grid.getColor(x, y);
        if (
          !this.grid.isEmptyCell(color) &&
          (color as number) <= (targetColor as number) &&
          !points.some((p) => p.x === x && p.y === y)
        ) {
          const tunnel = Tunnel.findBestTunnel(
            this.grid,
            this.outside,
            x,
            y,
            targetColor,
            snakeLength
          );

          if (tunnel) {
            for (const point of tunnel.toArray()) {
              if (!this.isEmptySafe(point.x, point.y)) {
                points.push(point);
              }
            }
          }
        }
      }
    }

    return points;
  }

  private getNextTunnel(tunnelablePoints: TunnelablePoint[], snake: Snake): Tunnel {
    let minDistance = Infinity;
    let bestTunnel: Tunnel | null = null;

    const head = snake.getHead();
    const highestPriority = tunnelablePoints[0].priority;

    // Among tunnels with highest priority, pick the closest one
    for (const point of tunnelablePoints) {
      if (point.priority === highestPriority) {
        const tunnelStart = point.tunnel.toArray()[0];
        const distance = (tunnelStart.x - head.x) ** 2 + (tunnelStart.y - head.y) ** 2;

        if (distance < minDistance) {
          minDistance = distance;
          bestTunnel = point.tunnel;
        }
      } else {
        break; // List is sorted, so we've seen all max priority items
      }
    }

    return bestTunnel!;
  }

  private updateTunnelablePoints(
    tunnelablePoints: TunnelablePoint[],
    snakeLength: number,
    targetColor: Color
  ): void {
    for (let i = tunnelablePoints.length - 1; i >= 0; i--) {
      const point = tunnelablePoints[i];

      // Remove if cell is now empty
      if (this.grid.isEmptyCell(this.grid.getColor(point.x, point.y))) {
        tunnelablePoints.splice(i, 1);
        continue;
      }

      // Recalculate tunnel and priority
      const newTunnel = Tunnel.findBestTunnel(
        this.grid,
        this.outside,
        point.x,
        point.y,
        targetColor,
        snakeLength
      );

      if (!newTunnel || newTunnel.isEmpty()) {
        tunnelablePoints.splice(i, 1);
      } else {
        point.tunnel = newTunnel;
        point.priority = newTunnel.getPriority(this.grid, targetColor);
      }
    }
  }

  private findPathToNextPoint(snake: Snake, targetColor: Color, points: Point[]): Snake[] | null {
    interface SearchNode {
      snake: Snake;
      parent: SearchNode | null;
    }

    const closedList: Snake[] = [];
    const openList: SearchNode[] = [{ snake, parent: null }];

    while (openList.length > 0) {
      const current = openList.shift()!;
      const head = current.snake.getHead();

      // Check if we reached any target point
      const reachedPointIndex = points.findIndex((p) => p.x === head.x && p.y === head.y);
      if (reachedPointIndex >= 0) {
        points.splice(reachedPointIndex, 1);
        return this.reconstructSnakePath(current);
      }

      // Try all directions
      for (const direction of [
        { x: 1, y: 0 },
        { x: 0, y: -1 },
        { x: -1, y: 0 },
        { x: 0, y: 1 }
      ]) {
        const newX = head.x + direction.x;
        const newY = head.y + direction.y;

        if (
          this.grid.isInsideLarge(2, newX, newY) &&
          !current.snake.willSelfCollide(direction.x, direction.y) &&
          this.getColorSafe(newX, newY) <= (targetColor as number)
        ) {
          const newSnake = current.snake.nextSnake(direction.x, direction.y);

          if (!closedList.some((s) => s.equals(newSnake))) {
            closedList.push(newSnake);
            openList.push({ snake: newSnake, parent: current });
          }
        }
      }
    }

    return null;
  }

  private reconstructSnakePath(goalNode: { snake: Snake; parent: any | null }): Snake[] {
    const path: Snake[] = [];
    let current = goalNode;

    while (current) {
      path.push(current.snake);
      current = current.parent;
    }

    return path;
  }

  private extractColors(): Color[] {
    const maxColor = Math.max(...Array.from(this.grid.data));
    return Array.from({ length: maxColor }, (_, i) => (i + 1) as Color);
  }

  private getColorSafe(x: number, y: number): number {
    return this.grid.isInside(x, y) ? (this.grid.getColor(x, y) as number) : 0;
  }

  private setEmptySafe(x: number, y: number): void {
    if (this.grid.isInside(x, y)) {
      this.grid.setColorEmpty(x, y);
    }
  }

  private isEmptySafe(x: number, y: number): boolean {
    return !this.grid.isInside(x, y) || this.grid.isEmptyCell(this.grid.getColor(x, y));
  }

  getGrid(): Grid {
    return this.grid;
  }
}
