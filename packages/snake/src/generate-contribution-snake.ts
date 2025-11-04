/**
 * Snake Contribution Generation
 *
 * Main generation function that orchestrates the entire snake creation process.
 * Handles data fetching, pathfinding, and output generation for multiple formats.
 *
 * @module generate-contribution-snake
 */

import { fetchUserContributions } from "../packages/user-contribution-fetcher";
import { userContributionToGrid } from "./user-contribution-to-grid";
import { SnakeSolver } from "../packages/solver/snake-solver";
import { Snake } from "../packages/types/snake";
import type { OutputConfig } from "./outputs-options";
import { createSvg } from "../packages/svg-creator";

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

  if (!Number.isInteger(snakeLength) || snakeLength <= 0) {
    throw new RangeError(`snakeLength must be a positive integer, got: ${snakeLength}`);
  }

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

  // Analyze route to find empty cells that the snake passes through
  // Build a map of all contributions for quick lookup
  const contributionLookup = new Map<string, number>();
  for (const cell of contributionData) {
    const key = `${cell.x},${cell.y}`;
    contributionLookup.set(key, cell.count);
  }

  // Extract unique cells from route (snake may pass through same cell multiple times)
  const visitedCells = new Set<string>();
  const emptyCellsInRoute: Array<{ x: number; y: number }> = [];

  for (const snakeState of route) {
    // Get the head position from each snake state in the route
    const head = snakeState.getHead();
    const key = `${head.x},${head.y}`;

    if (!visitedCells.has(key)) {
      visitedCells.add(key);

      const count = contributionLookup.get(key);
      if (count === 0 || count === undefined) {
        emptyCellsInRoute.push({ x: head.x, y: head.y });
      }
    }
  }

  if (emptyCellsInRoute.length > 0) {
    console.log(`📍 Snake passes through ${emptyCellsInRoute.length} empty cells (contribution=0)`);
    console.log(`   Empty cells:`, emptyCellsInRoute.slice(0, 5).map(c => `(${c.x},${c.y})`).join(', '),
      emptyCellsInRoute.length > 5 ? '...' : '');
  } else {
    console.log(`📍 Snake does not pass through any empty cells`);
  }

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

            // Build contribution count map if counter is enabled
            let counterConfig = animationOptions.contributionCounter;
            if (animationOptions.contributionCounter?.enabled) {
              // Create map with cell coordinates as keys: "x,y" -> count
              const contributionMap = new Map<string, number>();
              let totalCount = 0;

              // Store each cell's contribution count by its coordinates
              // Include all cells, even those with 0 contributions (level 0)
              for (const contrib of contributionData) {
                const key = `${contrib.x},${contrib.y}`;
                contributionMap.set(key, contrib.count);
                totalCount += contrib.count;
              }

              console.log(`📊 Built contribution map with ${contributionMap.size} cells, total: ${totalCount} contributions`);

              // Pass colorDots to counter config with direct index mapping
              // NOTE: drawOptions.colorDots array already includes L0 at index 0
              // Array structure: [L0_color, L1_color, L2_color, L3_color, L4_color]
              // This maps directly to CSS variables: --c0, --c1, --c2, --c3, --c4
              const colorDotsRecord = drawOptions.colorDots.reduce((acc, color, level) => {
                if (color) acc[level] = color;
                return acc;
              }, {} as Record<number, string>);

              // Clone counter config to avoid mutating caller's options
              counterConfig = {
                ...animationOptions.contributionCounter,
                contributionMap,
                colorDots: colorDotsRecord,
              };

              console.log(`🎨 Color dots for gradient:`, JSON.stringify(colorDotsRecord));
            }

            // Create complete SVG using the comprehensive createSvg function
            const svgContent = await createSvg(
              grid,
              null, // Use all cells
              route,
              {
                // Direct mapping: drawOptions.colorDots array already includes all levels
                // Array structure: [L0, L1, L2, L3, L4] maps to CSS: [--c0, --c1, --c2, --c3, --c4]
                colorDots: drawOptions.colorDots.reduce((acc, color, level) => {
                  if (color) acc[level] = color;
                  return acc;
                }, {} as Record<number, string>),
                colorEmpty: drawOptions.colorEmpty,
                colorDotBorder: drawOptions.colorDotBorder,
                colorSnake: drawOptions.colorSnake,
                colorSnakeSegments: drawOptions.colorSnakeSegments,
                colorShiftMode: drawOptions.colorShiftMode,
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
                  colorSnakeSegments: drawOptions.dark.colorSnakeSegments,
                  colorShiftMode: drawOptions.dark.colorShiftMode,
                } : undefined,
                // Add custom content configuration if available
                useCustomSnake: drawOptions.useCustomSnake,
                customSnakeConfig: drawOptions.customSnakeConfig,
              },
              {
                frameDuration: animationOptions.frameDuration,
                contributionCounter: counterConfig
              }
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