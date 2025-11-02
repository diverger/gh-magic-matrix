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
import type { OutputConfig } from "../../packages/snake/src/outputs-options";

// Get the repository root directory (2 levels up from this script)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.join(__dirname, "../../");

/**
 * Type guard to check if an object matches the OutputConfig interface shape
 */
function isOutputConfig(o: any): o is OutputConfig {
  return (
    typeof o === "object" &&
    o !== null &&
    typeof o.filename === "string" &&
    typeof o.format === "string" &&
    typeof o.drawOptions === "object" &&
    typeof o.animationOptions === "object"
  );
}

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
  counterDebug: "false",

  // Display configuration (matching ci.yml exactly)
  counterDisplays: [
    {
      position: "free",
      mode: "level",
      prefix: "{img:0} ",
      suffix: "",
      fontSize: 14,
      // Note: hide_progress_bar is NOT a property of display objects
      // It should be set via INPUT_HIDE_PROGRESS_BAR environment variable
      images: [
        {
          urlFolder: path.join(REPO_ROOT, ".github/assets/the-sage"),  // Absolute path to assets
          framePattern: "*_{n}.png",
          width: 192,
          height: 48,
          anchorY: 0.9,
          anchorX: 0.42,
          textAnchorY: 1.0,
          spacing: 0,
          sprite: {
            contributionLevels: 5,
            framesPerLevel: [14, 8, 4, 8, 8],  // Variable frames per level
            frameWidth: 192,
            frameHeight: 48,
            layout: "horizontal",
            useSpriteSheetPerLevel: true
            // Note: sprite speed is automatically synced with frameDuration (100ms)
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
process.env.INPUT_HIDE_PROGRESS_BAR = "true";  // Hide the progress bar
process.env.INPUT_COUNTER_DISPLAYS = JSON.stringify(config.counterDisplays);
process.env.GITHUB_TOKEN = githubToken;

console.log("⚙️  Configuration:");
console.log(`   User: ${config.githubUserName}`);
console.log(`   Output: ${config.outputPath}`);
console.log(`   Frame Duration: ${config.frameDuration}ms`);
console.log(`   Sprite Mode: level (5 levels)`);
console.log(`   Frames per Level: [11, 12, 12, 12, 12] (L0=11, L1-L4=12)`);
console.log(`   Debug Mode: ${config.counterDebug}`);
console.log("");

// Check if sprite assets exist
console.log("🔍 Checking sprite assets...");
const assetsPath = path.join(REPO_ROOT, ".github/assets/sci-fi-samurai");

// Check if the assets folder exists
if (!fs.existsSync(assetsPath)) {
  console.warn(`⚠️  Warning: Assets folder not found: ${assetsPath}`);
  console.warn("   Creating folder...");
  fs.mkdirSync(assetsPath, { recursive: true });
  console.log("");
}

// Check for sprite sheet files matching the pattern *_{n}.png
// Also support reuse syntax: *_{n}@{ref}.png
// Expected files: sprite_0.png, sprite_1.png, sprite_2@1.png (reuses level 1), etc.
const foundAssets: string[] = [];
const reuseLevels: Map<number, number> = new Map(); // level -> ref_level
const missingLevels: number[] = [];

// First pass: scan for reuse directives
if (fs.existsSync(assetsPath)) {
  const allFiles = fs.readdirSync(assetsPath);
  const reuseRegex = /^.*_(\d+)@(\d+)\.png$/;

  allFiles.forEach(file => {
    const reuseMatch = file.match(reuseRegex);
    if (reuseMatch) {
      const level = parseInt(reuseMatch[1], 10);
      const refLevel = parseInt(reuseMatch[2], 10);
      reuseLevels.set(level, refLevel);
    }
  });
}

// Second pass: check each level
for (let level = 0; level < 5; level++) {
  // Check if this level has a reuse directive
  if (reuseLevels.has(level)) {
    const refLevel = reuseLevels.get(level)!;
    const reuseFiles = fs.existsSync(assetsPath)
      ? fs.readdirSync(assetsPath).filter(f => {
          const match = f.match(new RegExp(`^.*_${level}@${refLevel}\\.png$`));
          return match !== null;
        })
      : [];

    if (reuseFiles.length > 0) {
      reuseFiles.forEach(file => {
        const filePath = path.join(assetsPath, file);
        const stats = fs.statSync(filePath);
        console.log(`   ♻️  Level ${level}: ${file} (reuses Level ${refLevel}) (${(stats.size / 1024).toFixed(1)} KB)`);
        foundAssets.push(file);
      });
      continue; // Skip regular file check for this level
    }
  }

  // Find all files matching pattern *_{level}.png (excluding reuse files)
  const files = fs.existsSync(assetsPath)
    ? fs.readdirSync(assetsPath).filter(f => {
        // Match *_{level}.png but not *_{level}@*.png
        const match = f.match(new RegExp(`^.*_${level}\\.png$`));
        const hasReuse = f.includes('@');
        return match !== null && !hasReuse;
      })
    : [];

  if (files.length > 0) {
    // Found files for this level
    files.forEach(file => {
      const filePath = path.join(assetsPath, file);
      const stats = fs.statSync(filePath);
      console.log(`   ✅ Level ${level}: ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
      foundAssets.push(file);
    });
  } else {
    console.log(`   ❌ Level ${level}: No files matching *_${level}.png or *_${level}@*.png`);
    missingLevels.push(level);
  }
}
console.log("");

if (missingLevels.length > 0) {
  console.warn("⚠️  Warning: Some sprite levels are missing:");
  console.warn(`   Missing levels: ${missingLevels.join(', ')}`);
  console.warn(`   Expected pattern: *_{n}.png (e.g., sprite_0.png, char_1.png)`);
  console.warn(`   Or reuse syntax: *_{n}@{ref}.png (e.g., sprite_2@1.png reuses level 1)`);
  console.warn("   The script will continue, but sprites may not render correctly.");
  console.log("");
} else {
  console.log(`✅ Found ${foundAssets.length} sprite sheet(s) for 5 levels`);
  if (reuseLevels.size > 0) {
    console.log(`   Including ${reuseLevels.size} reuse directive(s): ${Array.from(reuseLevels.entries()).map(([l, r]) => `L${l}→L${r}`).join(', ')}`);
  }
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
        if (!isOutputConfig(o)) return;
        // Ensure animationOptions exists and set frameDuration
        o.animationOptions = o.animationOptions || {};
        o.animationOptions.frameDuration = fd;
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
        throw new Error(`Failed to parse INPUT_COUNTER_DISPLAYS: ${e}`);
      }
    }

    if (showContributionCounter) {
      if (counterDisplays && counterDisplays.length > 0) {
        console.log(`📊 Contribution counter enabled with ${counterDisplays.length} display(s)`);
        if (counterDebug) {
          console.log(`🐛 Debug mode enabled for contribution counter`);
        }

        outputs.forEach(output => {
          if (output && isOutputConfig(output)) {
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
          if (output && isOutputConfig(output)) {
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
      if (out?.filename && result && typeof result === 'string' && result.length > 0) {
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
