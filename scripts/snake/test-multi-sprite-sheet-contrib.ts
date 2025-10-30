#!/usr/bin/env bun
/**
 * Local test script for multi-level sprite sheets
 *
 * This script tests the level sprite animation mode with real GitHub data.
 * It mimics the CI workflow's "Generate snake with multi-level sprite sheets" step.
 *
 * Setup:
 *   1. Copy .github/token.txt.example to .github/token.txt
 *   2. Replace the placeholder with your GitHub token
 *
 * Usage:
 *   bun scripts/snake/test-multi-sprite-sheet-contrib.ts
 *
 * Example:
 *   # Use token from file
 *   bun scripts/snake/test-multi-sprite-sheet-contrib.ts
 *
 * Run from repository root:
 *   cd gh-magic-matrix
 *   bun scripts/snake/test-multi-sprite-sheet-contrib.ts
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// Get the repository root directory (2 levels up from this script)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../..");

/**
 * Load GitHub token from file or environment
 */
function loadGitHubToken(): string {
  // 1. Check environment variable (preferred)
  if (process.env.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN;
  }

  // 2. Try to load from .github/token.txt
  const tokenPath = path.join(REPO_ROOT, ".github/token.txt");
  if (fs.existsSync(tokenPath)) {
    const token = fs.readFileSync(tokenPath, "utf8").trim();
    if (token && !token.includes("your_github_token_here")) {
      return token;
    }
  }

  // 3. No token found
  console.error("❌ Error: GitHub token is required");
  console.error("");
  console.error("Please provide a token in one of these ways:");
  console.error("  1. Environment: export GITHUB_TOKEN=ghp_xxxxx");
  console.error("  2. File: Create .github/token.txt with your token");
  console.error("");
  console.error("To create token file:");
  console.error("  cp .github/token.txt.example .github/token.txt");
  console.error("  # Edit .github/token.txt and replace with your token");
  process.exit(1);
}

const githubToken = loadGitHubToken();

console.log("🐍 Multi-Level Sprite Sheets Local Test");
console.log("==========================================");
console.log("📝 GitHub Token: [masked]");
console.log(`👤 Test User: diverger`);
console.log("");

// Configuration matching ci.yml
const config = {
  // User and output
  githubUserName: "diverger",
  outputPath: path.join(REPO_ROOT, "test-outputs/multi-sprite-sheet-contrib.svg"),  // Absolute path to output

  // Animation settings
  frameDuration: "100",

  // Contribution counter settings
  showContributionCounter: "true",
  counterDebug: "true",

  // Display configuration (matching ci.yml exactly)
  counterDisplays: [
    {
      position: "follow",
      prefix: "{img:0} ",
      suffix: "",
      fontSize: 14,
      images: [
        {
          urlFolder: path.join(REPO_ROOT, ".github/assets"),  // Absolute path to assets
          framePattern: "Lx.png",
          width: 64,
          height: 86,
          anchorY: 0.6875,
          anchorX: 0.3,
          textAnchorY: 1.0,
          spacing: 0,
          sprite: {
            mode: "level",
            contributionLevels: 5,
            framesPerLevel: 8,
            frameWidth: 48,
            frameHeight: 64,
            layout: "horizontal",
            useSpriteSheetPerLevel: true
          }
        }
      ]
    }
  ]
};

// Set environment variables (as the GitHub Action would)
process.env.INPUT_GITHUB_USER_NAME = config.githubUserName;
process.env.INPUT_OUTPUTS = `${config.outputPath}?palette=github-light`;
process.env.INPUT_FRAME_DURATION = config.frameDuration;
process.env.INPUT_SHOW_CONTRIBUTION_COUNTER = config.showContributionCounter;
process.env.INPUT_COUNTER_DEBUG = config.counterDebug;
process.env.INPUT_COUNTER_DISPLAYS = JSON.stringify(config.counterDisplays);
process.env.GITHUB_TOKEN = githubToken;

console.log("⚙️  Configuration:");
console.log(`   User: ${config.githubUserName}`);
console.log(`   Output: ${config.outputPath}`);
console.log(`   Frame Duration: ${config.frameDuration}ms`);
console.log(`   Sprite Mode: level (5 levels)`);
console.log(`   Frames per Level: 8`);
console.log(`   Debug Mode: ${config.counterDebug}`);
console.log("");

// Check if sprite assets exist
console.log("🔍 Checking sprite assets...");
const assetsPath = path.join(REPO_ROOT, ".github/assets");
const requiredAssets = ["L0.png", "L1.png", "L2.png", "L3.png", "L4.png"];
const missingAssets: string[] = [];

for (const asset of requiredAssets) {
  const assetPath = path.join(assetsPath, asset);
  if (fs.existsSync(assetPath)) {
    const stats = fs.statSync(assetPath);
    console.log(`   ✅ ${asset} (${(stats.size / 1024).toFixed(1)} KB)`);
  } else {
    console.log(`   ❌ ${asset} (missing)`);
    missingAssets.push(asset);
  }
}
console.log("");

