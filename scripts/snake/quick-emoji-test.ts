#!/usr/bin/env bun
/**
 * 🚀 Quick Emoji Snake Test
 *
 * Quick test for a single emoji configuration.
 * Modify the config below and run to see results instantly.
 *
 * Usage:
 *   bun scripts/snake/quick-emoji-test.ts
 *
 * Output:
 *   test-outputs/emoji-snake/quick-test.svg
 */

import * as fs from "fs";
import * as path from "path";
import { loadGitHubToken } from "../utils/env-loader";

const REPO_ROOT = path.resolve(process.cwd());

// ============================================================
// 🎨 CUSTOMIZE YOUR EMOJI CONFIG HERE!
// ============================================================

const EMOJI_CONFIG = {
  // Set to true to use emoji, false for traditional rectangles
  useEmoji: true,

  // Choose one of these configurations:

  // Option 1: Array of emojis (uncomment to use)
  segments: ['🐍', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣'],

  // Option 2: Function-based (uncomment to use instead of array)
  // segments: (index: number, total: number) => {
  //   if (index === 0) return '🐍';
  //   const emojis = ['⭐', '✨', '💫', '🌟'];
  //   return emojis[index % emojis.length];
  // },

  // Default content for segments not specified
  defaultContent: '🟢',
};

// ============================================================
// Run the test
// ============================================================

async function quickTest() {
  console.log("🚀 Quick Emoji Snake Test");
  console.log("=".repeat(60));

  const githubToken = loadGitHubToken(REPO_ROOT);
  const OUTPUT_PATH = path.join(REPO_ROOT, "test-outputs", "emoji-snake", "quick-test.svg");

  console.log(`\n📝 Configuration:`);
  console.log(`   Use Emoji: ${EMOJI_CONFIG.useEmoji}`);
  if (EMOJI_CONFIG.useEmoji) {
    if (Array.isArray(EMOJI_CONFIG.segments)) {
      console.log(`   Segments: [${EMOJI_CONFIG.segments.join(', ')}]`);
    } else if (typeof EMOJI_CONFIG.segments === 'function') {
      console.log(`   Segments: <function>`);
    }
    console.log(`   Default: ${EMOJI_CONFIG.defaultContent}`);
  }
  console.log(`\n💾 Output: ${OUTPUT_PATH}`);
  console.log(`\n⏳ Generating...`);

  // Configure environment
  process.env.INPUT_GITHUB_USER_NAME = "diverger";
  process.env.INPUT_OUTPUTS = `${OUTPUT_PATH}?palette=github-light`;
  process.env.GITHUB_TOKEN = githubToken;

  try {
    const { generateContributionSnake } = await import("../../packages/snake/src/generate-contribution-snake");
    const { parseOutputsOption } = await import("../../packages/snake/src/outputs-options");

    const outputs = parseOutputsOption([process.env.INPUT_OUTPUTS || ""]);

    if (!Array.isArray(outputs) || outputs.length === 0) {
      console.error("❌ Failed to parse outputs");
      process.exit(1);
    }

    // Apply emoji configuration
    outputs.forEach(output => {
      if (output && output.drawOptions) {
        output.drawOptions.useCustomSnake = EMOJI_CONFIG.useEmoji;
        if (EMOJI_CONFIG.useEmoji) {
          output.drawOptions.customSnakeConfig = {
            segments: EMOJI_CONFIG.segments,
            defaultContent: EMOJI_CONFIG.defaultContent,
          };
        }
      }
    });

    const results = await generateContributionSnake(
      "diverger",
      outputs,
      { githubToken }
    );

    // Save results
    outputs.forEach((out, i) => {
      const result = results[i];
      if (out?.filename && result) {
        const dir = path.dirname(out.filename);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(out.filename, result);
      }
    });

    if (fs.existsSync(OUTPUT_PATH)) {
      const stats = fs.statSync(OUTPUT_PATH);
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`\n✅ Success!`);
      console.log(`   📊 Size: ${sizeKB} KB`);
      console.log(`   📄 File: ${OUTPUT_PATH}`);
      console.log(`\n💡 Open the SVG file in your browser to view the animation!`);
      process.exit(0);
    } else {
      console.error(`\n❌ Failed: File not generated`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

quickTest();
