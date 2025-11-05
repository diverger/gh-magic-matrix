#!/usr/bin/env bun
/**
 * 🚀 Quick Colorful Snake Test
 *
 * Quick test for a single colorful snake configuration.
 * Modify the config below and run to see results instantly.
 *
 * Usage:
 *   bun scripts/snake/quick-colorful-test.ts
 *
 * Output:
 *   test-outputs/colorful-snake/quick-test.svg
 */

import * as fs from "fs";
import * as path from "path";
import { loadGitHubToken } from "../utils/env-loader";

const REPO_ROOT = path.resolve(process.cwd());

// ============================================================
// 🎨 CUSTOMIZE YOUR COLOR CONFIG HERE!
// ============================================================

const COLOR_CONFIG = {
  // Default single color (used when colorSegments is not set)
  colorSnake: '#a855f7',

  // Choose one of these configurations:

  // Option 1: Array of colors (uncomment to use)
  colorSegments: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'],

  // Option 2: Gradient function (uncomment to use instead of array)
  // colorSegments: (index: number, total: number) => {
  //   const hue = (index / total) * 360;
  //   return `hsl(${Math.round(hue)}, 70%, 50%)`;
  // },

  // Option 3: Fire gradient (uncomment to use)
  // colorSegments: (index: number, total: number) => {
  //   const ratio = index / Math.max(total - 1, 1);
  //   const r = 255;
  //   const g = Math.round(255 * (1 - ratio * 0.8));
  //   const b = 0;
  //   return `rgb(${r}, ${g}, ${b})`;
  // },

  // Option 4: Ocean gradient (uncomment to use)
  // colorSegments: (index: number, total: number) => {
  //   const ratio = index / Math.max(total - 1, 1);
  //   const r = Math.round(0 * (1 - ratio));
  //   const g = Math.round(255 * (1 - ratio * 0.5));
  //   const b = 255;
  //   return `rgb(${r}, ${g}, ${b})`;
  // },

  // Option 5: Traffic light pattern (uncomment to use)
  // colorSegments: (index: number) => {
  //   const colors = ['#ef4444', '#eab308', '#22c55e'];
  //   return colors[index % 3];
  // },

  // Option 6: Fade to transparent (uncomment to use)
  // colorSegments: (index: number, total: number) => {
  //   const opacity = 1 - (index / total);
  //   return `rgba(168, 85, 247, ${opacity.toFixed(2)})`;
  // },
};

// ============================================================
// Run the test
// ============================================================

async function quickTest() {
  console.log("🚀 Quick Colorful Snake Test");
  console.log("=".repeat(60));

  const githubToken = loadGitHubToken(REPO_ROOT);
  const OUTPUT_PATH = path.join(REPO_ROOT, "test-outputs", "colorful-snake", "quick-test.svg");

  console.log(`\n📝 Configuration:`);
  console.log(`   Base Color: ${COLOR_CONFIG.colorSnake}`);
  if (COLOR_CONFIG.colorSegments) {
    if (Array.isArray(COLOR_CONFIG.colorSegments)) {
      console.log(`   Segments: [${COLOR_CONFIG.colorSegments.join(', ')}]`);
    } else if (typeof COLOR_CONFIG.colorSegments === 'function') {
      console.log(`   Segments: <function>`);
    }
  } else {
    console.log(`   Segments: Single color (${COLOR_CONFIG.colorSnake})`);
  }
  console.log(`\n💾 Output: ${OUTPUT_PATH}`);
  console.log(`\n⏳ Generating...`);

  // Import action
  const ACTION_PATH = path.join(REPO_ROOT, "snake/dist/index.js");
  if (!fs.existsSync(ACTION_PATH)) {
    console.error(`❌ Error: Action not found at ${ACTION_PATH}`);
    console.error("   Please build the action first:");
    console.error("   cd snake && npm run build");
    process.exit(1);
  }

  const action = await import(ACTION_PATH);

  // Create output directory
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });

  try {
    // Build draw options
    const drawOptions: any = {
      colorDotBorder: "#1b1f230a",
      colorEmpty: "#161b22",
      colorDots: {
        0: "#161b22",
        1: "#01311f",
        2: "#034525",
        3: "#0f6d31",
        4: "#00c647",
      },
      colorSnake: COLOR_CONFIG.colorSnake,
      sizeCell: 16,
      sizeDot: 12,
      sizeDotBorderRadius: 2,
    };

    // Add colorSnakeSegments if provided
    if (COLOR_CONFIG.colorSegments) {
      drawOptions.colorSnakeSegments = COLOR_CONFIG.colorSegments;
    }

    await action.run({
      githubUserName: "diverger",
      githubToken: githubToken,
      outputs: [`${OUTPUT_PATH}?palette=github-dark`],
      snakeLength: 8,  // Longer snake to show more colors
      animationDuration: 20,
      drawOptions,
    });

    console.log("\n✅ Success!");
    console.log(`\n📂 View the result at:`);
    console.log(`   ${OUTPUT_PATH}`);
    console.log(`\n💡 Tip: Open the SVG file in your browser to see the animation`);
  } catch (error) {
    console.error("\n❌ Error generating snake:");
    console.error(error);
    process.exit(1);
  }
}

// Run the test
quickTest();
