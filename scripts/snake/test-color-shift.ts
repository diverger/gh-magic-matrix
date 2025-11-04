#!/usr/bin/env bun
/**
 * 🌈 Color Shift Modes Test
 *
 * Tests the new color shift animation modes for multi-color snakes:
 * 1. every-step: Colors shift on every grid movement
 * 2. on-eat: Colors shift only when eating colored cells
 *
 * Usage:
 *   bun scripts/snake/test-color-shift.ts
 *
 * Output:
 *   test-outputs/color-shift/
 */

import * as fs from "fs";
import * as path from "path";
import { loadGitHubToken } from "../utils/env-loader";

const REPO_ROOT = path.resolve(process.cwd());
const OUTPUT_DIR = path.join(REPO_ROOT, "test-outputs", "color-shift");

// Test configurations for color shift modes
interface ColorShiftTestConfig {
  name: string;
  description: string;
  colors: string[];
  shiftMode: 'none' | 'every-step' | 'on-eat';
}

const TEST_CONFIGS: ColorShiftTestConfig[] = [
  {
    name: "static-rainbow",
    description: "Rainbow colors with no shifting (baseline)",
    colors: ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"],
    shiftMode: "none",
  },
  {
    name: "flow-rainbow",
    description: "Rainbow with every-step shift (flowing wave effect)",
    colors: ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"],
    shiftMode: "every-step",
  },
  {
    name: "eat-rainbow",
    description: "Rainbow with on-eat shift (contribution-based)",
    colors: ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"],
    shiftMode: "on-eat",
  },
  {
    name: "static-fire",
    description: "Fire gradient (yellow to red) - static",
    colors: ["#fef08a", "#fbbf24", "#f97316", "#dc2626"],
    shiftMode: "none",
  },
  {
    name: "flow-fire",
    description: "Fire gradient with every-step shift",
    colors: ["#fef08a", "#fbbf24", "#f97316", "#dc2626"],
    shiftMode: "every-step",
  },
  {
    name: "eat-ocean",
    description: "Ocean gradient (cyan to blue) with on-eat shift",
    colors: ["#67e8f9", "#06b6d4", "#0284c7", "#1d4ed8"],
    shiftMode: "on-eat",
  },
  {
    name: "flow-neon",
    description: "Neon colors with every-step shift",
    colors: ["#ff00ff", "#00ffff", "#ffff00"],
    shiftMode: "every-step",
  },
];

async function runTests() {
  console.log("🌈 Color Shift Modes Test Suite\n");

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Load GitHub token
  const githubToken = loadGitHubToken(REPO_ROOT);

  // Dynamically import modules
  const { generateContributionSnake } = await import("../../packages/snake/src/generate-contribution-snake");
  const { parseOutputsOption } = await import("../../packages/snake/src/outputs-options");

  let successCount = 0;
  let failCount = 0;

  for (const config of TEST_CONFIGS) {
    try {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`Testing: ${config.name}`);
      console.log(`${config.description}`);
      console.log(`Colors: ${config.colors.join(", ")}`);
      console.log(`Shift Mode: ${config.shiftMode}`);
      console.log(`${"=".repeat(60)}`);

      const outputPath = path.join(OUTPUT_DIR, `${config.name}.svg`);

      // Build query string with color shift mode
      const queryParams = new URLSearchParams({
        palette: "github-dark",
        color_snake: config.colors.join(","),
        color_shift_mode: config.shiftMode,
      });

      const outputWithParams = `${outputPath}?${queryParams.toString()}`;

      const parsedOutputs = parseOutputsOption([outputWithParams]);

      const results = await generateContributionSnake(
        "diverger",
        parsedOutputs,
        {
          githubToken,
          snakeLength: 4,  // Use length 4 to avoid pathfinding issues with longer snakes
        }
      );

      // Write output
      if (results && results[0]) {
        fs.writeFileSync(outputPath, results[0]);
        console.log(`✅ Success: ${outputPath}`);
        successCount++;
      } else {
        console.error(`❌ Failed: No output generated`);
        failCount++;
      }
    } catch (error) {
      console.error(`❌ Error in ${config.name}:`, error);
      failCount++;
    }
  }

  // Summary
  console.log(`\n${"=".repeat(60)}`);
  console.log("Test Summary");
  console.log(`${"=".repeat(60)}`);
  console.log(`✅ Passed: ${successCount}/${TEST_CONFIGS.length}`);
  console.log(`❌ Failed: ${failCount}/${TEST_CONFIGS.length}`);
  console.log(`\n📂 Output directory: ${OUTPUT_DIR}`);
  console.log(`\n💡 Tip: Open the SVG files in your browser to see the animations`);

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error("\n❌ Test suite failed:");
  console.error(error);
  process.exit(1);
});
