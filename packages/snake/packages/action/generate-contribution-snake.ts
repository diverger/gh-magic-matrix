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
import { Pathfinder } from "../solver/pathfinder";
import { Snake } from "../types/snake";
import { Point } from "../types/point";
import type { OutputConfig } from "./outputs-options";
import { createSvg } from "../svg-creator";

/**
 * Creates a smooth animation chain with step-by-step movement.
 * Ensures each frame differs by only one cell movement from the previous frame.
 */
const createSmoothAnimationChain = (keyFrames: Snake[]): Snake[] => {
  if (keyFrames.length <= 1) return keyFrames;

  const smoothChain: Snake[] = [keyFrames[0]];

  for (let i = 1; i < keyFrames.length; i++) {
    const currentSnake = smoothChain[smoothChain.length - 1];
    const targetSnake = keyFrames[i];

    // Generate step-by-step movement from current to target
    const intermediateSteps = generateStepByStepMovement(currentSnake, targetSnake);
    smoothChain.push(...intermediateSteps);
  }

  return smoothChain;
};

/**
 * Generates step-by-step movement between two snake states.
 */
const generateStepByStepMovement = (fromSnake: Snake, toSnake: Snake): Snake[] => {
  const steps: Snake[] = [];
  const fromHead = fromSnake.getHead();
  const toHead = toSnake.getHead();

  // Calculate the path from current position to target position
  const dx = toHead.x - fromHead.x;
  const dy = toHead.y - fromHead.y;

  // Move step by step (one cell at a time)
  let currentSnake = fromSnake;

  // First move horizontally
  for (let x = 0; x < Math.abs(dx); x++) {
    const direction = dx > 0 ? 1 : -1;
    currentSnake = currentSnake.nextSnake(direction, 0);
    steps.push(currentSnake);
  }

  // Then move vertically
  for (let y = 0; y < Math.abs(dy); y++) {
    const direction = dy > 0 ? 1 : -1;
    currentSnake = currentSnake.nextSnake(0, direction);
    steps.push(currentSnake);
  }

  return steps;
};

/**
 * Creates a return path for the snake to create a continuous loop.
 * This uses the existing Pathfinder.findPathToPose method to move from the end position back to the start.
 *
 * @param endSnake - The snake at the end of the main route
 * @param startSnake - The initial snake position to return to
 * @param grid - The game grid to use for pathfinding
 * @returns Array of Snake states representing the return path
 */
const createReturnPath = (endSnake: Snake, startSnake: Snake, grid: any): Snake[] => {
  const pathfinder = new Pathfinder(grid);
  const returnPath = pathfinder.findPathToPose(endSnake, startSnake);

  if (!returnPath) {
    console.warn("🚨 Could not find return path, using empty return path");
    return [];
  }

  console.log(`🔄 Return path found with ${returnPath.length} steps`);
  return returnPath;
};

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

  // Step 5: Add return path to create a continuous loop (like SNK does)
  console.log("🔄 Adding return path to create loop...");
  const returnPath = createReturnPath(route[route.length - 1], initialSnake, grid);
  const completeRoute = [...route, ...returnPath];

  console.log(`🔄 Complete route: ${completeRoute.length} steps (including return)`);

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