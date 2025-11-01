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
 *
 * Use token from file
 * bun scripts/snake/verify-hide-progress-bar.ts
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

/**
 * Test progress bar visibility with configurable hideProgressBar setting.
 *
 * @param hideProgressBar - Whether to hide the progress bar
 * @param outputFilename - Name of the output SVG file
 * @returns Promise resolving to true if test passes, false otherwise
 */
async function testProgressBar(
  hideProgressBar: boolean,
  outputFilename: string
): Promise<boolean> {
  const testName = hideProgressBar ? "HIDDEN" : "VISIBLE";
  console.log(`\n${hideProgressBar ? '🚫' : '📊'} Test: Progress bar ${testName}`);

  const OUTPUT_PATH = path.join(REPO_ROOT, `test-outputs/${outputFilename}`);

  process.env.INPUT_GITHUB_USER_NAME = "diverger";
  process.env.INPUT_OUTPUTS = `${OUTPUT_PATH}?palette=github-light&hideProgressBar=${hideProgressBar}`;
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
        // Preserve hideProgressBar from URL params when setting up counter
        const urlHideProgressBar = output.animationOptions.contributionCounter?.hideProgressBar;

        // Validate and coerce hideProgressBar value
        const hideProgressBar =
          typeof urlHideProgressBar === 'boolean' ? urlHideProgressBar :
          urlHideProgressBar === 'true' ? true :
          urlHideProgressBar === 'false' ? false :
          urlHideProgressBar !== undefined ? (console.warn(`⚠️  Invalid hideProgressBar value: ${urlHideProgressBar} (expected boolean or "true"/"false"). Setting to false.`), false) :
          false;

        output.animationOptions.contributionCounter = {
          enabled: true,
          displays: JSON.parse(process.env.INPUT_COUNTER_DISPLAYS || "[]"),
          hideProgressBar: hideProgressBar,
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
      console.log(`   ✅ Generated: ${OUTPUT_PATH}`);

      // Check counter sprite (for hidden case)
      if (hideProgressBar) {
        const hasCounterSprite = svgContent.includes('xlink:href=') || svgContent.includes('<use ');
        console.log(`   🎯 Counter sprite present: ${hasCounterSprite ? 'YES' : 'NO'}`);
      }

      // Detect progress bar visibility by checking CSS styles
      // Progress bar elements have class="u" and are hidden via opacity: 0
      // Regex matches various zero opacity formats:
      // - Basic: 0, 0.0, .0
      // - Signed: +0, -0, +0.0, -0.0
      // - Percentage: 0%, 0.0%, .0%, +0%, -0%
      const progressBarHidden = /\.u\s*\{[^}]*opacity:\s*[+-]?(?:0(?:\.\d*)?|\.\d+)%?(?:[;\s}]|$)/i.test(svgContent);

      console.log(`   📊 Progress bar CSS opacity check: ${progressBarHidden ? 'opacity: 0 (HIDDEN)' : 'visible (VISIBLE)'}`);

      const testPassed = progressBarHidden === hideProgressBar;

      if (testPassed) {
        console.log(`   ✅ Progress bar is ${testName} as expected`);
        if (hideProgressBar && svgContent.includes('xlink:href=')) {
          console.log(`   ✅ Counter sprite still works (independent of progress bar)`);
        }
      } else {
        console.log(`   ❌ Failed: Progress bar state mismatch (expected ${testName})`);
      }

      return testPassed;
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

  const result1 = await testProgressBar(false, "progress-bar-visible.svg");
  const result2 = await testProgressBar(true, "progress-bar-hidden.svg");

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
