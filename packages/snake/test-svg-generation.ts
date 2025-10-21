/**
 * Direct test for our SVG generation with snake animation
 */

import { generateContributionSnake } from "./packages/action/generate-contribution-snake";
import { Grid } from "./packages/types/grid";
import { Point } from "./packages/types/point";

// Create a simple test grid
const testGrid = Grid.createEmpty(52, 7); // 52 weeks × 7 days

// Add some test contribution data
for (let x = 0; x < 52; x++) {
  for (let y = 0; y < 7; y++) {
    if (Math.random() > 0.7) {
      const level = Math.floor(Math.random() * 4) + 1;
      testGrid.setColor(x, y, level as any);
    }
  }
}

// Test our SVG generation
async function testSvgGeneration() {
  try {
    const outputs = [{
      format: "svg" as const,
      filename: "test-real-snake.svg",
      drawOptions: {
        sizeCell: 16,
        sizeDot: 12,
        sizeDotBorderRadius: 2,
        colorDotBorder: "#1b1f230a",
        colorEmpty: "#161b22",
        colorSnake: "purple",
        colorDots: ["#161b22", "#01311f", "#034525", "#0f6d31", "#00c647"],
        dark: {
          colorDotBorder: "#1b1f230a",
          colorEmpty: "#161b22",
          colorSnake: "purple",
          colorDots: ["#161b22", "#01311f", "#034525", "#0f6d31", "#00c647"]
        }
      },
      animationOptions: {
        step: 1,
        frameDuration: 200
      }
    }];

    console.log("🧪 Testing SVG generation with snake animation...");

    // This would normally use the GitHub API, but we'll simulate
    const results = await generateContributionSnake("test-user", outputs, {
      githubToken: "fake-token"
    });

    console.log("✅ SVG generated successfully!");
    console.log("📏 SVG length:", results[0]?.length || 0);

    if (results[0]) {
      // Check if it contains snake elements
      const hasSnakePath = results[0].includes("snake");
      const hasAnimation = results[0].includes("@keyframes");

      console.log("🐍 Contains snake elements:", hasSnakePath);
      console.log("🎬 Contains animation:", hasAnimation);

      // Save the result
      const fs = require('fs');
      fs.writeFileSync('test-outputs/real-snake-test.svg', results[0]);
      console.log("💾 Saved to test-outputs/real-snake-test.svg");
    }

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testSvgGeneration();