#!/usr/bin/env bun
/**
 * 🎨 Emoji Snake Test Suite
 *
 * Test various emoji configurations for the snake animation.
 *
 * Test Configurations:
 * 1. default-emoji - Default emoji (🐍 head, 🟢 body)
 * 2. rainbow-snake - Rainbow colored emoji
 * 3. fire-dragon - Fire dragon theme
 * 4. starry-snake - Starry space theme (function-based)
 * 5. food-chain - Food chain theme
 * 6. heart-gradient - Heart gradient theme (function-based)
 * 7. space-snake - Space theme
 * 8. gradient-circles - Gradient circles (function-based)
 * 9. traditional-rect - Traditional rectangles (for comparison)
 *
 * Run:
 *   bun scripts/snake/test-emoji-snake.ts
 *
 * Output:
 *   SVG files will be saved to test-outputs/emoji-snake/
 */

import * as fs from "fs";
import * as path from "path";
import { loadGitHubToken } from "../utils/env-loader";

// TypeScript interface for test configuration
interface EmojiTestConfig {
  name: string;
  description: string;
  useEmoji: boolean;
  emojiConfig?: {
    segments?: string[] | ((index: number, total: number) => string);
    defaultContent?: string;
    animationTiming?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  };
}

// Get repo root
const REPO_ROOT = path.resolve(process.cwd());

console.log("🎨 Testing Emoji Snake Configurations");
console.log("=".repeat(60));
console.log("");

const githubToken = loadGitHubToken(REPO_ROOT);

