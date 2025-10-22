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
   * Computes the optimal route for the snake to clear all colored cells on the grid.
   *
   * @remarks
   * The solver iterates over color levels from 1..N. For each color it performs two phases:
   * 1. Residual clearing to remove cells with color lower than the current target using prioritized tunnels.
   * 2. Clean color clearing to remove cells equal to the current color using a nearest-first strategy.
   * The method constructs an array of Snake states (movement history) by prepending moves as they are discovered;
   * callers typically reverse the returned array to obtain chronological order.
   *
   * Edge cases handled include empty grids (returns the start snake) and unreachable cells which are skipped when the pathfinder cannot reach them.
   *
   * Note: The solver clones the provided grid during construction; the caller's grid is not modified.
   *
   * @param startSnake - The initial Snake instance (position and length) used as starting state.
   * @returns Array of Snake states representing the computed route (from oldest to newest).
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

  /**
   * Clears residual colored cells using prioritized tunnels.
   *
   * @remarks
   * Builds a list of candidate tunnel entry points and ranks them by a priority score (see Tunnel.getPriority).
   * Repeatedly picks the highest-priority tunnel, navigates to its start, traverses it (consuming cells), updates the internal grid copy,
   * updates the `outside` helper, and re-evaluates remaining candidates. Tunnel candidates are re-scored after each mutation to the grid
   * and invalid tunnels are removed. May perform per-cell tunnel discovery and rescoring; runtime depends on grid area and tunnel finding cost.
   *
   * Note: The solver works on an internal clone of the grid and mutates that copy by marking consumed cells empty via `setEmptySafe`.
   * Note: The `outside` helper is updated after each tunnel traversal and tunnel priorities are recalculated after grid modifications.
   *
   * @param snake - Starting Snake state used for pathfinding and collision checks.
   * @param targetColor - The color level being targeted; only cells with color < targetColor are considered for residual clearing.
   * @returns Sequence of snake states representing the performed movements (from newest to oldest).
   */
  private clearResidualColoredLayer(snake: Snake, targetColor: Color): Snake[] {
    const snakeLength = snake.getLength();

    //! Get the best tunnel for each cell in the grid (if there is one)
    let tunnelablePoints = this.getTunnelablePoints(snakeLength, targetColor, true);

    //! Sort by priority (highest first)
    // The best tunnel at first
    tunnelablePoints.sort((a, b) => b.priority - a.priority);

    const chain: Snake[] = [snake];

    while (tunnelablePoints.length > 0) {
      //! Get the best tunnel among those with highest priority
      const bestTunnel = this.getNextTunnel(tunnelablePoints, chain[0]);

      //! Navigate to tunnel start using A* algorithm, note that 'findPath' doesn't consider color rules, cell consumption
      //! or game objectives, it just find a valid (usually shortest or lowest-cost) path for the snake to reach the given
      //! position.
      const pathToTunnel = this.pathfinder.findPath(
        chain[0],
        bestTunnel.toArray()[0].x,
        bestTunnel.toArray()[0].y
      );

      //! This actually append the snake to the path to tunnel, so use 'chain'
      if (pathToTunnel) {
        chain.unshift(...pathToTunnel);
      }

      // Navigate through tunnel
      const tunnelMoves = bestTunnel.getTunnelPath(chain[0]);

      //! This will prepend the tunnel moves to the chain
      chain.unshift(...tunnelMoves);

      //! After above steps, the chain is like this: [tunnelMoves, pathToTunnel, snake].
      //! This is because the snake head is at index 0.

      // Update grid by removing consumed cells
      for (const point of bestTunnel.toArray()) {
        this.setEmptySafe(point.x, point.y);
      }

      // Update outside grid
      this.outside.update(this.grid);

      // Update tunnelable points list
      this.updateTunnelablePoints(tunnelablePoints, snakeLength, targetColor);

      //! Re-sort by priority
      // The sort function sort((a, b) => b.priority - a.priority) orders the array in descending order of priority.
      // That means elements with higher priority values will come first in the array, and elements with lower priority
      // values will come later.
      tunnelablePoints.sort((a, b) => b.priority - a.priority);
    }

    //! Remove initial snake position which is at the tail of the chain
    chain.pop();
    return chain;
  }

  /**
   * Clears all cells of the target color using a nearest-first strategy.
   *
   * @remarks
   * This method is used in the "clean" phase for each color. It repeatedly finds the closest reachable cell of the target color
   * (using BFS), moves the snake to that cell, and marks it as empty. The process continues until no more reachable cells remain.
   * Unlike the residual phase, this phase does not use tunnel priorities; it simply visits all cells of the current color in order of proximity.
   *
   * The method mutates the internal grid by marking visited cells as empty and updates the `outside` helper at the end.
   * The returned array contains the sequence of snake states (from newest to oldest) representing the performed movements.
   *
   * @param snake - The starting Snake state for this phase.
   * @param targetColor - The color value to clear (cells with color <= targetColor are considered).
   * @returns Sequence of snake states representing the performed movements (from newest to oldest).
   */
  private clearCleanColoredLayer(snake: Snake, targetColor: Color): Snake[] {
    const snakeLength = snake.getLength();
    let tunnelablePoints = this.getTunnelablePointsForColor(snakeLength, targetColor);

    const chain: Snake[] = [snake];

    while (tunnelablePoints.length > 0) {
      //! Find closest reachable point using BFS
      //! Here we use BFS to find the shortest path to any of the remaining tunnelable points (any next point may be a
      //! best candidate), not like that in residual clearing which uses prioritized tunnels (the residual color has
      //! higher priority than the clean color) and need find a shortest path to the given point.
      const pathToNext = this.findPathToNextPoint(chain[0], targetColor, tunnelablePoints);
      if (!pathToNext) break;

      // Note: findPathToNextPoint already removed the reached point from tunnelablePoints via splice

      pathToNext.pop(); // Remove start position (at end of newest→oldest array)

      // Mark consumed cells as empty BEFORE adding to chain (matches SNK order)
      for (const snakeState of pathToNext) {
        const head = snakeState.getHead();
        this.setEmptySafe(head.x, head.y);
      }

      chain.unshift(...pathToNext);
    }

    this.outside.update(this.grid);

    //! Remove initial snake position which is at the tail of the chain
    chain.pop();
    return chain;
  }

  /**
   * Discovers tunnelable points for the given target color.
   *
   * @remarks
   * For each grid cell that satisfies the eligibility test (based on
   * `isResidual` and `targetColor`), the function attempts to construct a validated Tunnel by simulating escape and return paths
   * (Tunnel.findBestTunnel). Each successful tunnel is wrapped into a TunnelablePoint with a computed priority value. The returned
   * list is unsorted; consumers typically sort by priority before selecting tunnels to process.
   *
   * Note: The function reads the internal grid but does not mutate it. Tunnel generation may be expensive (per-cell pathfinding/simulation).
   * Note: The returned Tunnel objects may be invalidated by subsequent grid mutations; consumers should revalidate via `updateTunnelablePoints`.
   *
   * @param snakeLength - Length of the snake used for tunnel validation/simulation.
   * @param targetColor - The color threshold used to decide which cells are eligible.
   * @param isResidual - When true, only cells with color < targetColor are considered; otherwise cells with color <= targetColor are allowed.
   * @returns An array of TunnelablePoint objects (each extends Point) containing `tunnel` and `priority` metadata.
   */
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

  /**
   * Discovers all reachable points for the given target color, using tunnel validation.
   *
   * @remarks
   * Differs from {@link getTunnelablePoints}:
   * - Returns only Point[] (no tunnel/priority metadata)
   * - Always uses color <= targetColor (no residual/clean distinction)
   * - Used for clean clearing, not residual clearing
   *
   * @param snakeLength - The length of the snake used for tunnel validation.
   * @param targetColor - The color value to target (cells with color <= targetColor are considered).
   * @returns An array of Points representing all reachable cells for the given color, each validated by tunnel logic.
   */
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

  /**
   * Selects the best tunnel from a list of candidates based on priority and proximity to the snake's head.
   *
   * @remarks
   * Among tunnels with the highest priority, this method chooses the one whose starting point is closest to the snake's head
   * (using squared Euclidean distance). The input list must be sorted by priority in descending order. If multiple tunnels share
   * the highest priority, the closest one is selected. This is used during residual clearing to optimize tunnel traversal order.
   *
   * @param tunnelablePoints - Array of TunnelablePoint objects, sorted by priority (highest first).
   * @param snake - The current Snake instance, used to determine proximity.
   * @returns The selected tunnel with highest priority and minimal distance to the snake's head.
   */
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

  /**
   * Updates the list of tunnelable points by removing invalid or empty cells and recalculating tunnels and priorities.
   *
   * @param tunnelablePoints - The array of TunnelablePoint objects to update in-place.
   * @param snakeLength - The current length of the snake, used for tunnel validation.
   * @param targetColor - The color threshold for tunnel eligibility and scoring.
   */
  private updateTunnelablePoints(
    tunnelablePoints: TunnelablePoint[],
    snakeLength: number,
    targetColor: Color
  ): void {
    for (let i = tunnelablePoints.length - 1; i >= 0; i--) {
      const point = tunnelablePoints[i];

      // Remove if cell is now empty
      if (this.grid.isEmptyCell(this.grid.getColor(point.x, point.y))) {
        //! Remove the empty cell at index i from tunnelablePoints
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

  /**
   * Finds the shortest path from the current snake state to any of a set of target points.
   *
   * @remarks
   * This method performs a breadth-first search (BFS) over all possible snake states, searching for the shortest path
   * to any of the provided target points (cells of the target color). It is optimized for the clean phase, where the goal
   * is to reach the nearest cell among many candidates. The search stops as soon as any target is reached, returning the
   * sequence of snake states representing the path. If no target is reachable, it returns null.
   *
   * @param snake - The starting Snake state.
   * @param targetColor - The color value being targeted (used for movement constraints).
   * @param points - The array of target Points to reach (any of which is a valid goal).
   * @returns The sequence of Snake states from start to the reached target (oldest to newest), or null if unreachable.
   */
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

  /**
   * Reconstructs the path of snake states from a goal node back to the start node.
   *
   * @remarks
   * This method is used after a search (such as BFS) to recover the sequence of snake states that led to a target.
   * It follows parent links from the goal node back to the root, collecting each snake state in order. The returned
   * array contains the path from the goal to the start (newest to oldest); callers may reverse it for chronological order.
   *
   * @param goalNode - The final search node containing the target snake state and parent links.
   * @returns An array of Snake states representing the reconstructed path from goal to start.
   */
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
