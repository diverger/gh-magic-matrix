import { Grid, Color, EMPTY } from "../types/grid";
import { Point, neighbors4 } from "../types/point";
import { Snake } from "../types/snake";
import { OutsideGrid } from "./OutsideGrid";

//! Note:
// Path refers to a sequence of points (cells) that the snake will traverse. It is a general term for any route or movement,
// such as the result of A* pathfinding, or the steps needed to reach a target cell. Paths can be short (single move), long
// (full clearing), or even disconnected.

// Tunnel is a special kind of path. It represents a round-trip route that the snake can safely traverse to consume cells
// and then return to a safe area (usually the grid boundary or an "outside" cell). Tunnels are validated to ensure the
// snake can both enter and exit without getting stuck, and are used for two-phase clearing strategies (residual color
// clearing and clean color clearing).

//! Because the snake can't traverse 'backward', so a safe path (not dead) must be a round trip path -- 'route'

// Summary:

// path: Any sequence of points for snake movement (generic, may not be safe for round-trip).
// tunnel: A validated, round-trip path that guarantees the snake can enter, consume, and exit safely (used for optimal clearing).
// Tunnels are a subset of paths, with additional safety and round-trip guarantees.

// There may be 'dead path', but won't be 'dead route'.

export class Tunnel {
  // A tunnel is a special path formed with a series of points
  private path: Point[];

  constructor(path: Point[] = []) {
    this.path = [...path];
  }

  /**
   * Get the tunnel path as array of points
   */
  toArray(): Point[] {
    return [...this.path];
  }

  /**
   * Check if tunnel is empty
   */
  isEmpty(): boolean {
    return this.path.length === 0;
  }

  /**
   * Get tunnel length
   */
  getLength(): number {
    return this.path.length;
  }

  /**
   * Trim empty cells from the start of tunnel
   */
  trimStart(grid: Grid): void {
    while (this.path.length > 0) {
      const point = this.path[0];
      if (this.isEmptySafe(grid, point.x, point.y)) {
        this.path.shift();
      } else {
        break;
      }
    }
  }

  /**
   * Trim empty cells from the end of tunnel
   */
  trimEnd(grid: Grid): void {
    while (this.path.length > 0) {
      const lastIndex = this.path.length - 1;
      const point = this.path[lastIndex];
      if (
        this.isEmptySafe(grid, point.x, point.y) ||
        this.path.findIndex((p) => p.x === point.x && p.y === point.y) < lastIndex
      ) {
        this.path.pop();
      } else {
        break;
      }
    }
  }

  /**
   * Trim both ends
   */
  trim(grid: Grid): void {
    this.trimStart(grid);
    this.trimEnd(grid);
  }

  /**
   * Update tunnel by removing consumed points
   */
  update(grid: Grid, toDelete: Point[]): void {
    // Remove consumed points from start
    while (this.path.length > 0) {
      const point = this.path[0];
      if (
        this.isEmptySafe(grid, point.x, point.y) ||
        toDelete.some((p) => p.x === point.x && p.y === point.y)
      ) {
        this.path.shift();
      } else {
        break;
      }
    }

    // Remove consumed points from end
    while (this.path.length > 0) {
      const point = this.path[this.path.length - 1];
      if (
        this.isEmptySafe(grid, point.x, point.y) ||
        toDelete.some((p) => p.x === point.x && p.y === point.y)
      ) {
        this.path.pop();
      } else {
        break;
      }
    }
  }

  /**
   * Calculate priority score for this tunnel
   */
  getPriority(grid: Grid, targetColor: Color): number {
    let colorCount = 0;
    let lowerColorWeight = 0;

    for (let i = 0; i < this.path.length; i++) {
      const point = this.path[i];
      const color = Tunnel.getColorSafe(grid, point.x, point.y);

      // Only count unique cells (first occurrence)
      if (
        !grid.isEmptyCell(color) &&
        i === this.path.findIndex((p) => p.x === point.x && p.y === point.y)
      ) {
        if ((color as number) === (targetColor as number)) {
          colorCount += 1;
        } else {
          lowerColorWeight += (targetColor as number) - (color as number);
        }
      }
    }

    if (colorCount === 0) return 99999; // Infinite priority for pure lower-color tunnels
    return lowerColorWeight / colorCount; // Favor tunnels with higher lower/current ratio
  }

  /**
   * Clone this tunnel
   */
  clone(): Tunnel {
    return new Tunnel(this.path);
  }

