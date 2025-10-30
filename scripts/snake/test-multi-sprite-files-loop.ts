#!/usr/bin/env bun
/**
 * Local test script for loop-mode multi-frame PNG sprite
 * In loop mode, sprite animates continuously independent of snake movement
 * Usage: bun scripts/snake/test-multi-sprite-files-loop.ts
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// Get repo root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../..");

// Load GitHub token (same logic as test-multi-sprite-local.ts)
function loadGitHubToken(): string {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  const tokenPath = path.join(REPO_ROOT, ".github/token.txt");
  if (fs.existsSync(tokenPath)) {
    const token = fs.readFileSync(tokenPath, "utf8").trim();
    if (token && !token.includes("your_github_token_here")) return token;
  }
  console.error("❌ Error: GitHub token is required");
  process.exit(1);
}
const githubToken = loadGitHubToken();

console.log("🐍 Loop Multi-PNG Sprite Local Test");
console.log("==========================================");
console.log("📝 GitHub Token: [masked]");
console.log(`👤 Test User: diverger`);
console.log("");

// Configuration
const OUTPUT_PATH = path.join(REPO_ROOT, "test-outputs/multi-sprite-files-loop.svg");
const SPRITE_FOLDER = path.join(REPO_ROOT, ".github/assets/sprite-frames");

const counterDisplays = [
  {
    position: "follow",
    prefix: "{img:0}",  // Reference the first image
    suffix: " contributions",
    images: [
      {
        urlFolder: SPRITE_FOLDER,
        framePattern: "frame-{n}.png", // n = 0 to 13
        width: 60,
        height: 48,
        sprite: {
          mode: "loop",
          framesPerLevel: 14,  // 14 frames total
          frameDuration: 50  // Each sprite frame shows for 50ms (independent of snake)
        }
      }
    ]
  }
];

// Set environment variables (as the GitHub Action would)
process.env.INPUT_GITHUB_USER_NAME = "diverger";
process.env.INPUT_OUTPUTS = `${OUTPUT_PATH}?palette=github-light&frame_duration=100`;  // Snake at normal speed (100ms per grid)
process.env.INPUT_SHOW_CONTRIBUTION_COUNTER = "true";
process.env.INPUT_HIDE_PROGRESS_BAR = "true";  // Hide the progress bar
process.env.INPUT_COUNTER_DEBUG = "true";  // Enable debug mode
process.env.INPUT_COUNTER_DISPLAYS = JSON.stringify(counterDisplays);
process.env.GITHUB_TOKEN = githubToken;

// Create output directory
const outputDir = path.dirname(OUTPUT_PATH);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`📁 Created output directory: ${outputDir}`);
}

// Run the snake action
console.log("🚀 Generating snake SVG with loop-mode multi-frame PNG sprite...");
console.log("⚡ Snake speed: 100ms per grid (normal)");
console.log("🎬 Sprite speed: 50ms per frame (fast, smooth animation)");
console.log("");
console.log("🔍 Debug: counterDisplays =", JSON.stringify(counterDisplays, null, 2));
console.log("");

async function runTest() {
  try {
    const { generateContributionSnake } = await import("../../packages/snake/src/generate-contribution-snake");
    const { parseOutputsOption } = await import("../../packages/snake/src/outputs-options");

    const outputs = parseOutputsOption([process.env.INPUT_OUTPUTS || ""]);

    // Apply contribution counter config
    outputs.forEach(output => {
      if (output) {
        output.animationOptions = output.animationOptions || {};
        output.animationOptions.contributionCounter = {
          enabled: true,
          displays: counterDisplays,
          debug: true,  // Enable debug logging
        };
        console.log("🔍 Debug: output.animationOptions.contributionCounter =", JSON.stringify(output.animationOptions.contributionCounter, null, 2));
      }
    });

    const results = await generateContributionSnake(
      "diverger",
      outputs,
      { githubToken }
    );

    outputs.forEach((out, i) => {
      const result = results[i];
      if (out?.filename && result) {
        fs.writeFileSync(out.filename, result);
      }
    });

    console.log("");
    console.log("✅ Snake generation completed successfully");

    // Verify output
    if (fs.existsSync(OUTPUT_PATH)) {
      const stats = fs.statSync(OUTPUT_PATH);
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`💾 Written: ${OUTPUT_PATH}`);
      console.log(`   Size: ${sizeKB} KB`);

      // Check SVG content
      const svgContent = fs.readFileSync(OUTPUT_PATH, "utf8");
      const hasImageElements = svgContent.includes("<image");
      const hasDataURI = svgContent.includes("data:image/png;base64,");
      const hasCounter = svgContent.includes("contribution");

      if (hasImageElements) {
        console.log("   ✅ Image elements found");
      } else {
        console.log("   ⚠️  No image elements found");
      }

      if (hasDataURI) {
        console.log("   ✅ Data URIs embedded");
      } else {
        console.log("   ⚠️  No data URIs found");
      }

      if (hasCounter) {
        console.log("   ✅ Contribution counter found");
      }

      console.log("");
      console.log("🎉 Test completed successfully!");
      console.log("");
      console.log("💡 Loop mode features:");
      console.log("   - Sprite animates continuously at 50ms/frame");
      console.log("   - Snake moves at normal speed (100ms/grid)");
      console.log("   - No frame skipping - smooth 14-frame animation");
      console.log("   - Independent speeds for snake and sprite");
    } else {
      console.error("❌ Output file not created");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

runTest();
