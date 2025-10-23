import { Grid, Color, EMPTY } from "../types/grid";
import { Point, neighbors4 } from "../types/point";
import { Snake } from "../types/snake";

export class PathNode {
  snake: Snake;
  parent: PathNode | null;
  cost: number;
  heuristic: number;
  totalCost: number;

  constructor(snake: Snake, parent: PathNode | null = null, cost: number = 0, heuristic: number = 0) {
    this.snake = snake;
    this.parent = parent;
    this.cost = cost;
    this.heuristic = heuristic;
    this.totalCost = cost + heuristic;
  }
}

export class Pathfinder {
  private grid: Grid;
  private currentMaxColor: Color | typeof EMPTY = EMPTY;

  /**
   * Constructs a new Pathfinder instance for the given grid.
   *
   * @param grid - The grid to use for pathfinding operations
   */
  constructor(grid: Grid) {
    this.grid = grid;
  }

  /**
   * Finds a path for the snake from its current position to the target coordinates using the A* algorithm.
   *
   * @remarks
   * Performs A* search to compute a sequence of snake states that move the snake from its current position
   * to the specified (targetX, targetY) cell. Considers grid boundaries, self-collision, and cell validity.
   * The path is reconstructed from the goal node back to the start. Returns null if no path is found.
   * Used for tunnel entry navigation and general movement planning.
   *
   * Implementation enhancement over SNK's getPathTo:
   * - Added `maxColor` parameter to support traversing colored cells during residual clearing phase
   * - When maxColor > EMPTY (0), the pathfinder can traverse cells with color ≤ maxColor
   * - SNK's original getPathTo only allows traversing empty cells (equivalent to maxColor = EMPTY)
   * - This enhancement enables residual phase to navigate through previous color remnants
   *
   * **Path Ordering**: Returns array ordered newest→oldest [goal, ..., start], INCLUDING start state.
   * Consumers must call `pop()` to remove start before `unshift()` to prepend to existing paths.
   *
   * @param snake - The starting Snake instance (position and body)
   * @param targetX - The x-coordinate of the target cell
   * @param targetY - The y-coordinate of the target cell
   * @param maxColor - Maximum color value to traverse (cells with color ≤ maxColor are valid). Defaults to EMPTY (0)
   * @returns Array of Snake states representing the path, or null if unreachable
   */
  findPath(snake: Snake, targetX: number, targetY: number, maxColor: Color | typeof EMPTY = EMPTY): Snake[] | null {
    this.currentMaxColor = maxColor;
    const openList: PathNode[] = [new PathNode(snake)];
    const closedList: Snake[] = [];

    while (openList.length > 0) {
      // Get node with lowest f-cost
      const current = openList.shift()!;
      const currentHead = current.snake.getHead();

      // Mark as visited when expanded (not when generated)
      closedList.push(current.snake);

      // Check if we reached the target
      if (currentHead.x === targetX && currentHead.y === targetY) {
        const path = this.reconstructPath(current);

        // Debug: check path continuity
        for (let i = 0; i < path.length - 1; i++) {
          const curr = path[i].getHead();
          const next = path[i + 1].getHead();
          const dist = Math.abs(curr.x - next.x) + Math.abs(curr.y - next.y);
          if (dist !== 1) {
            console.error(`pathfinder.findPath returned discontinuous path at ${i}: (${curr.x},${curr.y}) -> (${next.x},${next.y}), dist=${dist}`);
          }
        }

        return path;
      }

      // Try all four directions
      for (const direction of neighbors4) {
        const newX = currentHead.x + direction.x;
        const newY = currentHead.y + direction.y;

        // Check bounds and collision
        if (
          this.grid.isInsideLarge(2, newX, newY) &&
          !current.snake.willSelfCollide(direction.x, direction.y) &&
          this.isValidMove(newX, newY)
        ) {
          const newSnake = current.snake.nextSnake(direction.x, direction.y);

          // Skip if already in closed list
          if (closedList.some((s) => s.equals(newSnake))) {
            continue;
          }

          const cost = current.cost + 1;
          const heuristic = Math.abs(newX - targetX) + Math.abs(newY - targetY);
          const newNode = new PathNode(newSnake, current, cost, heuristic);

          // Insert in sorted order by f-cost
          this.sortedInsert(openList, newNode);
        }
      }
    }

    return null; // No path found
  }