// Test configurations
const EMOJI_TEST_CONFIGS: EmojiTestConfig[] = [
  // 1. Default emoji
  {
    name: "default-emoji",
    description: "Default emoji (🐍 head, 🟢 body)",
    useEmoji: true,
  },

  // 2. Rainbow snake
  {
    name: "rainbow-snake",
    description: "Rainbow colored emoji",
    useEmoji: true,
    emojiConfig: {
      segments: ['🐍', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣'],
    },
  },

  // 2b. Rainbow snake with ease-in-out timing (smoother)
  {
    name: "rainbow-snake-smooth",
    description: "Rainbow colored emoji with ease-in-out timing (smoother)",
    useEmoji: true,
    emojiConfig: {
      segments: ['🐍', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣'],
      animationTiming: 'ease-in-out',
    },
  },



  // 3. Fire dragon
  {
    name: "fire-dragon",
    description: "Fire dragon theme (🐲 🔥)",
    useEmoji: true,
    emojiConfig: {
      segments: ['🐲', '🔥', '🔥', '🟠', '🟡'],
      defaultContent: '💨',
    },
  },

  // 4. Starry snake (function-based)
  {
    name: "starry-snake",
    description: "Starry space theme (function-based, cycling stars)",
    useEmoji: true,
    emojiConfig: {
      segments: (index: number) => {
        if (index === 0) return '🐍';
        const stars = ['⭐', '✨', '💫', '🌟'];
        return stars[index % stars.length];
      },
    },
  },

  // 5. Food chain
  {
    name: "food-chain",
    description: "Food chain theme (fruits)",
    useEmoji: true,
    emojiConfig: {
      segments: ['🐍', '🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍉'],
    },
  },

  // 6. Heart gradient (function-based)
  {
    name: "heart-gradient",
    description: "Heart gradient theme (function-based, rainbow hearts)",
    useEmoji: true,
    emojiConfig: {
      segments: (index: number, total: number) => {
        if (index === 0) return '🐍';

        // Guard against division by zero when total <= 1
        if (total <= 1) return '💜';

        if (index === total - 1) return '💜';

        const hearts = ['❤️', '🧡', '💛', '💚', '💙', '💜'];
        const heartIndex = Math.floor((index / total) * hearts.length);
        return hearts[Math.min(heartIndex, hearts.length - 1)];
      },
    },
  },

  // 7. Space snake
  {
    name: "space-snake",
    description: "Space theme (planets and stars)",
    useEmoji: true,
    emojiConfig: {
      segments: ['🐍', '🌍', '🌙', '⭐', '🪐', '🌟', '☄️'],
    },
  },

  // 8. Gradient circles (function-based)
  {
    name: "gradient-circles",
    description: "Gradient circles theme (green to white)",
    useEmoji: true,
    emojiConfig: {
      segments: (index: number, total: number) => {
        if (index === 0) return '🐍';

        // Guard against division by zero when total <= 1
        if (total <= 1) return '🟢';

        const ratio = index / (total - 1);
        if (ratio < 0.33) return '🟢';
        if (ratio < 0.66) return '🟡';
        return '⚪';
      },
      defaultContent: '⚪',
    },
  },

  // 9. Traditional rectangles (for comparison)
  {
    name: "traditional-rect",
    description: "Traditional rectangles (no emoji, for comparison)",
    useEmoji: false,
  },
];

/**
 * Run a single emoji snake test
 */
async function runEmojiTest(config: EmojiTestConfig): Promise<boolean> {
  const OUTPUT_PATH = path.join(REPO_ROOT, "test-outputs", "emoji-snake", `${config.name}.svg`);

  console.log(`\n🧪 Testing: ${config.name}`);
  console.log(`   📝 ${config.description}`);
  console.log(`   💾 Output: test-outputs/emoji-snake/${config.name}.svg`);

  // Configure environment variables
  process.env.INPUT_GITHUB_USER_NAME = "diverger";
  process.env.INPUT_OUTPUTS = `${OUTPUT_PATH}?palette=github-light`;
  process.env.GITHUB_TOKEN = githubToken;

  try {
    const { generateContributionSnake } = await import("../../packages/snake/src/generate-contribution-snake");
    const { parseOutputsOption } = await import("../../packages/snake/src/outputs-options");

    const outputs = parseOutputsOption([process.env.INPUT_OUTPUTS || ""]);

    if (!Array.isArray(outputs) || outputs.length === 0) {
      console.warn(`⚠️  Warning: parseOutputsOption returned invalid outputs`);
      return false;
    }

    // Apply emoji configuration to draw options
    outputs.forEach(output => {
      if (output && output.drawOptions) {
        output.drawOptions.useCustomSnake = config.useEmoji;
        if (config.emojiConfig) {
          output.drawOptions.customSnakeConfig = config.emojiConfig;
        }
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
        try {
          // Ensure directory exists
          const dir = path.dirname(out.filename);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFileSync(out.filename, result);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.warn(`⚠️  Warning: Failed to write file "${out.filename}": ${errorMessage}`);
        }
      }
    });

    if (fs.existsSync(OUTPUT_PATH)) {
      const stats = fs.statSync(OUTPUT_PATH);
      const sizeKB = (stats.size / 1024).toFixed(1);
      const emoji = config.useEmoji ? '✨' : '📦';
      console.log(`   ${emoji} Success: ${sizeKB} KB`);
      console.log(`   📄 ${OUTPUT_PATH}`);
      return true;
    } else {
      console.log(`   ❌ Failed: File not generated`);
      return false;
    }
  } catch (error: unknown) {
    console.log(`   ❌ Failed: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Run all emoji tests
 */
async function runAllEmojiTests() {
  // Create output directory
  const outputDir = path.join(REPO_ROOT, "test-outputs", "emoji-snake");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let passed = 0;
  let failed = 0;

  // Can test specific configs only (uncomment to enable)
  // const testsToRun = EMOJI_TEST_CONFIGS.filter(c => c.name === "rainbow-snake");
  const testsToRun = EMOJI_TEST_CONFIGS;

  for (const config of testsToRun) {
    const success = await runEmojiTest(config);
    if (success) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("\n📊 Emoji Snake Test Results:");
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Total: ${passed + failed}`);
  console.log(`   🎯 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log("\n🎉 All emoji tests passed!");
    console.log("\n💡 Tip: Open SVG files in test-outputs/emoji-snake/ directory in browser");
    console.log("   to view the animated emoji snakes!");
    console.log("\n📝 Test Configurations:");
    EMOJI_TEST_CONFIGS.forEach(config => {
      const emoji = config.useEmoji ? '✨' : '📦';
      console.log(`   ${emoji} ${config.name}: ${config.description}`);
    });
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed`);
  }
}

runAllEmojiTests().catch(error => {
  console.error("\n❌ Emoji test suite failed:", error);
  process.exit(1);
});
