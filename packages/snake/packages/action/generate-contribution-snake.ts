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
import type { OutputConfig } from "./outputs-options";
import { createSvg } from "../svg-creator";

/**
 * Options for snake generation process.
 */
export interface GenerationOptions {
  /** GitHub API token for fetching contribution data */
  githubToken: string;
  /** Custom snake length (defaults to 4, matching SNK's snake4) */
  snakeLength?: number;
}

/**
 * Generates contribution snake animations in multiple formats.
 *
 * This is the main orchestrator function that:
 * 1. Fetches GitHub contribution data
 * 2. Converts contributions to a pathfinding grid
 * 3. Computes optimal snake route using advanced pathfinding
 * 4. Generates output files in SVG format
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
  const { githubToken, snakeLength = 4 } = options;

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

  // Step 3: Initialize snake outside the grid (like SNK's snake4)
  const initialSnake = Snake.createHorizontal(snakeLength);

  console.log(`🐍 Snake initialized at (0, -1) with length ${snakeLength}`);

  // Step 4: Compute optimal route using pathfinding algorithms
  console.log("📡 Computing optimal snake route...");
  const solver = new SnakeSolver(grid);
  const route = solver.solve(initialSnake);

  if (!route || route.length === 0) {
    throw new Error("Failed to compute valid snake route - no path found");
  }

  console.log(`🎯 Route computed: ${route.length} steps (including return path)`);

  // Step 5: Generate outputs in requested formats
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
                  if (color) acc[level] = color;
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
                    if (color) acc[level] = color;
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