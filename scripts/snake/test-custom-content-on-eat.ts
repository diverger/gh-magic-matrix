#!/usr/bin/env bun
/**
 * Test emoji and letter snakes with on-eat color shift mode
 * This test specifically verifies that segments are properly center-aligned
 * when they move in vertical or horizontal lines.
 */

import * as fs from "fs";
import * as path from "path";
import { loadGitHubToken } from "../utils/env-loader";

const REPO_ROOT = path.resolve(process.cwd());
const OUTPUT_DIR = path.join(REPO_ROOT, "test-outputs", "custom-content-on-eat");

async function runTest() {
  console.log("🧪 Testing custom content with on-eat mode alignment\n");

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Load GitHub token
  const githubToken = loadGitHubToken(REPO_ROOT);

  // Dynamically import modules
  const { generateContributionSnake } = await import("../../packages/snake/src/generate-contribution-snake");
  const { parseOutputsOption } = await import("../../packages/snake/src/outputs-options");

  const testCases = [
    {
      name: "emoji-on-eat",
      description: "Emoji snake with on-eat color shift",
      outputPath: path.join(OUTPUT_DIR, "emoji-on-eat.svg"),
      queryParams: [
        "snake_type=emoji",
        "emoji_snake=🔴,🟠,🟡,🟢,🔵",
        "color_snake=#ef4444,#f97316,#eab308,#22c55e,#3b82f6",
        "color_shift_mode=on-eat"
      ]
    },
    {
      name: "letter-on-eat",
      description: "Letter snake (HELLO) with on-eat color shift",
      outputPath: path.join(OUTPUT_DIR, "letter-on-eat.svg"),
      queryParams: [
        "snake_type=letter",
        "letter_snake=H,E,L,L,O",
        "color_snake=#ff0000,#ff7700,#ffff00,#00ff00,#0000ff",
        "color_shift_mode=on-eat"
      ]
    },
    {
      name: "mixed-on-eat",
      description: "Mixed content with on-eat color shift",
      outputPath: path.join(OUTPUT_DIR, "mixed-on-eat.svg"),
      queryParams: [
        "snake_type=mixed",
        "mixed_snake=🐍,A,🟢,B,🔵",
        "color_snake=#8b5cf6,#ec4899,#f97316,#22c55e,#3b82f6",
        "color_shift_mode=on-eat"
      ]
    },
  ];

  let successCount = 0;
  let failCount = 0;

  for (const testCase of testCases) {
    try {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`Test: ${testCase.name}`);
      console.log(`Description: ${testCase.description}`);
      console.log(`Query Params: ${testCase.queryParams.join("&")}`);

      const outputWithParams = `${testCase.outputPath}?${testCase.queryParams.join("&")}`;
      const parsedOutputs = parseOutputsOption([outputWithParams]);

      const results = await generateContributionSnake(
        "diverger",
        parsedOutputs,
        {
          githubToken,
          snakeLength: 4,
        }
      );

      // Write output
      if (results && results[0]) {
        fs.writeFileSync(testCase.outputPath, results[0]);
        const stats = fs.statSync(testCase.outputPath);
        console.log(`✅ Generated: ${testCase.outputPath} (${(stats.size / 1024).toFixed(1)} KB)`);
        successCount++;
      } else {
        console.error(`❌ Failed to generate: ${testCase.outputPath}`);
        failCount++;
      }
    } catch (error) {
      console.error(`❌ Test failed: ${testCase.name}`);
      console.error(error);
      failCount++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("Test Summary");
  console.log("=".repeat(60));
  console.log(`✅ Passed: ${successCount}/${testCases.length}`);
  console.log(`❌ Failed: ${failCount}/${testCases.length}`);
  console.log(`\n📂 Output directory: ${OUTPUT_DIR}`);
  console.log(`\n💡 Tip: Open the SVG files in your browser to verify alignment`);
  console.log(`    Look for segments in vertical/horizontal lines to check centering`);

  if (failCount > 0) {
    process.exit(1);
  }
}

runTest().catch((error) => {
  console.error("\n❌ Test suite failed:");
  console.error(error);
  process.exit(1);
});
