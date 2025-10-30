#!/usr/bin/env bun
/**
 * Local test script for sync-mode multi-frame PNG sprite
 * Usage: bun scripts/snake/test-multi-sprite-files-sync.ts
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

console.log("🐍 Sync Multi-PNG Sprite Local Test");
console.log("==========================================");
console.log("📝 GitHub Token: [masked]");
console.log(`👤 Test User: diverger`);
console.log("");

// Configuration
const OUTPUT_PATH = path.join(REPO_ROOT, "test-outputs/multi-sprite-files-sync.svg");
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
          mode: "sync",
          framesPerLevel: 14,         // FIXED: Use framesPerLevel instead of frames
          animationSpeed: 1.0         // 1.0 = smooth, no frame skipping
        }
      }
    ]
  }
];

// Set environment variables (as the GitHub Action would)
process.env.INPUT_GITHUB_USER_NAME = "diverger";
process.env.INPUT_OUTPUTS = `${OUTPUT_PATH}?palette=github-light&frame_duration=50`;  // 50ms每帧（默认100ms）
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
console.log("🚀 Generating snake SVG with sync-mode multi-frame PNG sprite...");
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
        console.log(`💾 Written: ${out.filename}`);
      }
    });

    console.log("");
    console.log("✅ SVG generation completed!");
    console.log("");

    // Verify output
    if (fs.existsSync(OUTPUT_PATH)) {
      const stats = fs.statSync(OUTPUT_PATH);
      const sizeKB = (stats.size / 1024).toFixed(1);

      console.log("📊 Output File:");
      console.log(`   Path: ${OUTPUT_PATH}`);
      console.log(`   Size: ${sizeKB} KB`);

      // Read and analyze the SVG
      const svgContent = fs.readFileSync(OUTPUT_PATH, "utf8");
      const hasImages = svgContent.includes("<image");
      const hasSymbols = svgContent.includes("<symbol");
      const hasDataURIs = svgContent.includes("data:image");
      const hasCounter = svgContent.includes("contrib-counter");

      console.log("");
      console.log("🔍 SVG Analysis:");
      console.log(`   ${hasImages ? "✅" : "❌"} Image elements found`);
      console.log(`   ${hasSymbols ? "✅" : "❌"} Symbol definitions found`);
      console.log(`   ${hasDataURIs ? "✅" : "❌"} Data URIs embedded`);
      console.log(`   ${hasCounter ? "✅" : "❌"} Contribution counter found`);

      console.log("");
      console.log("🎉 Test completed successfully!");
      console.log("");
      console.log("💡 Next steps:");
      console.log(`   1. Open ${OUTPUT_PATH} in a browser`);
      console.log("   2. Verify the sprite animation syncs with snake progress");
      console.log("   3. Check that all 14 PNG frames are used in the animation");
    } else {
      console.error("❌ Error: Output file was not created");
      process.exit(1);
    }
  } catch (error: unknown) {
    console.error("");
    console.error("❌ Error generating SVG:");
    console.error(error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error("");
      console.error("Stack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

runTest();