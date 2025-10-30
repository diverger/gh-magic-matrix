#!/usr/bin/env bun
/**
 * 🧪 Verify Hide Progress Bar Functionality
 *
 * Tests:
 * 1. Progress bar visible (default)
 * 2. Progress bar hidden (INPUT_HIDE_PROGRESS_BAR = "true")
 *
 * Verification method:
 * - Check if SVG contains progress bar elements (rect with specific classes/attributes)
 * - Progress bar is rendered as colored cells in the snake grid
 */

import * as fs from "fs";
import * as path from "path";

const REPO_ROOT = path.resolve(process.cwd());

function loadGitHubToken(): string {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  const tokenPath = path.join(REPO_ROOT, ".github/token.txt");
  if (fs.existsSync(tokenPath)) {
    const token = fs.readFileSync(tokenPath, "utf-8").trim();
    if (token && !token.includes("your_github_token_here")) return token;
  }
  console.error("❌ Error: GitHub token is required");
  process.exit(1);
}

const githubToken = loadGitHubToken();

console.log("🧪 Verifying Hide Progress Bar Functionality");
console.log("=" .repeat(60));

// Test 1: Progress bar visible
async function testProgressBarVisible() {
  console.log("\n📊 Test 1: Progress bar VISIBLE (default)");

  const OUTPUT_PATH = path.join(REPO_ROOT, "test-outputs/progress-bar-visible.svg");

  process.env.INPUT_GITHUB_USER_NAME = "diverger";
  process.env.INPUT_OUTPUTS = `${OUTPUT_PATH}?palette=github-light&hideProgressBar=false`;
  process.env.INPUT_SHOW_CONTRIBUTION_COUNTER = "true";
  process.env.INPUT_COUNTER_DISPLAYS = JSON.stringify([{
    position: "follow",
    prefix: "{img:0} ",
    suffix: " contributions",
    fontSize: 14,
    images: [{
      urlFolder: ".github/assets/sprite-frames",
      framePattern: "frame-{n}.png",
      width: 60,
      height: 48,
      sprite: {
        mode: "sync",
        framesPerLevel: 14,
        animationSpeed: 1.0
      }
    }]
  }]);
  process.env.GITHUB_TOKEN = githubToken;

  try {
    const { generateContributionSnake } = await import("../../packages/snake/src/generate-contribution-snake");
    const { parseOutputsOption } = await import("../../packages/snake/src/outputs-options");

    const outputs = parseOutputsOption([process.env.INPUT_OUTPUTS || ""]);

    outputs.forEach(output => {
      if (output) {
        output.animationOptions = output.animationOptions || {};
        output.animationOptions.contributionCounter = {
          enabled: true,
          displays: JSON.parse(process.env.INPUT_COUNTER_DISPLAYS || "[]"),
        };
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

    if (fs.existsSync(OUTPUT_PATH)) {
      const svgContent = fs.readFileSync(OUTPUT_PATH, "utf-8");

      // Count colored cells (progress bar is made of colored rectangles)
      const cellMatches = svgContent.match(/<rect[^>]*fill="(?!#161b22)[^"]*"/g) || [];
      const coloredCells = cellMatches.length;

      console.log(`   ✅ Generated: ${OUTPUT_PATH}`);
      console.log(`   📊 Colored cells found: ${coloredCells}`);

      if (coloredCells > 100) {
        console.log(`   ✅ Progress bar is VISIBLE (many colored cells)`);
        return true;
      } else {
        console.log(`   ⚠️  Warning: Expected more colored cells for visible progress bar`);
        return false;
      }
    } else {
      console.log(`   ❌ Failed: File not generated`);
      return false;
    }
  } catch (error: unknown) {
    console.log(`   ❌ Failed: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

// Test 2: Progress bar hidden
async function testProgressBarHidden() {
  console.log("\n🚫 Test 2: Progress bar HIDDEN");

  const OUTPUT_PATH = path.join(REPO_ROOT, "test-outputs/progress-bar-hidden.svg");

  process.env.INPUT_GITHUB_USER_NAME = "diverger";
  process.env.INPUT_OUTPUTS = `${OUTPUT_PATH}?palette=github-light&hideProgressBar=true`;
  process.env.INPUT_SHOW_CONTRIBUTION_COUNTER = "true";
  process.env.INPUT_COUNTER_DISPLAYS = JSON.stringify([{
    position: "follow",
    prefix: "{img:0} ",
    suffix: " contributions",
    fontSize: 14,
    images: [{
      urlFolder: ".github/assets/sprite-frames",
      framePattern: "frame-{n}.png",
      width: 60,
      height: 48,
      sprite: {
        mode: "sync",
        framesPerLevel: 14,
        animationSpeed: 1.0
      }
    }]
  }]);
  process.env.GITHUB_TOKEN = githubToken;

  try {
    const { generateContributionSnake } = await import("../../packages/snake/src/generate-contribution-snake");
    const { parseOutputsOption } = await import("../../packages/snake/src/outputs-options");

    const outputs = parseOutputsOption([process.env.INPUT_OUTPUTS || ""]);

    outputs.forEach(output => {
      if (output) {
        output.animationOptions = output.animationOptions || {};
        output.animationOptions.contributionCounter = {
          enabled: true,
          displays: JSON.parse(process.env.INPUT_COUNTER_DISPLAYS || "[]"),
        };
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

    if (fs.existsSync(OUTPUT_PATH)) {
      const svgContent = fs.readFileSync(OUTPUT_PATH, "utf-8");

      // Count colored cells (should be minimal when progress bar is hidden)
      const cellMatches = svgContent.match(/<rect[^>]*fill="(?!#161b22)[^"]*"/g) || [];
      const coloredCells = cellMatches.length;

      // Check if counter sprite is still present
      const hasCounterSprite = svgContent.includes('xlink:href=') || svgContent.includes('<use ');

      console.log(`   ✅ Generated: ${OUTPUT_PATH}`);
      console.log(`   📊 Colored cells found: ${coloredCells}`);
      console.log(`   🎯 Counter sprite present: ${hasCounterSprite ? 'YES' : 'NO'}`);

      if (coloredCells < 50) {
        console.log(`   ✅ Progress bar is HIDDEN (few/no colored cells)`);
        if (hasCounterSprite) {
          console.log(`   ✅ Counter sprite still works (independent of progress bar)`);
        }
        return true;
      } else {
        console.log(`   ❌ Failed: Progress bar appears to be visible (too many colored cells)`);
        return false;
      }
    } else {
      console.log(`   ❌ Failed: File not generated`);
      return false;
    }
  } catch (error: unknown) {
    console.log(`   ❌ Failed: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

// Run tests
async function runTests() {
  const outputDir = path.join(REPO_ROOT, "test-outputs");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const result1 = await testProgressBarVisible();
  const result2 = await testProgressBarHidden();

  console.log("\n" + "=".repeat(60));
  console.log("\n📊 Test Results:");
  console.log(`   1. Progress bar VISIBLE: ${result1 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   2. Progress bar HIDDEN:  ${result2 ? '✅ PASS' : '❌ FAIL'}`);

  if (result1 && result2) {
    console.log("\n🎉 All tests passed!");
    console.log("\n💡 Tip: Compare the two SVG files to see the difference:");
    console.log("   - test-outputs/progress-bar-visible.svg (with colored grid)");
    console.log("   - test-outputs/progress-bar-hidden.svg (minimal/no colored grid)");
  } else {
    console.log("\n⚠️  Some tests failed");
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error("\n❌ Test suite failed:", error);
  process.exit(1);
});
