import { describe, it, expect } from 'bun:test';
import { Pathfinder } from '../pathfinder';
import { Grid, EMPTY } from '../../types/grid';
import { Snake } from '../../types/snake';
import { Point } from '../../types/point';

describe('Pathfinder with closed-set-on-generation', () => {
  describe('Basic pathfinding', () => {
    it('findPath should find a simple straight path', () => {
      const grid = new Grid(5, 5);
      const pathfinder = new Pathfinder(grid);
      const snake = Snake.fromPoint(new Point(0, 0));

      const path = pathfinder.findPath(snake, 3, 0, EMPTY);

      expect(path).not.toBeNull();
      expect(path?.length).toBeGreaterThan(0);
    });

    it('findPath should navigate around obstacles', () => {
      const grid = new Grid(5, 5);
      const pathfinder = new Pathfinder(grid);

      // Create an L-shaped obstacle
      grid.setColor(1, 1, 2 as any);
      grid.setColor(2, 1, 2 as any);
      grid.setColor(2, 2, 2 as any);

      const snake = Snake.fromPoint(new Point(0, 0));
      const path = pathfinder.findPath(snake, 3, 3, EMPTY);

      expect(path).not.toBeNull();
      expect(path?.length).toBeGreaterThan(0);
    });
  });

  describe('Self-collision detection', () => {
    it('findPath should avoid self-collision', () => {
      const grid = new Grid(5, 5);
      const pathfinder = new Pathfinder(grid);

      // Create a snake with length > 1
      const snake = new Snake([
        new Point(0, 0),
        new Point(1, 0),
        new Point(2, 0)
      ]);

      // Path exists but requires careful maneuvering
      const path = pathfinder.findPath(snake, 0, 3, EMPTY);

      expect(path).not.toBeNull();
      if (path) {
        // Verify no self-collision in the path
        for (const state of path) {
          const cells = state.toCells();
          const positions = new Set(cells.map(p => `${p.x},${p.y}`));
          expect(positions.size).toBe(cells.length);
        }
      }
    });
  });

  describe('No path available scenarios', () => {
    it('findPath should return null when target is completely enclosed', () => {
      const grid = new Grid(5, 5);
      const pathfinder = new Pathfinder(grid);

      // Create a complete wall surrounding the target at (3, 3)
      // Note: isInsideLarge(2) allows movement 2 cells outside grid, so we need
      // to block a larger area to prevent routing around obstacles
      for (let x = 2; x <= 4; x++) {
        for (let y = 2; y <= 4; y++) {
          if (x !== 3 || y !== 3) {  // Leave target clear
            grid.setColor(x, y, 2 as any);
          }
        }
      }

      const snake = Snake.fromPoint(new Point(0, 0));

      // Try to reach (3, 3) - it's completely enclosed
      const path = pathfinder.findPath(snake, 3, 3, EMPTY);

      expect(path).toBeNull();
    });

    it('findPath should return path when start equals target', () => {
      const grid = new Grid(3, 3);
      const pathfinder = new Pathfinder(grid);

      // Snake is at (1, 1) and target is also (1, 1), even if cell is colored
      grid.setColor(1, 1, 2 as any);
      const snake = Snake.fromPoint(new Point(1, 1));

      const path = pathfinder.findPath(snake, 1, 1, EMPTY);

      // When already at target, returns path with just the current position
      expect(path).not.toBeNull();
      expect(path?.length).toBe(1);
      expect(path?.[0].equals(snake)).toBe(true);
    });

    it('findPath should return null in a fully blocked grid', () => {
      const grid = new Grid(3, 3);
      const pathfinder = new Pathfinder(grid);

      // Fill entire grid except start position
      for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
          if (x !== 0 || y !== 0) {
            grid.setColor(x, y, 2 as any);
          }
        }
      }

      const snake = Snake.fromPoint(new Point(0, 0));

      // Try to reach any other position
      const path = pathfinder.findPath(snake, 2, 2, EMPTY);

      expect(path).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('findPath should handle single cell grids', () => {
      const grid = new Grid(1, 1);
      const pathfinder = new Pathfinder(grid);
      const snake = Snake.fromPoint(new Point(0, 0));

      // Already at target
      const path = pathfinder.findPath(snake, 0, 0, EMPTY);

      // Should return a path with just the starting position
      expect(path).not.toBeNull();
      expect(path?.length).toBeGreaterThan(0);
    });

    it('findPath should handle targets at grid boundaries', () => {
      const grid = new Grid(5, 5);
      const pathfinder = new Pathfinder(grid);
      const snake = Snake.fromPoint(new Point(0, 0));

      // Test all four corners
      const corners = [
        [0, 0], [4, 0], [0, 4], [4, 4]
      ];

      for (const [x, y] of corners) {
        const path = pathfinder.findPath(snake, x, y, EMPTY);
        expect(path).not.toBeNull();
      }
    });
  });

  describe('maxColor parameter behavior', () => {
    it('findPath should traverse colored cells when maxColor allows', () => {
      const grid = new Grid(5, 5);
      const pathfinder = new Pathfinder(grid);

      // Create colored cells
      grid.setColor(1, 0, 1 as any);
      grid.setColor(2, 0, 1 as any);

      const snake = Snake.fromPoint(new Point(0, 0));

      // With EMPTY, should route around
      const pathEmpty = pathfinder.findPath(snake, 3, 0, EMPTY);
      expect(pathEmpty).not.toBeNull();

      // With maxColor=1, can go through colored cells
      const pathColored = pathfinder.findPath(snake, 3, 0, 1 as any);
      expect(pathColored).not.toBeNull();
      // Should be able to find a more direct path
      if (pathEmpty && pathColored) {
        expect(pathColored.length).toBeLessThanOrEqual(pathEmpty.length);
      }
    });
  });
});