  /**
   * Convert tunnel to snake movement sequence
   */
  toSnakeMovements(startSnake: Snake): Snake[] {
    const movements: Snake[] = [];
    let currentSnake = startSnake;

    for (let i = 1; i < this.path.length; i++) {
      const currentHead = currentSnake.getHead();
      const target = this.path[i];
      const dx = target.x - currentHead.x;
      const dy = target.y - currentHead.y;

      currentSnake = currentSnake.nextSnake(dx, dy);
      movements.unshift(currentSnake);
    }

    return movements;
  }

  /**
   * Get the sequence of snake to cross the tunnel
   */
  getTunnelPath(snake0: Snake): Snake[] {
    const chain: Snake[] = [];
    let snake = snake0;

    for (let i = 1; i < this.path.length; i++) {
      const head = snake.getHead();
      const dx = this.path[i].x - head.x;
      const dy = this.path[i].y - head.y;
      snake = snake.nextSnake(dx, dy);
      chain.unshift(snake);
    }

    return chain;
  }

  /**
   * Update tunnel assuming grid changed and colors got deleted
   */
  updateTunnel(grid: Grid, toDelete: Point[]): void {
    while (this.path.length > 0) {
      const point = this.path[0];
      if (
        this.isEmptySafe(grid, point.x, point.y) ||
        toDelete.some((p) => p.x === point.x && p.y === point.y)
      ) {
        this.path.shift();
      } else {
        break;
      }
    }

    while (this.path.length > 0) {
      const point = this.path[this.path.length - 1];
      if (
        this.isEmptySafe(grid, point.x, point.y) ||
        toDelete.some((p) => p.x === point.x && p.y === point.y)
      ) {
        this.path.pop();
      } else {
        break;
      }
    }
  }

  /**
   * Remove empty cells from start
   */
  trimTunnelStart(grid: Grid): void {
    while (this.path.length > 0) {
      const point = this.path[0];
      if (this.isEmptySafe(grid, point.x, point.y)) {
        this.path.shift();
      } else {
        break;
      }
    }
  }

  /**
   * Remove empty cells from end
   */
  trimTunnelEnd(grid: Grid): void {
    while (this.path.length > 0) {
      const i = this.path.length - 1;
      const point = this.path[i];
      if (
        this.isEmptySafe(grid, point.x, point.y) ||
        this.path.findIndex((p) => p.x === point.x && p.y === point.y) < i
      ) {
        this.path.pop();
      } else {
        break;
      }
    }
  }

  /**
   * Find the best tunnel from a specific cell to outside
   *
   * \brief Creates a validated round-trip tunnel from a start position to the outside grid
   * \param grid The game grid containing colors and empty cells
   * \param outsideGrid Helper class that defines the "outside" boundary areas
   * \param startX X coordinate of the starting position
   * \param startY Y coordinate of the starting position
   * \param maxColor Maximum allowed color value for pathfinding (higher colors are blocked)
   * \param snakeLength Length of the snake (affects collision detection and positioning)
   * \return A valid Tunnel object if a round-trip path exists, null otherwise
   *
   * \details This method performs a two-phase tunnel construction:
   *          Phase 1: Find escape path from start to outside boundary
   *          Phase 2: Simulate consumption and find return path to outside
   *          The resulting tunnel is trimmed to remove empty cells at both ends
   */
  static findBestTunnel(
    grid: Grid,
    outsideGrid: OutsideGrid,
    startX: number,
    startY: number,
    maxColor: Color,
    snakeLength: number
  ): Tunnel | null {
    const startPoint = new Point(startX, startY);
    const snake = Snake.fromSinglePoint(startPoint, snakeLength);

    // Phase 1: Find path from start to outside
    const pathToOutside = this.findEscapePath(grid, outsideGrid, snake, maxColor);
    if (!pathToOutside) return null;

    // Phase 2: Simulate consumption and find return path
    const gridAfterConsumption = grid.clone();
    for (const point of pathToOutside) {
      this.setEmptySafe(gridAfterConsumption, point.x, point.y);
    }

    // Create snake at target position with correct length, the head at the end of the path found
    const snakeAtTarget = this.createSnakeAtPosition(pathToOutside, snakeLength);

    //! In phase 1, we actually only find the escape path for the snake head. We simulate that when the snake head have
    //! reached the outside of the grid, if we still can find a escape path
    const pathFromTarget = this.findEscapePath(gridAfterConsumption, outsideGrid, snakeAtTarget, maxColor);
    if (!pathFromTarget) return null;

    // Combine paths
    const completePath = [...pathToOutside.slice().reverse(), ...pathFromTarget];
    const tunnel = new Tunnel(completePath);
    tunnel.trim(grid);

    return tunnel;
  }

