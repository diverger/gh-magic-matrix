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

  constructor(grid: Grid) {
    this.grid = grid;
  }

  /**
   * \brief Finds a path for the snake from its current position to the target coordinates using the A* algorithm.
   *
   * \details
   * This method performs A* search to compute a sequence of snake states that move the snake from its current position
   * to the specified (targetX, targetY) cell. It considers grid boundaries, self-collision, and cell validity. The path
   * is reconstructed from the goal node back to the start. If no path is found, null is returned. Used for tunnel entry
   * navigation and general movement planning.
   *
   * \param snake The starting Snake instance (position and body).
   * \param targetX The x-coordinate of the target cell.
   * \param targetY The y-coordinate of the target cell.
   * \return Array of Snake states representing the path, or null if unreachable.
   */
  findPath(snake: Snake, targetX: number, targetY: number): Snake[] | null {
    const openList: PathNode[] = [new PathNode(snake)];
    const closedList: Snake[] = [];

    while (openList.length > 0) {
      // Get node with lowest f-cost
      const current = openList.shift()!;
      const currentHead = current.snake.getHead();

      // Check if we reached the target
      if (currentHead.x === targetX && currentHead.y === targetY) {
        return this.reconstructPath(current);
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
          closedList.push(newSnake);
        }
      }
    }

    return null; // No path found
  }

  /**
   * Find path to match a specific snake pose
   */
  findPathToPose(snake: Snake, targetSnake: Snake): Snake[] | null {
    if (snake.equals(targetSnake)) {
      return [];
    }

    const targetCells = targetSnake.toCells().reverse();
    const snakeLength = snake.getLength();
    const targetHead = targetCells[0];

    // Create bounding box for search optimization
    const box = {
      minX: Math.min(snake.getHeadX(), targetHead.x) - snakeLength - 1,
      minY: Math.min(snake.getHeadY(), targetHead.y) - snakeLength - 1,
      maxX: Math.max(snake.getHeadX(), targetHead.x) + snakeLength + 1,
      maxY: Math.max(snake.getHeadY(), targetHead.y) + snakeLength + 1,
    };

    // Forbidden cells are the target snake's body (excluding head)
    const forbidden = targetCells.slice(1, 4); // First few segments to avoid

    const openList: PathNode[] = [new PathNode(snake)];
    const closedList: Snake[] = [];

    while (openList.length > 0) {
      const current = openList.shift()!;
      const currentHead = current.snake.getHead();

      // Check if we reached the target head position
      if (currentHead.x === targetHead.x && currentHead.y === targetHead.y) {
        const path = this.reconstructPath(current);
        // Add tunnel path to reach final pose if needed
        return path;
      }

      // Try all four directions
      for (const direction of neighbors4) {
        const newX = currentHead.x + direction.x;
        const newY = currentHead.y + direction.y;

        // Check bounds, collision, and forbidden cells
        if (
          !current.snake.willSelfCollide(direction.x, direction.y) &&
          this.isValidMoveForPose(newX, newY, box) &&
          !forbidden.some((p) => p.x === newX && p.y === newY)
        ) {
          const newSnake = current.snake.nextSnake(direction.x, direction.y);

          if (closedList.some((s) => s.equals(newSnake))) {
            continue;
          }

          const cost = current.cost + 1;
          const heuristic = Math.abs(newX - targetHead.x) + Math.abs(newY - targetHead.y);
          const newNode = new PathNode(newSnake, current, cost, heuristic);

          this.sortedInsert(openList, newNode);
          closedList.push(newSnake);
        }
      }
    }

    return null;
  }

  /**
   * Check if a move is valid (empty cell or out of bounds)
   */
  private isValidMove(x: number, y: number): boolean {
    return !this.grid.isInside(x, y) || this.grid.isEmptyCell(this.grid.getColor(x, y));
  }

  /**
   * Check if a move is valid within bounding box (for pose pathfinding)
   */
  private isValidMoveForPose(x: number, y: number, box: { minX: number; minY: number; maxX: number; maxY: number }): boolean {
    return (
      x >= box.minX &&
      x <= box.maxX &&
      y >= box.minY &&
      y <= box.maxY &&
      this.isValidMove(x, y)
    );
  }

  /**
   * Reconstruct path from goal node back to start
   */
  private reconstructPath(goalNode: PathNode): Snake[] {
    const path: Snake[] = [];
    let current: PathNode | null = goalNode;

    while (current) {
      path.push(current.snake);
      current = current.parent;
    }

    path.pop(); // Remove start position
    path.reverse();
    return path;
  }

  /**
   * Insert node into list maintaining sorted order by total cost
   */
  private sortedInsert(list: PathNode[], node: PathNode): void {
    let left = 0;
    let right = list.length;

    if (list.length === 0 || node.totalCost <= list[0].totalCost) {
      list.unshift(node);
      return;
    }

    while (right - left > 1) {
      const mid = Math.ceil((left + right) / 2);
      if (node.totalCost > list[mid].totalCost) {
        left = mid;
      } else {
        right = mid;
      }
    }

    const insertIndex = Math.ceil((left + right) / 2);
    list.splice(insertIndex, 0, node);
  }
}
