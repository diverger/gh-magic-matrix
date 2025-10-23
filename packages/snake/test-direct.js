import { createSvg } from "./packages/svg-creator/svg-builder";
import { Grid } from "./packages/types/grid";
import { Snake } from "./packages/types/snake";
import { Point } from "./packages/types/point";

// Create test data
console.log("🧪 Creating test SVG with snake animation...");

// Create a small test grid
const grid = Grid.createEmpty(10, 7);

// Add some colored cells
for (let x = 0; x < 10; x++) {
  for (let y = 0; y < 7; y++) {
    if (Math.random() > 0.7) {
      const level = Math.floor(Math.random() * 4) + 1;
      grid.setColor(x, y, level);
    }
  }
}

// Create a simple snake path
const snakeStates = [];
let currentSnake = Snake.createHorizontal(4);
snakeStates.push(currentSnake);

// Move the snake in a simple pattern
for (let i = 0; i < 20; i++) {
  const dx = Math.random() > 0.5 ? 1 : 0;
  const dy = dx === 0 ? (Math.random() > 0.5 ? 1 : -1) : 0;

  currentSnake = currentSnake.nextSnake(dx, dy);
  snakeStates.push(currentSnake);
}

// Test our SVG generation
const svg = createSvg(
  grid,
  null,
  snakeStates,
  {
    colorDots: {
      0: "#161b22",
      1: "#01311f",
      2: "#034525",
      3: "#0f6d31",
      4: "#00c647"
    },
    colorEmpty: "#161b22",
    colorDotBorder: "#1b1f230a",
    colorSnake: "purple",
    sizeCell: 16,
    sizeDot: 12,
    sizeDotBorderRadius: 2,
  },
  {
    frameDuration: 200
  }
);

// Save the result
const fs = require('fs');
const path = require('path');

const outputDir = './test-outputs';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputFile = path.join(outputDir, 'test-direct-snake.svg');
fs.writeFileSync(outputFile, svg);

console.log("✅ SVG generated successfully!");
console.log("📁 Saved to:", outputFile);
console.log("📏 SVG length:", svg.length);
console.log("🐍 Contains snake elements:", svg.includes("snake"));
console.log("🎬 Contains animation:", svg.includes("@keyframes"));

// Show first few lines
const lines = svg.split('\n');
console.log("\n📋 First 10 lines:");
for (let i = 0; i < Math.min(10, lines.length); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}