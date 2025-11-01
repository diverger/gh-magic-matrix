#!/usr/bin/env bun
/**
 * 🖼️ Image Snake Test
 *
 * Test using images for the snake animation.
 *
 * Image Sources:
 * - Base64 encoded inline images (works in GitHub README)
 * - External image URLs (may not work in GitHub due to CSP)
 *
 * Run:
 *   bun scripts/snake/test-image-snake.ts
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

console.log("🖼️ Image Snake Test");
console.log("=".repeat(60));

const githubToken = loadGitHubToken();

// Import required functions
const { generateContributionSnake } = await import("../../packages/snake/src/generate-contribution-snake");
const { parseOutputsOption } = await import("../../packages/snake/src/outputs-options");

const OUTPUT_DIR = path.join(REPO_ROOT, "test-outputs", "image-snake");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Small 16x16 colored circle images as base64 (PNG format)
// These are tiny placeholder images for demonstration
const CIRCLE_IMAGES = {
  red: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iOCIgY3k9IjgiIHI9IjciIGZpbGw9IiNmZjAwMDAiLz48L3N2Zz4=",
  orange: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iOCIgY3k9IjgiIHI9IjciIGZpbGw9IiNmZjg4MDAiLz48L3N2Zz4=",
  yellow: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iOCIgY3k9IjgiIHI9IjciIGZpbGw9IiNmZmRkMDAiLz48L3N2Zz4=",
  green: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iOCIgY3k9IjgiIHI9IjciIGZpbGw9IiMwMGZmMDAiLz48L3N2Zz4=",
  blue: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iOCIgY3k9IjgiIHI9IjciIGZpbGw9IiMwMDg4ZmYiLz48L3N2Zz4=",
  purple: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iOCIgY3k9IjgiIHI9IjciIGZpbGw9IiNiYjAwZmYiLz48L3N2Zz4=",
  head: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iMiIgeT0iMiIgd2lkdGg9IjEyIiBoZWlnaHQ9IjEyIiBmaWxsPSIjZmYwMDAwIiByeD0iMyIvPjwvc3ZnPg==",
};

// GitHub avatar URLs (external images - may not work in GitHub README due to CSP)
const GITHUB_AVATARS = [
  "https://avatars.githubusercontent.com/u/1?s=16",
  "https://avatars.githubusercontent.com/u/2?s=16",
  "https://avatars.githubusercontent.com/u/3?s=16",
  "https://avatars.githubusercontent.com/u/4?s=16",
  "https://avatars.githubusercontent.com/u/5?s=16",
];

// Test configurations
const tests = [
  {
    name: "rainbow-circles",
    desc: "Rainbow colored circles (Base64 inline SVG)",
    segments: [
      CIRCLE_IMAGES.head,
      CIRCLE_IMAGES.red,
      CIRCLE_IMAGES.orange,
      CIRCLE_IMAGES.yellow,
      CIRCLE_IMAGES.green,
      CIRCLE_IMAGES.blue,
      CIRCLE_IMAGES.purple,
    ],
  },
  {
    name: "gradient-circles",
    desc: "Gradient circles (Base64, function-based)",
    segments: (i: number) => {
      const colors = [
        CIRCLE_IMAGES.head,
        CIRCLE_IMAGES.red,
        CIRCLE_IMAGES.orange,
        CIRCLE_IMAGES.yellow,
        CIRCLE_IMAGES.green,
        CIRCLE_IMAGES.blue,
      ];
      return colors[i % colors.length];
    },
  },
  {
    name: "external-avatars",
    desc: "GitHub avatars (External URLs - may not work in GitHub)",
    segments: (i: number) => GITHUB_AVATARS[i % GITHUB_AVATARS.length],
  },
];

for (const test of tests) {
  console.log(`\n🧪 Testing: ${test.name}`);
  console.log(`   📝 ${test.desc}`);

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
console.log("🎉 Image snake tests completed!");
console.log(`📁 Output directory: ${OUTPUT_DIR}`);
console.log("");
console.log("📝 Notes:");
console.log("   ✅ Base64 inline images work in GitHub README");
console.log("   ⚠️  External URLs may be blocked by GitHub's CSP policy");
console.log("   💡 Recommended: Use Base64 encoded images for GitHub compatibility");
