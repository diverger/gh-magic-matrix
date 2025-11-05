#!/usr/bin/env bun
/**
 * 🌈 Colorful Snake Test Suite
 *
 * Tests the smart color_snake parameter that accepts both single and multiple colors.
 *
 * Smart color_snake behavior:
 * - Single color: "blue" or "#7845ab" → all segments same color
 * - Multiple colors: "#ff0000,#00ff00,#0000ff" → per-segment colors
 * - Last color repeats for remaining segments
 *
 * Test Configurations:
 * 1. rainbow-segments - Six rainbow colors
 * 2. two-color-gradient - Two colors (rest default)
 * 3. three-color-pattern - Three colors (rest default)
 * 4. fire-gradient - Yellow to red gradient
 * 5. ocean-gradient - Cyan to blue gradient
 * 6. neon-alternating - Three alternating neon colors
 * 7. monochrome-shades - Grayscale gradient
 * 8. pastel-rainbow - Pastel rainbow colors
 * 9. default-single-color - Single color (backward compatibility)
 * 10. rgba-transparency - RGBA colors with varying opacity
 *
 * Run:
 *   bun scripts/snake/test-colorful-snake.ts
 *
 * Output:
 *   SVG files will be saved to test-outputs/colorful-snake/
 */

import * as fs from "fs";
import * as path from "path";
import { loadGitHubToken } from "../utils/env-loader";

// TypeScript interface for test configuration
interface ColorfulTestConfig {
  name: string;
  description: string;
  colorSnake: string; // Can be single color or comma-separated colors
  palette?: string; // Optional palette override (defaults to github-dark)
}

// Get repo root
const REPO_ROOT = path.resolve(process.cwd());

console.log("🌈 Testing Colorful Snake Configurations");
console.log("=".repeat(60));
console.log("");

const githubToken = loadGitHubToken(REPO_ROOT);

// Test configurations - testing the smart color_snake parameter
const COLORFUL_TEST_CONFIGS: ColorfulTestConfig[] = [
  // 1. Rainbow segments - using comma-separated colors in color_snake
  {
    name: "rainbow-segments",
    description: "Rainbow colored segments (smart color_snake with commas)",
    colorSnake: "#ef4444,#f97316,#eab308,#22c55e,#3b82f6,#8b5cf6",
  },

  // 2. Two-color gradient - first two segments only
  {
    name: "two-color-gradient",
    description: "Two colors: purple and pink (rest default)",
    colorSnake: "#a855f7,#ec4899",
  },

  // 3. Three-color pattern
  {
    name: "three-color-pattern",
    description: "Three colors: red, yellow, green (rest default)",
    colorSnake: "#ef4444,#eab308,#22c55e",
  },

  // 4. Fire gradient - warm colors
  {
    name: "fire-gradient",
    description: "Fire gradient: yellow to red",
    colorSnake: "#ffff00,#ffcc00,#ff9900,#ff6600,#ff3300,#ff0000",
  },

  // 5. Ocean gradient - cool colors
  {
    name: "ocean-gradient",
    description: "Ocean gradient: cyan to blue",
    colorSnake: "#00ffff,#00ccff,#0099ff,#0066ff,#0033ff,#0000ff",
  },

  // 6. Neon alternating - bright colors
  {
    name: "neon-alternating",
    description: "Alternating neon: magenta, cyan, yellow",
    colorSnake: "#ff00ff,#00ffff,#ffff00",
  },

  // 7. Monochrome shades - grays
  {
    name: "monochrome-shades",
    description: "Grayscale gradient: light to dark",
    colorSnake: "#ffffff,#cccccc,#999999,#666666,#333333,#000000",
  },

  // 8. Pastel rainbow
  {
    name: "pastel-rainbow",
    description: "Pastel rainbow colors",
    colorSnake: "#ffb3ba,#ffdfba,#ffffba,#baffc9,#bae1ff,#e0bbff",
  },

  // 9. Default single color - testing backward compatibility
  {
    name: "default-single-color",
    description: "Single color (backward compatibility test)",
    colorSnake: "#a855f7",
  },

  // 10. RGBA test with transparency
  {
    name: "rgba-transparency",
    description: "RGBA colors with varying opacity",
    colorSnake: "rgba(168,85,247,1);rgba(168,85,247,0.8);rgba(168,85,247,0.6);rgba(168,85,247,0.4);rgba(168,85,247,0.2)",
  },

  // 11. Rainbow with light theme
  {
    name: "rainbow-light-theme",
    description: "Rainbow segments with github-light palette",
    colorSnake: "#ef4444,#f97316,#eab308,#22c55e,#3b82f6,#8b5cf6",
    palette: "github-light",
  },

  // 12. Fire gradient with light theme
  {
    name: "fire-light-theme",
    description: "Fire gradient with github-light palette",
    colorSnake: "#ff0000,#ff4400,#ff8800,#ffcc00,#ffff00",
    palette: "github-light",
  },

  // 13. Ocean gradient with light theme
  {
    name: "ocean-light-theme",
    description: "Ocean gradient with github-light palette",
    colorSnake: "#1e40af,#3b82f6,#60a5fa,#93c5fd,#dbeafe",
    palette: "github-light",
  },
];