  /**
   * Finds a path for the snake to match a specific target pose.
   *
   * @remarks
   * Computes a sequence of snake states that move the snake from its current position and body configuration
   * to match the targetSnake pose. Uses a bounding box for search optimization and avoids forbidden cells
   * (target snake's body segments). Returns null if no path is found. Used for advanced movement planning and pose matching.
   *
   * **Path Ordering**: Returns array ordered oldest→newest (chronological order).
   *
   * @param snake - The starting Snake instance (position and body)
   * @param targetSnake - The target Snake pose to match
   * @param grid - Optional grid for additional movement validation
   * @returns Array of Snake states representing the path to the target pose, or null if unreachable
   */
  findPathToPose(snake: Snake, targetSnake: Snake, grid?: Grid): Snake[] | null {
    if (snake.equals(targetSnake)) {
      return [];
    }

    const targetCells = targetSnake.toCells().reverse();
    const snakeLength = snake.getLength();
    const targetTail = targetCells[0];

    // Create bounding box for search optimization
    const box = {
      minX: Math.min(snake.getHeadX(), targetTail.x) - snakeLength - 1,
      minY: Math.min(snake.getHeadY(), targetTail.y) - snakeLength - 1,
      maxX: Math.max(snake.getHeadX(), targetTail.x) + snakeLength + 1,
      maxY: Math.max(snake.getHeadY(), targetTail.y) + snakeLength + 1,
    };

    // Forbidden cells are the target snake's body (excluding tail)
    const forbidden = targetCells.slice(1, 4); // Next few segments after tail to avoid

    const openList: PathNode[] = [new PathNode(snake)];
    const closedList: Snake[] = [];

    while (openList.length > 0) {
      const current = openList.shift()!;
      const currentHead = current.snake.getHead();

      // Mark as visited when expanded (not when generated)
      closedList.push(current.snake);

      // Check if we reached the target tail position
      if (currentHead.x === targetTail.x && currentHead.y === targetTail.y) {
        const path: Snake[] = [];
        let current_node: PathNode | null = current;
        while (current_node) {
          path.push(current_node.snake);
          current_node = current_node.parent;
        }
        path.unshift(...this.getTunnelPath(path[0], targetCells));
        path.pop();
        path.reverse();
        return path;
      }

      // Try all four directions
      for (const direction of neighbors4) {
        const newX = currentHead.x + direction.x;
        const newY = currentHead.y + direction.y;

        // Check bounds, collision, and forbidden cells
        if (
          !current.snake.willSelfCollide(direction.x, direction.y) &&
          (!grid || this.isEmptySafe(grid, newX, newY)) &&
          (grid
            ? grid.isInsideLarge(2, newX, newY)
            : this.isValidMoveForPose(newX, newY, box)) &&
          !forbidden.some((p) => p.x === newX && p.y === newY)
        ) {
          const newSnake = current.snake.nextSnake(direction.x, direction.y);

          if (closedList.some((s) => s.equals(newSnake))) {
            continue;
          }

          const cost = current.cost + 1;
          const heuristic = Math.abs(newX - targetTail.x) + Math.abs(newY - targetTail.y);
          const newNode = new PathNode(newSnake, current, cost, heuristic);

          this.sortedInsert(openList, newNode);
        }
      }
    }

    return null;
  }

