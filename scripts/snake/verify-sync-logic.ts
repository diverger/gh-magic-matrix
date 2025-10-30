#!/usr/bin/env bun

/**
 * Verify if sync mode only advances frames when eating colored cells
 * If true, there should be sliding phenomenon (frame stays but position changes on empty cells)
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const REPO_ROOT = process.cwd();
const svgPath = join(REPO_ROOT, "test-outputs/free-sync.svg");

console.log("🔍 Verifying Sync mode frame advance logic\n");

const content = readFileSync(svgPath, 'utf-8');

// Extract all <use> elements with their positions
const usePattern = /<use[^>]+href="#(contrib-img-0-0-f\d+)"[^>]+x="([^"]+)"[^>]*>/g;
const useMatches = [...content.matchAll(usePattern)];

console.log(`Found ${useMatches.length} image use instances\n`);

// Analyze first 30 frames
console.log("First 30 frames - frame number and X coordinate changes:\n");
console.log("Index | Frame | X Coord | Frame Δ | X Δ");
console.log("-".repeat(50));

let prevFrame = -1;
let prevX = -1;

for (let i = 0; i < Math.min(30, useMatches.length); i++) {
  const [_, frameId, xPos] = useMatches[i];
  const frameNum = parseInt(frameId.match(/f(\d+)/)![1]);
  const x = parseFloat(xPos);

  const frameChanged = frameNum !== prevFrame ? "✓" : "✗";
  const xChanged = x !== prevX ? "✓" : "✗";

  console.log(`${i.toString().padStart(5)} | ${frameNum.toString().padStart(5)} | ${x.toFixed(1).padStart(7)} | ${frameChanged.padStart(7)} | ${xChanged.padStart(3)}`);

  prevFrame = frameNum;
  prevX = x;
}

// Count sliding phenomenon (X changes but frame stays same)
let slideCount = 0;
let normalCount = 0;

prevFrame = -1;
prevX = -1;

for (let i = 1; i < useMatches.length; i++) {
  const [_, frameId, xPos] = useMatches[i];
  const frameNum = parseInt(frameId.match(/f(\d+)/)![1]);
  const x = parseFloat(xPos);

  if (prevX !== -1) {
    const xChanged = Math.abs(x - prevX) > 0.1;
    const frameChanged = frameNum !== prevFrame;

    if (xChanged && !frameChanged) {
      slideCount++;
    } else if (xChanged && frameChanged) {
      normalCount++;
    }
  }

  prevFrame = frameNum;
  prevX = x;
}

console.log("\n📊 Sliding analysis:");
console.log(`   X changes but frame stays (sliding): ${slideCount} times`);
console.log(`   X and frame both change (normal): ${normalCount} times`);
console.log(`   Sliding rate: ${(slideCount / (slideCount + normalCount) * 100).toFixed(1)}%`);

if (slideCount > 10) {
  console.log("\n✅ Conclusion: Sync mode [only advances frames on colored cells]");
  console.log("   Snake will slide when moving through empty cells");
} else {
  console.log("\n✅ Conclusion: Sync mode [advances frames on every cell]");
  console.log("   Frame changes on every move, no sliding phenomenon");
}