// Import directly from source (like other test files)
const { generateContributionSnake } = await import("../../packages/snake/src/generate-contribution-snake");
const { parseOutputsOption } = await import("../../packages/snake/src/outputs-options");

// Create output directory
const OUTPUT_DIR = path.join(REPO_ROOT, "test-outputs/colorful-snake");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

console.log(`📁 Output directory: ${OUTPUT_DIR}\n`);

// Run tests
let successCount = 0;
let failureCount = 0;

for (const config of COLORFUL_TEST_CONFIGS) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`🧪 Testing: ${config.name}`);
  console.log(`   ${config.description}`);
  console.log(`${"─".repeat(60)}`);

  const outputFile = path.join(OUTPUT_DIR, `${config.name}.svg`);

  try {
    // Parse outputs with color_snake in query parameter
    const palette = config.palette || "github-dark";
    const queryParam = `color_snake=${encodeURIComponent(config.colorSnake)}`;
    const outputs = parseOutputsOption([`${outputFile}?palette=${palette}&${queryParam}`]);

    if (!Array.isArray(outputs) || outputs.length === 0) {
      console.error(`❌ Failed: parseOutputsOption returned invalid outputs`);
      failureCount++;
      continue;
    }

    const results = await generateContributionSnake(
      "diverger",
      outputs,
      { githubToken }
    );

    outputs.forEach((out, i) => {
      const result = results[i];
      if (out?.filename && result) {
        try {
          // Ensure directory exists
          const dir = path.dirname(out.filename);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFileSync(out.filename, result);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.warn(`⚠️  Warning: Failed to write file "${out.filename}": ${errorMessage}`);
        }
      }
    });

    if (fs.existsSync(outputFile)) {
      const stats = fs.statSync(outputFile);
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`✅ Success: ${config.name} (${sizeKB} KB)`);
      console.log(`   Output: ${outputFile}`);
      successCount++;
    } else {
      console.error(`❌ Failed: ${config.name} - File not generated`);
      failureCount++;
    }
  } catch (error) {
    console.error(`❌ Failed: ${config.name}`);
    console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    failureCount++;
  }
}

// Summary
console.log("\n" + "=".repeat(60));
console.log("📊 Test Summary");
console.log("=".repeat(60));
console.log(`✅ Successful: ${successCount}/${COLORFUL_TEST_CONFIGS.length}`);
console.log(`❌ Failed: ${failureCount}/${COLORFUL_TEST_CONFIGS.length}`);
console.log(`📁 Output directory: ${OUTPUT_DIR}`);
console.log("");

if (failureCount > 0) {
  process.exit(1);
}

console.log("🎉 All colorful snake tests passed!");
