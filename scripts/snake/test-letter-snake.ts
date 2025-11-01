#!/usr/bin/env bun
/**
 * 🔤 Letter Snake Test
 *
 * Test using letters/characters for the snake animation.
 *
 * Examples:
 * - ASCII snake: S-N-A-K-E
 * - Programming: C-O-D-E
 * - Math symbols: ∑-∫-∂-∇
 * - Greek letters: α-β-γ-δ
 *
 * Run:
 *   bun scripts/snake/test-letter-snake.ts
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

console.log("🔤 Testing Letter Snake Configurations");
console.log("=".repeat(60));
console.log("");

const githubToken = loadGitHubToken();

const OUTPUT_DIR = path.join(REPO_ROOT, "test-outputs", "letter-snake");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Import required functions
const { generateContributionSnake } = await import("../../packages/snake/src/generate-contribution-snake");
const { parseOutputsOption } = await import("../../packages/snake/src/outputs-options");

// Test configurations
const LETTER_CONFIGS = [
  {
    name: "snake-word",
    description: "The word 'SNAKE'",
    segments: ['S', 'N', 'A', 'K', 'E'],
  },
  {
    name: "code-word",
    description: "The word 'CODE'",
    segments: ['C', 'O', 'D', 'E'],
  },
  {
    name: "alphabet",
    description: "Alphabet sequence (A-Z)",
    segments: (i: number) => String.fromCharCode(65 + (i % 26)), // A-Z循环
  },
  {
    name: "numbers",
    description: "Number sequence (0-9)",
    segments: (i: number) => String(i % 10),
  },
  {
    name: "greek-letters",
    description: "Greek letters (α, β, γ, δ, ε, ζ)",
    segments: ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ'],
  },
  {
    name: "math-symbols",
    description: "Mathematical symbols",
    segments: ['∑', '∫', '∂', '∇', '∆', '∞', '≈', '≠'],
  },
  {
    name: "arrows",
    description: "Arrow symbols",
    segments: ['➤', '→', '⇒', '⟹', '↗', '↘', '↙', '↖'],
  },
  {
    name: "playing-cards",
    description: "Playing card symbols",
    segments: ['♠', '♥', '♦', '♣', 'A', 'K', 'Q', 'J'],
  },
  {
    name: "music-notes",
    description: "Musical notes",
    segments: ['♩', '♪', '♫', '♬', '♭', '♮', '♯', '𝄞'],
  },
  {
    name: "binary",
    description: "Binary digits (0 and 1)",
    segments: (i: number) => i % 2 === 0 ? '1' : '0',
  },
];

let passed = 0;
let failed = 0;

for (const config of LETTER_CONFIGS) {
  console.log(`🧪 Testing: ${config.name}`);
  console.log(`   📝 ${config.description}`);

  const outputPath = path.join(OUTPUT_DIR, `${config.name}.svg`);
  console.log(`   💾 Output: test-outputs/letter-snake/${config.name}.svg`);

  try {
    // Use environment variable approach like test-emoji-snake.ts
    process.env.INPUT_OUTPUTS = JSON.stringify([
      {
        type: "svg",
        filename: outputPath,
      }
    ]);

    const outputs = parseOutputsOption([process.env.INPUT_OUTPUTS || ""]);

    if (!Array.isArray(outputs) || outputs.length === 0) {
      throw new Error("parseOutputsOption returned invalid outputs");
    }

    // Apply letter configuration to draw options
    outputs.forEach(output => {
      if (output && output.drawOptions) {
        output.drawOptions.useCustomSnake = true;
        output.drawOptions.customSnakeConfig = {
          segments: config.segments,
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
        const dir = path.dirname(out.filename);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(out.filename, result);
      }
    });

    const stats = fs.statSync(outputPath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`   ✨ Success: ${sizeKB} KB`);
    console.log(`   📄 ${outputPath}`);
    console.log("");
    passed++;
  } catch (error) {
    console.error(`   ❌ Failed: ${error}`);
    console.log("");
    failed++;
  }
}

console.log("=".repeat(60));
console.log("");
console.log("📊 Letter Snake Test Results:");
console.log(`   ✅ Passed: ${passed}`);
console.log(`   ❌ Failed: ${failed}`);
console.log(`   📈 Total: ${LETTER_CONFIGS.length}`);
console.log(`   🎯 Success Rate: ${((passed / LETTER_CONFIGS.length) * 100).toFixed(1)}%`);
console.log("");

if (failed === 0) {
  console.log("🎉 All letter tests passed!");
  console.log("");
  console.log("💡 Tip: Open SVG files in test-outputs/letter-snake/ directory in browser");
  console.log("   to view the animated letter snakes!");
  console.log("");
  console.log("📝 Test Configurations:");
  for (const config of LETTER_CONFIGS) {
    console.log(`   ✨ ${config.name}: ${config.description}`);
  }
} else {
  console.error(`❌ ${failed} test(s) failed`);
  process.exit(1);
}
