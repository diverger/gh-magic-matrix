#!/usr/bin/env bun

/**
 * Check frame usage distribution in free-loop.svg
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const REPO_ROOT = process.cwd();
const svgPath = join(REPO_ROOT, "test-outputs/free-loop.svg");

console.log("🔍 Checking frame distribution in free-loop.svg\n");

const content = readFileSync(svgPath, 'utf-8');

// Extract all symbol references from <use> elements
const usePattern = /<use[^>]+href="#(contrib-img-0-0-f\d+)"[^>]*>/g;
const matches = [...content.matchAll(usePattern)];

// Count usage frequency for each frame
const frameCount = new Map<string, number>();
for (const match of matches) {
  const symbolId = match[1];
  frameCount.set(symbolId, (frameCount.get(symbolId) || 0) + 1);
}

console.log("📊 Frame usage distribution:");
const sortedFrames = Array.from(frameCount.entries()).sort((a, b) => {
  const aNum = parseInt(a[0].match(/f(\d+)/)![1]);
  const bNum = parseInt(b[0].match(/f(\d+)/)![1]);
  return aNum - bNum;
});

let totalUses = 0;
for (const [frameId, count] of sortedFrames) {
  const frameNum = frameId.match(/f(\d+)/)![1];
  totalUses += count;
  console.log(`   Frame ${frameNum}: ${count} uses`);
}

console.log(`\n✅ Total: ${totalUses} use instances, ${sortedFrames.length} different frames`);

// Verify if frame distribution is uniform (for 8 fps loop, should be relatively uniform)
if (sortedFrames.length === 8) {
  const avgCount = totalUses / 8;
  const maxDeviation = Math.max(...sortedFrames.map(([_, count]) => Math.abs(count - avgCount)));
  const deviationPercent = (maxDeviation / avgCount * 100).toFixed(1);

  console.log(`\n📈 Distribution analysis:`);
  console.log(`   Average per frame: ${avgCount.toFixed(1)} uses`);
  console.log(`   Max deviation: ${maxDeviation.toFixed(1)} uses (${deviationPercent}%)`);

  if (maxDeviation / avgCount < 0.2) {
    console.log(`   ✅ Frame distribution is uniform (deviation < 20%)`);
  } else {
    console.log(`   ⚠️  Frame distribution is not very uniform (deviation > 20%)`);
  }
}

// Check first 50 frames sequence to verify time-based cycling
console.log(`\n🔄 Checking first 50 frames sequence:`);
const first50 = matches.slice(0, 50).map(m => {
  const frameNum = m[1].match(/f(\d+)/)![1];
  return frameNum;
});

console.log(`   ${first50.join(', ')}`);

// Check for continuous cycling pattern (0→1→2→3→4→5→6→7→0→...)
let isSequential = true;
for (let i = 1; i < Math.min(20, first50.length); i++) {
  const expected = (parseInt(first50[i - 1]) + 1) % 8;
  const actual = parseInt(first50[i]);
  if (expected !== actual) {
    isSequential = false;
    break;
  }
}

if (isSequential) {
  console.log(`   ✅ First 20 frames cycle sequentially (0→1→2→...→7→0→...)`);
} else {
  console.log(`   ℹ️  Frame sequence is time-based, not necessarily strictly incremental (depends on animation speed)`);
}
