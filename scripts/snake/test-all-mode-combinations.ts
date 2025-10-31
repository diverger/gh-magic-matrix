#!/usr/bin/env bun
/**
 * 🧪 Main Test Suite: All Position Mode × Time Mode Combinations
 *
 * Test Configurations:
 * 1. free-sync - Uniform movement + frame advance per step (uses index)
 * 2. free-loop-spritesheet - Uniform movement + independent loop (sprite sheet)
 * 3. free-loop-multifile-time - Uniform movement + time-based loop (may skip frames)
 * 4. free-loop-multifile-smooth - Uniform movement + index-based loop (no skipping)
 * 5. free-level - Uniform movement + L0-L4 level switching
 * 6. follow-level - Follow progress bar + L0-L4 level switching
 * 7. follow-sync - Follow progress bar + sync frame advance (uses contributionCellsEaten)
 * 8. top-left-sync - Fixed position + sync frame advance
 * 9. multi-display-combo - Multiple counter combination display
 *
 * Run:
 *   bun scripts/snake/test-all-mode-combinations.ts
 *
 * Verification scripts:
 *   - verify-sync-logic.ts - Verify free-sync has no sliding
 *   - verify-follow-sync.ts - Verify follow-sync pauses correctly
 *   - compare-loop-modes.ts - Compare loop mode performance
 */

import * as fs from "fs";
import * as path from "path";

// TypeScript interface for test configuration
interface TestConfig {
  name: string;
  position: string;
  timeMode: string;
  description: string;
  config?: Record<string, unknown>;
  multiDisplays?: Array<Record<string, unknown>>;
}

// Get repo root - use __dirname equivalent for bun
const REPO_ROOT = path.resolve(process.cwd());

// Load GitHub token
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

console.log("🧪 Testing All Position Mode × Time Mode Combinations");
console.log("=".repeat(60));
console.log("");

const githubToken = loadGitHubToken();

