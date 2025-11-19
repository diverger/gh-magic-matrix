#!/usr/bin/env bun
/**
 * Test on-eat mode alignment when all segments are in a vertical/horizontal line
 */

import * as fs from "fs";
import * as path from "path";
import { loadGitHubToken } from "../utils/env-loader";

const REPO_ROOT = path.resolve(process.cwd());
const OUTPUT_DIR = path.join(REPO_ROOT, "test-outputs", "on-eat-alignment");

async function runTest() {
  console.log("🧪 Testing on-eat mode alignment issue\n");

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
      name: "emoji-vertical-line",
      description: "Emoji snake moving in vertical line (on-eat mode)",
      outputs: "dist/on-eat-emoji-vertical.svg",
      queryParams: [
        "color_snake=orange,yellow,green,blue",
        "color_shift_mode=on-eat",
        "snake_type=emoji",
        "emoji_snake=🔴,🟠,🟡,🟢,🟦"
      ]
    },
    {
      name: "letter-horizontal-line",
      description: "Letter snake moving in horizontal line (on-eat mode)",
      outputs: "dist/on-eat-letter-horizontal.svg",
      queryParams: [
        "color_snake=orange,yellow,green,blue",
        "color_shift_mode=on-eat",
        "snake_type=letter",
        "letter_snake=A,B,C,D,E"
      ]
    },
    {
      name: "rect-vertical-line",
      description: "Rectangle snake moving in vertical line (on-eat mode)",
      outputs: "dist/on-eat-rect-vertical.svg",
      queryParams: [
        "color_snake=#ef4444,#f97316,#eab308,#22c55e,#3b82f6",
        "color_shift_mode=on-eat"
      ]
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`Test: ${testCase.name}`);
      console.log(`Description: ${testCase.description}`);
      console.log(`Query Params: ${testCase.queryParams.join("&")}`);

      const outputPath = path.join(REPO_ROOT, testCase.outputs);
      const outputWithParams = `${outputPath}?${testCase.queryParams.join("&")}`;
      const parsedOutputs = parseOutputsOption([outputWithParams]);

      const results = await generateContributionSnake(
        "diverger",
        parsedOutputs,
        {
          githubToken,
          snakeLength: 5,  // Short snake for testing
        }
      );

      // Write output
      if (results && results[0]) {
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(outputPath, results[0]);
      }

      if (fs.existsSync(outputPath)) {
        const stats = fs.statSync(outputPath);
        console.log(`✅ Generated: ${outputPath} (${stats.size} bytes)`);
      } else {
        console.error(`❌ Failed to generate: ${outputPath}`);
      }
    } catch (error) {
      console.error(`❌ Test failed: ${testCase.name}`);
      console.error(error);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Test complete! Check the generated SVGs in dist/");
}

runTest().catch(console.error);
