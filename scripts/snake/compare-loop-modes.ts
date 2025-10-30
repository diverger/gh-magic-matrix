#!/usr/bin/env bun

/**
 * Compare frame distribution between time-based and index-based loop modes
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const REPO_ROOT = process.cwd();

function analyzeFrameDistribution(filename: string) {
  const svgPath = join(REPO_ROOT, `test-outputs/${filename}`);
  const content = readFileSync(svgPath, 'utf-8');

  // Extract all <use> element references
  const usePattern = /<use[^>]+href="#(contrib-img-0-0-f\d+)"[^>]*>/g;
  const useMatches = [...content.matchAll(usePattern)];

  // Count usage frequency for each image ID
  const imageUseCount = new Map<string, number>();
  for (const [_, imageId] of useMatches) {
    imageUseCount.set(imageId, (imageUseCount.get(imageId) || 0) + 1);
  }

  // Sort by frame number
  const sortedUses = Array.from(imageUseCount.entries()).sort((a, b) => {
    const aMatch = a[0].match(/contrib-img-0-0-f(\d+)/);
    const bMatch = b[0].match(/contrib-img-0-0-f(\d+)/);
    if (aMatch && bMatch) {
      return parseInt(aMatch[1]) - parseInt(bMatch[1]);
    }
    return a[0].localeCompare(b[0]);
  });

  return { sortedUses, totalUses: useMatches.length };
}

console.log("📊 Loop Mode Comparison: Time-based vs Index-based\n");
console.log("=" .repeat(70));

// Analyze time-based version
console.log("\n🕐 Time-based (fps=20, may skip frames):");
console.log("-".repeat(70));
const timeResult = analyzeFrameDistribution("free-loop-multifile-time.svg");
console.log(`Total uses: ${timeResult.totalUses}`);
console.log(`\nFrame distribution:`);
for (const [imageId, count] of timeResult.sortedUses) {
  const frameMatch = imageId.match(/f(\d+)/);
  const frameNum = frameMatch ? frameMatch[1] : '?';
  const bar = '█'.repeat(Math.round(count / 5));
  console.log(`  Frame ${frameNum.padStart(2, ' ')}: ${count.toString().padStart(3, ' ')} ${bar}`);
}

// Calculate uniformity
const timeAvg = timeResult.totalUses / timeResult.sortedUses.length;
const timeMaxDev = Math.max(...timeResult.sortedUses.map(([_, c]) => Math.abs(c - timeAvg)));
console.log(`\nUniformity analysis:`);
console.log(`  Average: ${timeAvg.toFixed(1)} uses/frame`);
console.log(`  Max deviation: ${timeMaxDev.toFixed(1)} (${(timeMaxDev / timeAvg * 100).toFixed(1)}%)`);

// Analyze index-based version
console.log("\n\n📍 Index-based (loopSpeed=1.0, no frame skipping):");
console.log("-".repeat(70));
const indexResult = analyzeFrameDistribution("free-loop-multifile-smooth.svg");
console.log(`Total uses: ${indexResult.totalUses}`);
console.log(`\nFrame distribution:`);
for (const [imageId, count] of indexResult.sortedUses) {
  const frameMatch = imageId.match(/f(\d+)/);
  const frameNum = frameMatch ? frameMatch[1] : '?';
  const bar = '█'.repeat(Math.round(count / 5));
  console.log(`  Frame ${frameNum.padStart(2, ' ')}: ${count.toString().padStart(3, ' ')} ${bar}`);
}

// Calculate uniformity
const indexAvg = indexResult.totalUses / indexResult.sortedUses.length;
const indexMaxDev = Math.max(...indexResult.sortedUses.map(([_, c]) => Math.abs(c - indexAvg)));
console.log(`\nUniformity analysis:`);
console.log(`  Average: ${indexAvg.toFixed(1)} uses/frame`);
console.log(`  Max deviation: ${indexMaxDev.toFixed(1)} (${(indexMaxDev / indexAvg * 100).toFixed(1)}%)`);

// Comparison conclusion
console.log("\n\n" + "=".repeat(70));
console.log("📈 Comparison Conclusion:");
console.log("=".repeat(70));

if (indexMaxDev < timeMaxDev) {
  console.log(`✅ Index-based version is more uniform (deviation ${(indexMaxDev / indexAvg * 100).toFixed(1)}% vs ${(timeMaxDev / timeAvg * 100).toFixed(1)}%)`);
} else {
  console.log(`⚠️  Both modes have similar uniformity`);
}

// Check if all frames are used
const timeFrames = new Set(timeResult.sortedUses.map(([id]) => id.match(/f(\d+)/)![1]));
const indexFrames = new Set(indexResult.sortedUses.map(([id]) => id.match(/f(\d+)/)![1]));

console.log(`\nFrame coverage:`);
console.log(`  Time-based: ${timeFrames.size}/14 frames`);
console.log(`  Index-based: ${indexFrames.size}/14 frames`);

if (indexFrames.size === 14 && timeFrames.size === 14) {
  console.log(`  ✅ Both modes use all 14 frames`);
} else if (indexFrames.size > timeFrames.size) {
  console.log(`  ✅ Index-based uses more frames`);
}

console.log(`\nRecommendation:`);
console.log(`  💡 Use loopSpeed: 1.0 for smooth loop without frame skipping`);
console.log(`  💡 Use fps: <number> for time-based independent animation (may skip frames)`);
