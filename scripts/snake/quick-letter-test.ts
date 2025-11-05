#!/usr/bin/env bun
/**
 * 🔤 Quick Letter Snake Test
 *
 * Quick test for letter/character snake rendering.
 *
 * Run: bun scripts/snake/quick-letter-test.ts
 */

import * as fs from "fs";
import * as path from "path";
import { loadGitHubToken } from "../utils/env-loader";

const REPO_ROOT = path.resolve(process.cwd());

console.log("🔤 Quick Letter Snake Test");
console.log("=".repeat(60));

const githubToken = loadGitHubToken(REPO_ROOT);

// Import required functions
const { generateContributionSnake } = await import("../../packages/snake/src/generate-contribution-snake");
const { parseOutputsOption } = await import("../../packages/snake/src/outputs-options");

const OUTPUT_DIR = path.join(REPO_ROOT, "test-outputs", "letter-snake");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Test configurations
const tests = [
  { name: "snake-word", desc: "SNAKE", segments: ['S', 'N', 'A', 'K', 'E'] },
  { name: "code-word", desc: "CODE", segments: ['C', 'O', 'D', 'E'] },
  { name: "alphabet", desc: "A-Z", segments: (i: number) => String.fromCharCode(65 + (i % 26)) },
  { name: "numbers", desc: "0-9", segments: (i: number) => String(i % 10) },
  { name: "greek", desc: "Greek", segments: ['α', 'β', 'γ', 'δ', 'ε'] },
];

for (const test of tests) {
  console.log(`\n🧪 Testing: ${test.name} (${test.desc})`);

  const outputPath = path.join(OUTPUT_DIR, `${test.name}.svg`);

  // Set environment variable
  process.env.INPUT_OUTPUTS = outputPath;

  const outputs = parseOutputsOption([outputPath]);

  // Apply configuration
  outputs.forEach(output => {
    if (output && output.drawOptions) {
      output.drawOptions.useCustomSnake = true;
      output.drawOptions.customSnakeConfig = {
        segments: test.segments,
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
      const stats = fs.statSync(out.filename);
      console.log(`   ✅ Generated: ${(stats.size / 1024).toFixed(1)} KB`);
      console.log(`   📄 ${out.filename}`);
    }
  });
}

console.log("\n" + "=".repeat(60));
console.log("🎉 Letter snake tests completed!");
console.log(`📁 Output directory: ${OUTPUT_DIR}`);
