/**
 * User Contribution to Grid Converter
 *
 * Converts GitHub user contribution data into a grid format suitable for pathfinding algorithms.
 * Handles the transformation from contribution cells to a colored grid representation.
 *
 * @module user-contribution-to-grid
 */

import { Grid, EMPTY } from "../types/grid";
import type { ContributionCell } from "../user-contribution-fetcher";
import type { Color } from "../types/grid";

/**
 * Converts user contribution data into a grid suitable for snake pathfinding.
 *
 * Takes an array of contribution cells and creates a colored grid where each cell's
 * color represents the contribution level. Empty cells (level 0) are marked as empty,
 * while contribution cells (level 1-4) are assigned colors.
 *
 * @param cells - Array of contribution cells from GitHub API.
 * @returns A colored grid ready for pathfinding algorithms.
 *
 * @example
 * ```typescript
 * const contributionData = await fetchUserContributions("username");
 * const grid = userContributionToGrid(contributionData.cells);
 *
 * // Grid is now ready for snake pathfinding
 * const snake = Snake.fromPoint(new Point(0, 0));
 * const route = getBestRoute(grid, snake);
 * ```
 */
export const userContributionToGrid = (cells: ContributionCell[]) => {
  if (cells.length === 0) {
    throw new Error("Cannot create grid from empty contribution data");
  }

  // Calculate grid dimensions from contribution data
  const width = Math.max(0, ...cells.map((cell) => cell.x)) + 1;
  const height = Math.max(0, ...cells.map((cell) => cell.y)) + 1;

  if (width === 0 || height === 0) {
    throw new Error("Invalid grid dimensions calculated from contribution data");
  }

  console.log(`📐 Creating grid: ${width}x${height} (${cells.length} cells)`);

  // Create empty grid and populate with contribution data
  const grid = new Grid(width, height);

  for (const cell of cells) {
    if (cell.level > 0) {
      // Set color for cells with contributions
      grid.setColor(cell.x, cell.y, cell.level as Color);
    } else {
      // Mark empty cells explicitly
      grid.setColor(cell.x, cell.y, EMPTY);
    }
  }

  return grid;
};

/**
 * Validates contribution cell data for grid conversion.
 *
 * @param cells - Array of contribution cells to validate.
 * @returns True if data is valid for grid conversion.
 */
export const validateContributionData = (cells: ContributionCell[]): boolean => {
  if (!Array.isArray(cells) || cells.length === 0) {
    return false;
  }

  return cells.every(cell =>
    typeof cell.x === 'number' &&
    typeof cell.y === 'number' &&
    cell.x >= 0 &&
    cell.y >= 0 &&
    typeof cell.level === 'number' &&
    cell.level >= 0 &&
    cell.level <= 4
  );
};

/**
 * Gets grid statistics from contribution data.
 *
 * @param cells - Array of contribution cells.
 * @returns Statistics about the contribution data.
 */
export const getGridStatistics = (cells: ContributionCell[]) => {
  const totalContributions = cells.reduce((sum, cell) => sum + cell.count, 0);
  const contributionLevels = cells.reduce((acc, cell) => {
    acc[cell.level] = (acc[cell.level] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return {
    totalCells: cells.length,
    totalContributions,
    contributionLevels,
    maxLevel: Math.max(...cells.map(cell => cell.level)),
    activeContributionCells: cells.filter(cell => cell.level > 0).length,
  };
};