// Test configurations
const TEST_CONFIGS = [
  // 1. free + sync: uniform movement + synchronized frame advance (using multi-file animation frames)
  {
    name: "free-sync",
    position: "free",
    timeMode: "sync",
    description: "Uniform movement, frame advance per step (14-frame walk animation)",
    config: {
      position: "free",
      mode: "sync",
      prefix: "{img:0} ",
      suffix: " contributions",
      fontSize: 14,
      images: [{
        urlFolder: ".github/assets/sprite-frames",
        framePattern: "frame-{n}.png",  // frame-0.png to frame-13.png
        width: 60,
        height: 48,
        sprite: {
          framesPerLevel: 14,       // 14-frame animation
          animationSpeed: 1.0       // 1.0 = smooth, no frame skipping
        }
      }]
    }
  },

  // 2. free + loop (sprite sheet): uniform movement + independent loop animation (using sprite sheet)
  {
    name: "free-loop-spritesheet",
    position: "free",
    timeMode: "loop",
    description: "Uniform movement, independent loop animation (sprite sheet, 8 frames)",
    config: {
      position: "free",
      mode: "loop",
      showCount: true,
      showPercentage: true,
      prefix: "{img:0}",
      suffix: "",
      images: [{
        url: ".github/assets/sprite.png",  // sprite sheet (384x64, 8 frames × 48px)
        width: 64,
        height: 86,
        anchorY: 0.6875,      // Align character feet
        anchorX: 0.3,         // Slightly left
        textAnchorY: 1.0,     // Text baseline align
        spacing: 0,
        sprite: {
          framesPerLevel: 8,  // 8-frame loop animation
          frameWidth: 48,
          frameHeight: 64,
          layout: "horizontal",
          fps: 8  // 8fps
        }
      }]
    }
  },

  // 3. free + loop (multi-file, time-based): uniform movement + independent loop animation (using multiple files, time-based)
  {
    name: "free-loop-multifile-time",
    position: "free",
    timeMode: "loop",
    description: "Uniform movement, independent loop animation (multi-file, 14 frames, time-based, may skip frames)",
    config: {
      position: "free",
      mode: "loop",
      showCount: true,
      showPercentage: true,
      prefix: "{img:0}",
      suffix: "",
      images: [{
        urlFolder: ".github/assets/sprite-frames",
        framePattern: "frame-{n}.png",  // frame-0.png to frame-13.png
        width: 60,
        height: 48,
        anchorY: 0.6,         // Center align
        anchorX: 0.5,
        textAnchorY: 0.5,
        spacing: 5,
        sprite: {
          framesPerLevel: 14,  // 14-frame loop animation
          fps: 20  // 20fps (time-based, may skip frames)
        }
      }]
    }
  },

  // 3b. free + loop (multi-file, index-based): uniform movement + independent loop animation (using multiple files, index-based)
  {
    name: "free-loop-multifile-smooth",
    position: "free",
    timeMode: "loop",
    description: "Uniform movement, independent loop animation (multi-file, 14 frames, index-based, no frame skipping)",
    config: {
      position: "free",
      mode: "loop",
      showCount: true,
      showPercentage: true,
      prefix: "{img:0}",
      suffix: "",
      images: [{
        urlFolder: ".github/assets/sprite-frames",
        framePattern: "frame-{n}.png",  // frame-0.png to frame-13.png
        width: 60,
        height: 48,
        anchorY: 0.6,         // Center align
        anchorX: 0.5,
        textAnchorY: 0.5,
        spacing: 5,
        sprite: {
          framesPerLevel: 14,  // 14-frame loop animation
          loopSpeed: 1.0  // Index-based, advance 1 frame per step (no skipping)
        }
      }]
    }
  },

  // 4. free + level: uniform movement + level switching based on contribution value (using sprite sheet)
  {
    name: "free-level",
    position: "free",
    timeMode: "level",
    description: "Uniform movement, switch between L0-L4 levels based on contribution value (sprite sheet mode)",
    config: {
      position: "free",
      mode: "level",
      prefix: "{img:0} ",
      suffix: " contributions",
      fontSize: 14,
      images: [{
        urlFolder: ".github/assets",
        framePattern: "Lx.png",  // L0.png, L1.png, L2.png, L3.png, L4.png
        width: 64,
        height: 86,
        anchorY: 0.6875,      // Align character feet
        anchorX: 0.3,         // Slightly left
        textAnchorY: 1.0,     // Text baseline align
        spacing: 0,
        sprite: {
          contributionLevels: 5,
          framesPerLevel: 8,        // 8 frames per level
          frameWidth: 48,           // Frame width in sprite sheet
          frameHeight: 64,          // Frame height in sprite sheet
          layout: "horizontal",
          useSpriteSheetPerLevel: true  // Use separate sprite sheet per level
        }
      }]
    }
  },

  // 5. follow + level: Follow progress bar + level switching (sprite sheet, 8-frame animation)
  {
    name: "follow-level",
    position: "follow",
    timeMode: "level",
    description: "Follow progress bar head, switch L0-L4 levels based on contribution value (8 frames per level)",
    config: {
      position: "follow",
      mode: "level",
      prefix: "{img:0} ",
      suffix: "",
      fontSize: 14,
      images: [{
        urlFolder: ".github/assets",
        framePattern: "Lx.png",  // L0.png - L4.png (sprite sheets)
        width: 64,
        height: 86,
        anchorY: 0.6875,      // Image anchor Y (0.6875 = 44/64, align character feet)
        anchorX: 0.3,         // Image anchor X (0.3 = slightly left)
        textAnchorY: 1.0,     // Text anchor Y (1.0 = baseline)
        spacing: 0,
        sprite: {
          contributionLevels: 5,
          framesPerLevel: 8,        // 8 frames per level
          frameWidth: 48,           // Frame width in sprite sheet
          frameHeight: 64,          // Frame height in sprite sheet
          layout: "horizontal",
          useSpriteSheetPerLevel: true  // Use separate sprite sheet per level
        }
      }]
    }
  },

  // 6. follow + sync: Follow progress bar + sync (frame advance only on colored cells)
  {
    name: "follow-sync",
    position: "follow",
    timeMode: "sync",
    description: "Follow progress bar, frame advance only when eating colored cells (animation pauses on empty cells)",
    config: {
      position: "follow",
      mode: "sync",
      prefix: "{img:0} ",
      suffix: " contributions",
      fontSize: 14,
      images: [{
        urlFolder: ".github/assets/sprite-frames",
        framePattern: "frame-{n}.png",
        width: 60,
        height: 48,
        sprite: {
          framesPerLevel: 14,
          animationSpeed: 1.0
        }
      }]
    }
  },

  // 7. top-left + sync: Top-left fixed + sync
  {
    name: "top-left-sync",
    position: "top-left",
    timeMode: "sync",
    description: "Top-left fixed position, synchronized frame advance",
    config: {
      position: "top-left",
      prefix: "🎯 ",
      suffix: " contributions",
      fontSize: 14,
    }
  },

  // 8. Combo: Multiple displays simultaneously
  {
    name: "multi-display-combo",
    position: "multi",
    timeMode: "mixed",
    description: "Multiple counter combo: free+loop, follow+level, top-left fixed text",
    multiDisplays: [
      {
        position: "free",
        mode: "loop",
        showCount: false,
        showPercentage: false,
        prefix: "{img:0}",
        suffix: "",
        images: [{
          url: ".github/assets/sprite.png",
          width: 48,
          height: 48,
          sprite: {
            framesPerLevel: 8,
            frameWidth: 48,
            frameHeight: 48,
            layout: "horizontal",
            fps: 8
          }
        }]
      },
      {
        position: "follow",
        mode: "level",
        prefix: "{img:0} ",
        suffix: "",
        fontSize: 12,
        images: [{
          urlFolder: ".github/assets",
          framePattern: "L{n}.png",
          width: 32,
          height: 32,
          sprite: {
            framesPerLevel: 1,
            contributionLevels: 5
          }
        }]
      },
      {
        position: "top-left",
        prefix: "📊 ",
        suffix: " contributions",
        fontSize: 12,
        color: "#666"
      }
    ]
  }
];