  /**
   * \brief Find an escape path for the snake's head to the outside boundary using BFS.
   *
   * This function searches for a path from the current snake position to any cell considered "outside"
   * the grid, using a breadth-first search (BFS) algorithm with a cost function. The search only considers
   * valid moves (no self-collision, color constraints) and returns the shortest path found for the snake's head.
   *
   * \param grid The game grid containing colors and empty cells
   * \param outsideGrid Helper class that defines the "outside" boundary areas
   * \param snake The current snake instance (position and body)
   * \param maxColor Maximum allowed color value for traversable cells
   * \return An array of Points representing the head positions along the escape path, or null if no path exists
   * \note This function actually only finds a escape path for the snake's head!
   */
  private static findEscapePath(
    grid: Grid,
    outsideGrid: OutsideGrid,
    snake: Snake,
    maxColor: Color
  ): Point[] | null {
    interface SearchNode {
      snake: Snake;
      parent: SearchNode | null;
      cost: number;
    }

    const openList: SearchNode[] = [{ snake, parent: null, cost: 0 }];
    const closedList: Snake[] = [];

    while (openList.length > 0) {
      const current = openList.shift()!;
      const head = current.snake.getHead();

      // Check if we reached outside
      //! For BFS, the first one will be the shortest one
      if (outsideGrid.isOutside(head.x, head.y)) {
        return this.reconstructPath(current);
      }

      // Try all directions
      for (const direction of neighbors4) {
        const newX = head.x + direction.x;
        const newY = head.y + direction.y;
        const cellColor = Tunnel.getColorSafe(grid, newX, newY);

        if (
          (cellColor as number) <= (maxColor as number) &&
          !current.snake.willSelfCollide(direction.x, direction.y)
        ) {
          const newSnake = current.snake.nextSnake(direction.x, direction.y);

          //! Here the closedList avoids duplicate snake positions (body positions), that means the same cell can be
          //! 'visited' multiple times
          if (!closedList.some((s) => s.equals(newSnake))) {
            //! Higher cost for target color cells to discourage their use, only when cell color equal to maxColor, it
            //! will have a much higher cost
            const moveCost = (cellColor as number) === (maxColor as number) ? 1000 : 1;
            const cost = current.cost + 1 + moveCost;

            //! This makes sure the one with lowest cost will be chosen first
            this.sortedInsert(openList, { snake: newSnake, parent: current, cost });
            closedList.push(newSnake);
          }
        }
      }
    }

    return null;
  }

  /**
   * Reconstruct path from search node
   */
  private static reconstructPath(goalNode: { snake: Snake; parent: any | null }): Point[] {
    const path: Point[] = [];
    let current = goalNode;

    //! Draw the path with only the snake head, the last is pushed first, that is the end of path is stored first
    while (current) {
      path.push(current.snake.getHead());
      current = current.parent;
    }

    return path;
  }

  /**
   * \brief Create a snake at a specific position with a given length
   *
   * This function constructs a snake whose body follows the given path.
   * The path is an array of positions (from earliest to latest), where the first element
   * becomes the tail and the last element becomes the head. If the path is shorter than
   * the required snake length, the last position is repeated to pad the body.
   *
   * \param path Array of positions representing the movement history (tail to head)
   * \param length Desired length of the snake
   * \return A Snake instance with its body constructed from the path
   */
  private static createSnakeAtPosition(path: Point[], length: number): Snake {
    const cells = path.slice(0, length);

    //! The path length may shorter than the required length of a snake, we padding it repeatedly with the last element
    //!  of the path. Visually it's a 'short' snake without tail
    while (cells.length < length) {
      cells.push(cells[cells.length - 1]);
    }
    return new Snake(cells);
  }

  /**
   * Insert node in sorted order by cost
   */
  private static sortedInsert(list: any[], node: any): void {
    let insertIndex = 0;
    while (insertIndex < list.length && node.cost >= list[insertIndex].cost) {
      insertIndex++;
    }
    list.splice(insertIndex, 0, node);
  }

  /**
   * Safe color getter
   */
  private static getColorSafe(grid: Grid, x: number, y: number): Color | typeof EMPTY {
    return grid.isInside(x, y) ? grid.getColor(x, y) : EMPTY;
  }

  /**
   * Safe empty checker
   */
  private isEmptySafe(grid: Grid, x: number, y: number): boolean {
    return !grid.isInside(x, y) || grid.isEmptyCell(grid.getColor(x, y));
  }

  /**
   * Safe empty setter
   */
  private static setEmptySafe(grid: Grid, x: number, y: number): void {
    if (grid.isInside(x, y)) {
      grid.setColorEmpty(x, y);
    }
  }
}
