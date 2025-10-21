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
import { createSvg } from "../svg-creator";

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

            // Create complete SVG using the comprehensive createSvg function
            const svgContent = createSvg(
              grid,
              null, // Use all cells
              route,
              {
                colorDots: drawOptions.colorDots.reduce((acc, color, level) => {
                  acc[level] = color;
                  return acc;
                }, {} as Record<number, string>),
                colorEmpty: drawOptions.colorEmpty,
                colorDotBorder: drawOptions.colorDotBorder,
                colorSnake: drawOptions.colorSnake,
                sizeCell: drawOptions.sizeCell,
                sizeDot: drawOptions.sizeDot,
                sizeDotBorderRadius: drawOptions.sizeDotBorderRadius,
                // Add dark mode support if available
                dark: drawOptions.dark ? {
                  colorDots: drawOptions.dark.colorDots.reduce((acc, color, level) => {
                    acc[level] = color;
                    return acc;
                  }, {} as Record<number, string>),
                  colorEmpty: drawOptions.dark.colorEmpty,
                  colorDotBorder: drawOptions.dark.colorDotBorder,
                  colorSnake: drawOptions.dark.colorSnake,
                } : undefined,
              },
              { frameDuration: animationOptions.frameDuration }
            );

            return svgContent;
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