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

const REPO_ROOT = path.resolve(process.cwd());

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

console.log("🔤 Quick Letter Snake Test");
console.log("=".repeat(60));

const githubToken = loadGitHubToken();

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
      output.drawOptions.useEmojiSnake = true;
      output.drawOptions.emojiSnakeConfig = {
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
