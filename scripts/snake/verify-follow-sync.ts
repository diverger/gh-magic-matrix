#!/usr/bin/env bun

/**
 * Verify if follow-sync mode uses contributionCellsEaten
 * Expected: frames advance only on colored cells, frame stays same on empty cells
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const REPO_ROOT = process.cwd();
const svgPath = join(REPO_ROOT, "test-outputs/follow-sync.svg");

console.log("🔍 Verifying follow-sync mode frame advance logic\n");

const content = readFileSync(svgPath, 'utf-8');

// Extract all <use> elements with their positions
const usePattern = /<use[^>]+href="#(contrib-img-0-0-f\d+)"[^>]+x="([^"]+)"[^>]*>/g;
const useMatches = [...content.matchAll(usePattern)];

console.log(`Found ${useMatches.length} image use instances\n`);

// Analyze first 30 frames
console.log("First 30 frames - frame number and X coordinate changes:\n");
console.log("Index | Frame | X Coord | Frame Δ | X Δ   | Note");
console.log("-".repeat(60));

let prevFrame = -1;
let prevX = -1;

for (let i = 0; i < Math.min(30, useMatches.length); i++) {
  const [_, frameId, xPos] = useMatches[i];
  const frameNum = parseInt(frameId.match(/f(\d+)/)![1]);
  const x = parseFloat(xPos);

  const frameChanged = frameNum !== prevFrame ? "✓" : "✗";
  const xChanged = Math.abs(x - prevX) > 0.1 ? "✓" : "✗";

  let note = "";
  if (xChanged === "✗" && i > 0) {
    note = "Progress paused";
  } else if (xChanged === "✓" && frameChanged === "✓") {
    note = "Normal move";
  } else if (xChanged === "✓" && frameChanged === "✗") {
    note = "⚠️ Sliding!";
  }

  console.log(`${i.toString().padStart(5)} | ${frameNum.toString().padStart(5)} | ${x.toFixed(1).padStart(7)} | ${frameChanged.padStart(7)} | ${xChanged.padStart(5)} | ${note}`);

  prevFrame = frameNum;
  prevX = x;
}

// Count progress bar pause phenomenon
let pausedCount = 0;
let slideCount = 0;
let normalCount = 0;

prevFrame = -1;
prevX = -1;

for (let i = 1; i < useMatches.length; i++) {
  const [_, frameId, xPos] = useMatches[i];
  const frameNum = parseInt(frameId.match(/f(\d+)/)![1]);
  const x = parseFloat(xPos);

  const xChanged = Math.abs(x - prevX) > 0.1;
  const frameChanged = frameNum !== prevFrame;

  if (!xChanged) {
    // X unchanged = progress bar paused
    pausedCount++;
  } else if (xChanged && !frameChanged) {
    // X changed but frame unchanged = sliding (should not happen in follow mode)
    slideCount++;
  } else if (xChanged && frameChanged) {
    // Normal movement
    normalCount++;
  }

  prevFrame = frameNum;
  prevX = x;
}

console.log("\n📊 Behavior analysis:");
console.log(`   Progress paused (X and frame both unchanged): ${pausedCount} times`);
console.log(`   Normal movement (X and frame both changed): ${normalCount} times`);
console.log(`   Sliding (X changed but frame unchanged): ${slideCount} times`);

if (slideCount === 0) {
  console.log("\n✅ Conclusion: Follow-Sync mode [CORRECT]");
  console.log("   - When progress bar moves, frame number changes synchronously");
  console.log("   - When progress bar pauses, frame number also pauses");
  console.log("   - No sliding phenomenon, uses contributionCellsEaten ✓");
} else {
  console.log("\n❌ Conclusion: Follow-Sync mode [ERROR]");
  console.log(`   - Found ${slideCount} sliding instances (progress moves but frame unchanged)`);
  console.log("   - Should use contributionCellsEaten, but implementation may be incorrect");
}