async function runTest(testConfig: TestConfig) {
  const { name, position, timeMode, description, config, multiDisplays } = testConfig;

  console.log(`\n🧪 Test: ${name}`);
  console.log(`   Position mode: ${position}`);
  console.log(`   Time mode: ${timeMode}`);
  console.log(`   Description: ${description}`);

  const OUTPUT_PATH = path.join(REPO_ROOT, `test-outputs/${name}.svg`);

  const displays = (multiDisplays || [config]).filter((d): d is Record<string, unknown> => d !== undefined);

  // Configure environment variables
  process.env.INPUT_GITHUB_USER_NAME = "diverger";
  process.env.INPUT_OUTPUTS = `${OUTPUT_PATH}?palette=github-light`;
  process.env.INPUT_SHOW_CONTRIBUTION_COUNTER = "true";
  const hideProgressBar = false;  // Show progress bar
  process.env.INPUT_HIDE_PROGRESS_BAR = hideProgressBar ? "true" : "false";
  process.env.INPUT_COUNTER_DISPLAYS = JSON.stringify(displays);
  process.env.GITHUB_TOKEN = githubToken;

  try {
    const { generateContributionSnake } = await import("../../packages/snake/src/generate-contribution-snake");
    const { parseOutputsOption } = await import("../../packages/snake/src/outputs-options");

    const outputs = parseOutputsOption([process.env.INPUT_OUTPUTS || ""]);

    // Validate outputs is a non-empty array
    if (!Array.isArray(outputs) || outputs.length === 0) {
      console.warn(`⚠️  Warning: parseOutputsOption returned invalid or empty outputs for displays: ${JSON.stringify(displays)}`);
      console.warn(`   INPUT_OUTPUTS was: ${process.env.INPUT_OUTPUTS}`);
      return false;
    }

    // Apply counter configuration
    outputs.forEach(output => {
      if (output) {
        output.animationOptions = output.animationOptions || {};
        output.animationOptions.contributionCounter = {
          enabled: true,
          displays: displays as any,
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
        try {
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
      console.log(`   ✅ Success: ${sizeKB} KB`);
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

async function runAllTests() {
  // Create output directory
  const outputDir = path.join(REPO_ROOT, "test-outputs");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let passed = 0;
  let failed = 0;

  // Can test specific configs only (uncomment to enable)
  // const testsToRun = TEST_CONFIGS.filter(c => c.name === "follow-level");
  const testsToRun = TEST_CONFIGS;

  for (const config of testsToRun) {
    const success = await runTest(config);
    if (success) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("\n📊 Test Results:");
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Total: ${passed + failed}`);
  console.log(`   🎯 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log("\n🎉 All tests passed!");
    console.log("\n💡 Tip: Open SVG files in test-outputs/ directory in browser to view animations");
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed`);
  }
}

runAllTests().catch(error => {
  console.error("\n❌ Test suite failed:", error);
  process.exit(1);
});