if (missingAssets.length > 0) {
  console.warn("⚠️  Warning: Some sprite assets are missing:");
  missingAssets.forEach(asset => console.warn(`   - ${asset}`));
  console.warn("   The script will continue, but sprites may not render correctly.");
  console.log("");
}

// Create output directory
const outputDir = path.dirname(config.outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`📁 Created output directory: ${outputDir}`);
}

// Run the snake action
console.log("🚀 Generating snake SVG with multi-level sprites...");
console.log("");

async function runTest() {
  try {
    // Import the action logic directly
    const { generateContributionSnake } = await import("../../packages/snake/src/generate-contribution-snake");
    const { parseOutputsOption } = await import("../../packages/snake/src/outputs-options");

    // Parse outputs (same as the action does)
    const outputs = parseOutputsOption([process.env.INPUT_OUTPUTS || ""]);

    // Ensure frameDuration is applied when running locally (index.ts is not used here)
    const fd = Number(process.env.INPUT_FRAME_DURATION || "0");
    if (Number.isFinite(fd) && fd > 0) {
      outputs.forEach(o => {
        if (!o) return;
        // Ensure animationOptions exists and set frameDuration
        const output = o as any;
        output.animationOptions = output.animationOptions || {};
        output.animationOptions.frameDuration = fd;
      });
    }

    // Apply contribution counter configuration (matching index.ts logic)
    const showContributionCounter = process.env.INPUT_SHOW_CONTRIBUTION_COUNTER === "true";
    const hideProgressBar = process.env.INPUT_HIDE_PROGRESS_BAR === "true";
    const counterDebug = process.env.INPUT_COUNTER_DEBUG === "true";

    let counterDisplays: any[] | undefined;
    if (process.env.INPUT_COUNTER_DISPLAYS) {
      try {
        counterDisplays = JSON.parse(process.env.INPUT_COUNTER_DISPLAYS);
      } catch (e) {
        console.warn(`⚠️  Failed to parse INPUT_COUNTER_DISPLAYS: ${e}`);
      }
    }

    if (showContributionCounter) {
      if (counterDisplays && counterDisplays.length > 0) {
        console.log(`📊 Contribution counter enabled with ${counterDisplays.length} display(s)`);
        if (counterDebug) {
          console.log(`🐛 Debug mode enabled for contribution counter`);
        }

        outputs.forEach(output => {
          if (output) {
            output.animationOptions.contributionCounter = {
              enabled: true,
              displays: counterDisplays,
              hideProgressBar,
              debug: counterDebug,
            };
          }
        });
      } else {
        console.log(`📊 Contribution counter enabled (no displays, progress bar only)`);

        outputs.forEach(output => {
          if (output) {
            output.animationOptions.contributionCounter = {
              enabled: true,
              hideProgressBar,
              debug: counterDebug,
            };
          }
        });
      }
    }

    // Generate the snake
    const results = await generateContributionSnake(
      config.githubUserName,
      outputs,
      { githubToken }
    );

    // Write results to file
    outputs.forEach((out, i) => {
      const result = results[i];
      if (out?.filename && result) {
        console.log(`💾 Writing to ${out.filename}`);
        fs.writeFileSync(out.filename, result);
      }
    });

    console.log("");
    console.log("✅ SVG generation completed!");
    console.log("");

    // Verify output
    if (fs.existsSync(config.outputPath)) {
      const stats = fs.statSync(config.outputPath);
      const sizeKB = (stats.size / 1024).toFixed(1);

      console.log("📊 Output File:");
      console.log(`   Path: ${config.outputPath}`);
      console.log(`   Size: ${sizeKB} KB`);

      // Read and analyze the SVG
      const svgContent = fs.readFileSync(config.outputPath, "utf8");

      // Check for sprite elements
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

      // Count sprite frames
      const symbolMatches = svgContent.match(/<symbol id="sprite-/g);
      if (symbolMatches) {
        console.log(`   📋 Sprite frames: ${symbolMatches.length}`);
      }

      // Count animation classes
      const snakeSegments = svgContent.match(/snake-segment-\d+/g);
      if (snakeSegments) {
        const uniqueSegments = new Set(snakeSegments);
        console.log(`   🐍 Snake segments: ${uniqueSegments.size}`);
      }

      console.log("");
      console.log("🎉 Test completed successfully!");
      console.log("");
      console.log("💡 Next steps:");
      console.log(`   1. Open ${config.outputPath} in a browser`);
      console.log("   2. Verify the sprite animations change based on contribution levels");
      console.log("   3. Check that L0 (empty cells) shows different animation than L1-L4");

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

// Run the test
runTest();