  /**
   * Generates the tunnel path to match the full target pose.
   *
   * @remarks
   * Based on the original implementation from snk/packages/solver/tunnel.ts
   *
   * After pathfinding to the target tail position, this method generates the sequence
   * of moves needed to "tunnel" through the body segments to reach the target head position,
   * which naturally shapes the snake body to match the target pose.
   *
   * @param snake - The current Snake state at the target tail position
   * @param targetCells - The target pose as an array of Points in reverse order (tail first)
   * @returns Array of Snake states representing the tunnel path to match the full pose
   * @internal
   */
  private getTunnelPath(snake: Snake, targetCells: Point[]): Snake[] {
    const chain: Snake[] = [];
    let currentSnake = snake;

    for (let i = 1; i < targetCells.length; i++) {
      const dx = targetCells[i].x - currentSnake.getHeadX();
      const dy = targetCells[i].y - currentSnake.getHeadY();
      currentSnake = currentSnake.nextSnake(dx, dy);
      chain.unshift(currentSnake);
    }

    return chain;
  }

  /**
   * Checks if a move is valid (cell color ≤ maxColor threshold or out of bounds).
   *
   * @param x - The x-coordinate to check
   * @param y - The y-coordinate to check
   * @returns True if the cell color is ≤ currentMaxColor or out of bounds, false otherwise
   * @internal
   */
  private isValidMove(x: number, y: number): boolean {
    if (!this.grid.isInside(x, y)) return true;
    const color = this.grid.getColor(x, y);
    return (color as number) <= (this.currentMaxColor as number);
  }

  /**
   * Checks if a cell is empty or out of bounds in the given grid.
   *
   * @param grid - The grid to check
   * @param x - The x-coordinate to check
   * @param y - The y-coordinate to check
   * @returns True if the cell is empty or out of bounds, false otherwise
   * @internal
   */
  private isEmptySafe(grid: Grid, x: number, y: number): boolean {
    return !grid.isInside(x, y) || grid.isEmptyCell(grid.getColor(x, y));
  }

  /**
   * Checks if a move is valid within the bounding box (for pose pathfinding).
   *
   * @param x - The x-coordinate to check
   * @param y - The y-coordinate to check
   * @param box - The bounding box for valid movement
   * @returns True if the cell is within the bounding box, false otherwise
   * @internal
   */
  private isValidMoveForPose(x: number, y: number, box: { minX: number; minY: number; maxX: number; maxY: number }): boolean {
    return (
      x >= box.minX &&
      x <= box.maxX &&
      y >= box.minY &&
      y <= box.maxY
    );
  }

  /**
   * Reconstructs the path from the goal node back to the start node.
   *
   * @remarks
   * **Path Ordering**: Returns array ordered newest→oldest [goal, parent, ..., start], INCLUDING start state.
   * Consumers should call `pop()` to remove the start state before using `unshift()` to prepend to existing paths.
   *
   * @param goalNode - The final PathNode in the search
   * @returns Array of Snake states ordered newest→oldest [goal, parent, ..., start], including the start state
   * @internal
   */
  private reconstructPath(goalNode: PathNode): Snake[] {
    const path: Snake[] = [];
    let current: PathNode | null = goalNode;

    // Walk from goal back to start, pushing each state
    // This produces [goal, parent, ..., start] order (newest→oldest)
    // Note: We include ALL nodes including start (matching SNK's unwrap behavior)
    while (current) {
      path.push(current.snake);
      current = current.parent;
    }

    return path;
  }

  /**
   * Inserts a PathNode into the list maintaining sorted order by total cost.
   *
   * @remarks
   * Uses binary search for efficient insertion into sorted list.
   *
   * @param list - The list of PathNodes to insert into
   * @param node - The PathNode to insert
   * @internal
   */
  private sortedInsert(list: PathNode[], node: PathNode): void {
    let lo = 0, hi = list.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (list[mid].totalCost <= node.totalCost) lo = mid + 1;
      else hi = mid;
    }
    list.splice(lo, 0, node);
  }
}
