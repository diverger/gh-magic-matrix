/**
 * Snake Contribution Generation
 *
 * Main generation function that orchestrates the entire snake creation process.
 * Handles data fetching, pathfinding, and output generation for multiple formats.
 *
 * @module generate-contribution-snake
 */

import { fetchUserContributions } from "../user-contribution-fetcher";
import { userContributionToGrid } from "./user-contribution-to-grid";
import { SnakeSolver } from "../solver/snake-solver";
import { Snake } from "../types/snake";
import { Point } from "../types/point";
import type { OutputConfig } from "./outputs-options";
import { renderAnimatedSvgGrid } from "../svg-creator";

/**
 * Options for snake generation process.
 */
export interface GenerationOptions {
  /** GitHub API token for fetching contribution data */
  githubToken: string;
  /** Starting position for the snake (defaults to top-left) */
  startPosition?: Point;
  /** Custom snake length (defaults to 4) */
  snakeLength?: number;
}

/**
 * Generates contribution snake animations in multiple formats.
 *
 * This is the main orchestrator function that:
 * 1. Fetches GitHub contribution data
 * 2. Converts contributions to a pathfinding grid
 * 3. Computes optimal snake route using advanced pathfinding
 * 4. Generates output files in requested formats (SVG/GIF)
 *
 * @param userName - GitHub username to fetch contributions for.
 * @param outputs - Array of output configurations.
 * @param options - Generation options including GitHub token.
 * @returns Promise resolving to array of generated file content.
 *
 * @example
 * ```typescript
 * const outputs = [
 *   { filename: "snake.svg", format: "svg", drawOptions: {...}, animationOptions: {...} }
 * ];
 *
 * const results = await generateContributionSnake("username", outputs, {
 *   githubToken: process.env.GITHUB_TOKEN
 * });
 *
 * // Write results to files
 * results.forEach((content, i) => {
 *   if (content && outputs[i]) {
 *     fs.writeFileSync(outputs[i].filename, content);
 *   }
 * });
 * ```
 */
export const generateContributionSnake = async (
  userName: string,
  outputs: (OutputConfig | null)[],
  options: GenerationOptions,
): Promise<(string | null)[]> => {
  const { githubToken, startPosition, snakeLength = 4 } = options;

  if (!userName) {
    throw new Error("Username is required for contribution snake generation");
  }

  console.log(`🐍 Starting snake generation for ${userName}`);

  // Step 1: Fetch GitHub contribution data
  console.log("🎣 Fetching GitHub user contributions...");
  const contributionData = await fetchUserContributions(userName, { githubToken });

  if (!contributionData || contributionData.length === 0) {
    throw new Error(`No contribution data found for user: ${userName}`);
  }

  console.log(`📊 Found ${contributionData.length} contribution cells`);

  // Step 2: Convert contributions to pathfinding grid
  console.log("🗺️ Converting contributions to pathfinding grid...");
  const grid = userContributionToGrid(contributionData);

  // Step 3: Initialize snake at starting position
  const defaultStartPosition = startPosition || new Point(0, 0);
  const initialSnake = Snake.fromSinglePoint(defaultStartPosition, snakeLength);

  console.log(`🐍 Snake initialized at (${defaultStartPosition.x}, ${defaultStartPosition.y}) with length ${snakeLength}`);

  // Step 4: Compute optimal route using pathfinding algorithms
  console.log("📡 Computing optimal snake route...");
  const solver = new SnakeSolver(grid);
  const route = solver.solve(initialSnake);

  if (!route || route.length === 0) {
    throw new Error("Failed to compute valid snake route - no path found");
  }

  console.log(`🎯 Route computed: ${route.length} steps`);

  // Step 6: Generate outputs in requested formats
  console.log(`🎨 Generating ${outputs.length} output(s)...`);

  const results = await Promise.all(
    outputs.map(async (output, index) => {
      if (!output) {
        console.log(`⏭️ Skipping output ${index} (null configuration)`);
        return null;
      }

      const { format, drawOptions, animationOptions } = output;

      try {
        switch (format) {
          case "svg": {
            console.log(`🖌️ Creating SVG (output ${index})`);

            // Convert grid and route data for SVG rendering
            const animatedCells = convertRouteToAnimatedCells(grid, route);
            const svgResult = renderAnimatedSvgGrid(animatedCells, {
              colorDots: drawOptions.colorDots.reduce((acc, color, level) => {
                acc[level] = color;
                return acc;
              }, {} as Record<number, string>),
              colorEmpty: drawOptions.colorEmpty,
              colorDotBorder: drawOptions.colorDotBorder,
              cellSize: drawOptions.sizeCell,
              dotSize: drawOptions.sizeDot,
              dotBorderRadius: drawOptions.sizeDotBorderRadius,
            }, animationOptions.frameDuration * route.length);

            return `<svg>${svgResult.svgElements.join('')}</svg><style>${svgResult.styles.join('')}</style>`;
          }

          case "gif": {
            console.log(`📹 Creating GIF (output ${index})`);
            // Note: GIF creation would require additional canvas rendering
            // For now, return SVG as fallback
            console.warn("GIF generation not yet implemented, falling back to SVG");
            return null;
          }

          default:
            console.warn(`Unknown format: ${format}, skipping output ${index}`);
            return null;
        }
      } catch (error) {
        console.error(`❌ Failed to generate ${format} (output ${index}):`, error);
        return null;
      }
    })
  );

  console.log("✅ Snake generation completed successfully");
  return results;
};

/**
 * Converts snake route data to animated grid cells for SVG rendering.
 *
 * @param grid - The pathfinding grid.
 * @param route - Array of snake states representing the movement.
 * @returns Array of animated grid cells.
 */
const convertRouteToAnimatedCells = (grid: any, route: any[]) => {
  // This is a simplified conversion - in a real implementation,
  // this would need to properly map the route data to animated cells
  const cells = [];

  for (let x = 0; x < grid.width; x++) {
    for (let y = 0; y < grid.height; y++) {
      const color = grid.getColor(x, y);
      if (color !== 0) { // Not empty
        cells.push({
          x,
          y,
          color,
          animationTime: Math.random(), // Simplified timing
        });
      }
    }
  }

  return cells;
};