#!/usr/bin/env bun
/**
 * Test script for mixed snake (emoji + images + letters)
 * Demonstrates combining different visual elements in one snake
 *
 * Run:
 * bun scripts/snake/test-mixed-snake.ts
 */

import * as fs from "fs";
import * as path from "path";

const OUTPUT_DIR = "test-outputs/mixed-snake";
const REPO_ROOT = path.resolve(process.cwd());

// Load GitHub token
function loadGitHubToken(): string {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  const tokenPath = path.join(REPO_ROOT, ".github/token.txt");
  if (fs.existsSync(tokenPath)) {
    const token = fs.readFileSync(tokenPath, "utf8").trim();
    if (token && !token.includes("your_github_token_here")) return token;
  }
  console.error("❌ Error: GitHub token is required");
  console.error("   Set GITHUB_TOKEN environment variable or create .github/token.txt");
  process.exit(1);
}

interface TestConfig {
  name: string;
  description: string;
  useEmoji: boolean;
  emojiConfig: {
    segments: (index: number, total: number) => string;
    defaultEmoji?: string;
  };
}

const configs: TestConfig[] = [
  // 1. Mix emoji and letters
  {
    name: "emoji-letters-mix",
    description: "Snake head is emoji, body is letters",
    useEmoji: true,
    emojiConfig: {
      segments: (index: number, total: number) => {
        if (index === 0) return '🐍';           // Head: snake emoji
        if (index === total - 1) return '💜';  // Tail: heart
        // Body: letters A-Z cycling
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return letters[index % letters.length];
      },
    },
  },

  // 2. Mix emoji and numbers
  {
    name: "emoji-numbers-mix",
    description: "Snake with emoji head and number body",
    useEmoji: true,
    emojiConfig: {
      segments: (index: number, total: number) => {
        if (index === 0) return '🐉';           // Head: dragon
        if (index === total - 1) return '🔥';  // Tail: fire
        // Body: numbers 0-9 cycling
        return String(index % 10);
      },
    },
  },

  // 3. Rainbow letters with emoji bookends
  {
    name: "rainbow-letters",
    description: "Rainbow colored emoji with letters",
    useEmoji: true,
    emojiConfig: {
      segments: (index: number, total: number) => {
        if (index === 0) return '🌈';           // Head: rainbow
        if (index === total - 1) return '⭐';  // Tail: star

        // Body: cycling through colored emojis and letters
        const pattern = ['🔴', 'A', '🟠', 'B', '🟡', 'C', '🟢', 'D', '🔵', 'E', '🟣', 'F'];
        return pattern[(index - 1) % pattern.length];
      },
    },
  },

  // 4. Geometric progression
  {
    name: "geometric-mix",
    description: "Mix of geometric shapes and symbols",
    useEmoji: true,
    emojiConfig: {
      segments: (index: number, total: number) => {
        if (index === 0) return '🔷';  // Head: diamond

        const shapes = ['●', '■', '▲', '◆', '★', '♠', '♣', '♥', '♦'];
        return shapes[index % shapes.length];
      },
    },
  },

  // 5. Image + emoji mix (using data URIs)
  {
    name: "image-emoji-mix",
    description: "Mix of images and emoji (demo with placeholder)",
    useEmoji: true,
    emojiConfig: {
      segments: (index: number, total: number) => {
        if (index === 0) return '🐍';  // Head: snake emoji

        // You can mix images (data URIs or URLs) with emoji
        // For demonstration, using emoji but you could use:
        // return 'data:image/svg+xml;base64,...' for images
        // return 'https://example.com/image.png' for external images

        const pattern = ['🟢', '🔵', '🟡', '🔴'];
        return pattern[(index - 1) % pattern.length];
      },
    },
  },

  // 6. Math symbols and emoji
  {
    name: "math-emoji-mix",
    description: "Mathematical symbols with emoji decorations",
    useEmoji: true,
    emojiConfig: {
      segments: (index: number, total: number) => {
        if (index === 0) return '🧮';           // Head: abacus
        if (index === total - 1) return '🎯';  // Tail: target

        const symbols = ['+', '−', '×', '÷', '=', '∑', '∏', '∫', '√', '∞'];
        return symbols[(index - 1) % symbols.length];
      },
    },
  },
];

async function main() {
  console.log("🎨 Testing Mixed Snake Configurations");
  console.log("=".repeat(60));
  console.log();

  // Load GitHub token
  const githubToken = loadGitHubToken();

  // Import dependencies
  const { generateContributionSnake } = await import("../../packages/snake/src/generate-contribution-snake");
  const { parseOutputsOption } = await import("../../packages/snake/src/outputs-options");

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const results: { name: string; success: boolean; size?: string; error?: string }[] = [];

  for (const config of configs) {
    console.log(`🧪 Testing: ${config.name}`);
    console.log(`   📝 ${config.description}`);
    console.log(`   💾 Output: ${OUTPUT_DIR}/${config.name}.svg`);

    try {
      const outputPath = path.join(OUTPUT_DIR, `${config.name}.svg`);
      const outputs = parseOutputsOption([`${outputPath}?palette=github-light`]);

      // Apply emoji configuration to the first output
      if (outputs.length > 0 && outputs[0] && config.useEmoji) {
        outputs[0].drawOptions = {
          ...outputs[0].drawOptions,
          useCustomSnake: true, // Enable custom snake mode
          customSnakeConfig: config.emojiConfig,
        };
      }

      const result = await generateContributionSnake("diverger", outputs, { githubToken });

      // Result is an array of output strings
      if (result.length > 0 && result[0]) {
        fs.writeFileSync(outputPath, result[0]);

        const stats = fs.statSync(outputPath);
        const sizeKB = (stats.size / 1024).toFixed(1);

        console.log(`   ✨ Success: ${sizeKB} KB`);
        console.log(`   📄 ${outputPath}`);
        results.push({ name: config.name, success: true, size: `${sizeKB} KB` });
      } else {
        throw new Error("No output generated");
      }
    } catch (error) {
      console.error(`   ❌ Failed: ${error instanceof Error ? error.message : String(error)}`);
      results.push({
        name: config.name,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    console.log();
  }

  console.log("=".repeat(60));
  console.log();
  console.log("📊 Mixed Snake Test Results:");
  console.log(`   ✅ Passed: ${results.filter(r => r.success).length}`);
  console.log(`   ❌ Failed: ${results.filter(r => !r.success).length}`);
  console.log(`   📈 Total: ${results.length}`);
  console.log(`   🎯 Success Rate: ${((results.filter(r => r.success).length / results.length) * 100).toFixed(1)}%`);
  console.log();

  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    console.log("❌ Failed tests:");
    failed.forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  }

  console.log("✅ All tests passed!");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
