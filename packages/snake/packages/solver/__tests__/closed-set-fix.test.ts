/**
 * Tests to verify that the closed set fix (adding initial state) doesn't break existing functionality
 * and correctly prevents potential infinite loops.
 */

import { Grid, EMPTY } from '../../types/grid';
import { Snake } from '../../types/snake';
import { Point } from '../../types/point';
import { Pathfinder } from '../pathfinder';
import { SnakeSolver } from '../snake-solver';

describe('Closed Set Fix - Initial State Prevention', () => {
  describe('Edge Case: Starting at goal', () => {
    it('findPathToNextPoint should handle snake already at target', () => {
      // Create a simple 5x5 grid with one colored cell at (2,2)
      const grid = new Grid(5, 5);
      grid.setColor(2, 2, 1 as any);

      const solver = new SnakeSolver(grid);
      const snake = Snake.fromPoint(new Point(2, 2));

      // Target is the current position
      const points = [new Point(2, 2)];

      // Should find path immediately (just the current state)
      const path = (solver as any).findPathToNextPoint(snake, 1 as any, points);

      expect(path).toBeTruthy();
      expect(path.length).toBeGreaterThan(0);
      expect(points.length).toBe(0); // Point should be removed via splice
    });
  });

  describe('Pathfinder.findPath with initial state in closed', () => {
    it('should still return complete path including start state', () => {
      const grid = new Grid(5, 5);
      const pathfinder = new Pathfinder(grid);

      const snake = Snake.fromPoint(new Point(0, 0));

      // Find path to (2, 2)
      const path = pathfinder.findPath(snake, 2, 2);

      expect(path).toBeTruthy();
      if (path) {
        expect(path.length).toBeGreaterThan(0);

        // Path should be ordered newest→oldest [goal, ..., start]
        const lastSnake = path[path.length - 1];
        expect(lastSnake.getHead().x).toBe(0);
        expect(lastSnake.getHead().y).toBe(0);

        // First should be goal
        const firstSnake = path[0];
        expect(firstSnake.getHead().x).toBe(2);
        expect(firstSnake.getHead().y).toBe(2);
      }
    });

    it('should allow pop() operation on returned path', () => {
      const grid = new Grid(5, 5);
      const pathfinder = new Pathfinder(grid);

      const snake = Snake.fromPoint(new Point(0, 0));
      const path = pathfinder.findPath(snake, 2, 2);

      expect(path).toBeTruthy();
      if (path) {
        const lengthBefore = path.length;
        const lastState = path[path.length - 1];

        // This simulates the consumer code: pathToTunnel.pop()
        path.pop();

        expect(path.length).toBe(lengthBefore - 1);
        expect(lastState.equals(snake)).toBe(true);
      }
    });
  });

  describe('Pathfinder.findPathToPose with initial state in closed', () => {
    it('should return empty array when start equals target', () => {
      const grid = new Grid(5, 5);
      const pathfinder = new Pathfinder(grid);

      const snake = Snake.fromPoint(new Point(2, 2));

      // Target is the same as start
      const path = pathfinder.findPathToPose(snake, snake);

      expect(path).toEqual([]);
    });

    it('should return valid path when start differs from target', () => {
      const grid = new Grid(5, 5);
      const pathfinder = new Pathfinder(grid);

      const startSnake = Snake.fromPoint(new Point(0, 0));
      const targetSnake = Snake.fromPoint(new Point(2, 2));

      const path = pathfinder.findPathToPose(startSnake, targetSnake);

      expect(path).toBeTruthy();
      if (path && path.length > 0) {
        // Path should be in chronological order (oldest→newest)
        // First should be close to start
        const first = path[0];
        expect(first.getHead().x).toBeLessThanOrEqual(1);
        expect(first.getHead().y).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('No path available scenarios', () => {
    it('findPath should return null when blocked', () => {
      const grid = new Grid(3, 3);
      const pathfinder = new Pathfinder(grid);

      // Create a wall by marking cells as colored
      grid.setColor(1, 0, 2 as any);
      grid.setColor(1, 1, 2 as any);
      grid.setColor(1, 2, 2 as any);

      const snake = Snake.fromPoint(new Point(0, 1));

      // Try to reach (2, 1) but it's blocked by the wall
      // EMPTY means only empty cells allowed
      const path = pathfinder.findPath(snake, 2, 1, EMPTY);

      expect(path).toBeNull();
    });
  });

  describe('Integration: Full solver with closed set fix', () => {
    it('should solve simple grid without issues', () => {
      // Create a 5x5 grid with some colored cells
      const grid = new Grid(5, 5);
      grid.setColor(1, 1, 1 as any);
      grid.setColor(2, 1, 1 as any);
      grid.setColor(3, 1, 1 as any);

      const solver = new SnakeSolver(grid);
      const startSnake = Snake.createHorizontal(4);

      // This should work without infinite loops or errors
      expect(() => {
        const solution = solver.solve(startSnake);
        expect(solution).toBeTruthy();
        expect(solution.length).toBeGreaterThan(0);
      }).not.toThrow();
    });
  });

  describe('Theoretical circular path scenario', () => {
    it('should not infinitely loop even if circular path exists', () => {
      // Create empty grid where snake could theoretically return to start
      const grid = new Grid(10, 10);
      const pathfinder = new Pathfinder(grid);

      const snake = Snake.fromPoint(new Point(5, 5));

      // Find path to adjacent cell
      const path = pathfinder.findPath(snake, 6, 5);

      expect(path).toBeTruthy();
      if (path) {
        // Should be a short path, not infinite
        expect(path.length).toBeLessThan(100);
        expect(path.length).toBeGreaterThan(0);
      }
    });
  });
});

describe('Closed Set Fix - Path Reconstruction', () => {
  it('reconstructPath should work correctly with initial state in closed', () => {
    const grid = new Grid(5, 5);
    const pathfinder = new Pathfinder(grid);

    const snake = Snake.fromPoint(new Point(0, 0));
    const path = pathfinder.findPath(snake, 3, 3);

    expect(path).toBeTruthy();
    if (path) {
      // Verify path continuity
      for (let i = 0; i < path.length - 1; i++) {
        const current = path[i].getHead();
        const next = path[i + 1].getHead();
        const distance = Math.abs(current.x - next.x) + Math.abs(current.y - next.y);

        // Each step should be adjacent (manhattan distance = 1)
        expect(distance).toBe(1);
      }
    }
  });
});
