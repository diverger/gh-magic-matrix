/**
 * Test custom snake interpolation optimization
 * Compares optimized vs non-optimized keyframe counts
 */

import * as fs from "fs";
import * as path from "path";
import { generateContributionSnake } from "../../packages/snake/src/generate-contribution-snake";
import { parseOutputsOption } from "../../packages/snake/src/outputs-options";
import { loadGitHubToken } from "../utils/env-loader";

const username = "diverger";

// Get repo root
const REPO_ROOT = path.resolve(process.cwd());

console.log("🧪 Testing Custom Snake Interpolation Optimization");
console.log("=".repeat(60));
console.log();

async function testOptimization() {
  const githubToken = loadGitHubToken(REPO_ROOT);
  const OUTPUT_PATH = path.join(REPO_ROOT, "test-outputs", "custom-snake-optimized.svg");

  console.log("🎨 Generating custom snake with optimization...");
  const outputs = parseOutputsOption([`${OUTPUT_PATH}?palette=github-light`]);

  // Apply custom content configuration
  outputs.forEach(output => {
    if (output && output.drawOptions) {
      output.drawOptions.useCustomSnake = true;
      output.drawOptions.customSnakeConfig = {
        segments: ["🐍", "🟢", "🔵", "🟡"],
        defaultContent: "⚪",
      };
    }
  });

  const results = await generateContributionSnake(username, outputs, { githubToken });

  // Write results to files
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

  if (!fs.existsSync(OUTPUT_PATH)) {
    console.error("❌ Failed to generate snake");
    return;
  }

  const svgContent = fs.readFileSync(OUTPUT_PATH, "utf8");

  // Extract animation duration to determine route length
  // Animation format: "animation: snake-segment-0 83300ms linear infinite"
  const animationDurationMatch = svgContent.match(/animation:\s*snake-segment-\d+\s+(\d+)ms/);
  const animationDurationMs = animationDurationMatch ? parseInt(animationDurationMatch[1], 10) : 0;
  const routeLength = animationDurationMs / 100; // Each frame is 100ms by default

  // Count @keyframes declarations
  const keyframeMatches = svgContent.match(/@keyframes/g);
  const keyframeCount = keyframeMatches ? keyframeMatches.length : 0;

  // Count total keyframe rules (0%, 50%, 100%, etc.)
  const percentMatches = svgContent.match(/\d+(\.\d+)?%\s*{/g);
  const totalKeyframeRules = percentMatches ? percentMatches.length : 0;

  // Estimate file size
  const fileSizeKB = (svgContent.length / 1024).toFixed(2);

  // Extract animation count (snake segments)
  const snakeSegments = keyframeCount / 1; // Each segment has 1 keyframe animation

  console.log();
  console.log("📊 Optimization Results:");
  console.log("-".repeat(60));
  console.log(`   🐍 Snake segments: ${snakeSegments}`);
  console.log(`   🎬 @keyframes animations: ${keyframeCount}`);
  console.log(`   📍 Total keyframe rules: ${totalKeyframeRules}`);
  console.log(`   📦 Average keyframes per segment: ${keyframeCount > 0 ? (totalKeyframeRules / keyframeCount).toFixed(1) : 'N/A'}`);
  console.log(`   💾 File size: ${fileSizeKB} KB`);
  console.log();

  // Validate route length extraction
  if (routeLength === 0) {
    console.warn("⚠️  Warning: Could not extract route length from SVG");
    console.log();
    return;
  }

  // Calculate theoretical unoptimized size
  // If snake has N frames and 4 segments, that would be N keyframes per segment
  const theoreticalUnoptimizedKeyframes = routeLength * snakeSegments;
  const theoreticalReduction = theoreticalUnoptimizedKeyframes === 0
    ? "0.0"
    : ((1 - totalKeyframeRules / theoreticalUnoptimizedKeyframes) * 100).toFixed(1);

  console.log("🔍 Optimization Analysis:");
  console.log("-".repeat(60));
  console.log(`   📏 Route length: ${routeLength} frames`);
  console.log(`   📊 Theoretical unoptimized keyframes: ${theoreticalUnoptimizedKeyframes}`);
  console.log(`   ✨ Actual keyframes (optimized): ${totalKeyframeRules}`);
  console.log(`   🎯 Reduction: ${theoreticalReduction}% fewer keyframes`);
  console.log();

  // Guard against division by zero
  if (keyframeCount === 0) {
    console.warn("⚠️  Warning: No keyframes found in SVG");
    console.log();
    console.log("✅ Test completed!");
    console.log();
    return;
  }

  // Analyze keyframe distribution
  const keyframeRulesPerAnimation = totalKeyframeRules / keyframeCount;
  const compressionRatio = (routeLength / keyframeRulesPerAnimation).toFixed(1);

  console.log("💡 Performance Impact:");
  console.log("-".repeat(60));
  console.log(`   🚀 Compression ratio: ${compressionRatio}x`);
  console.log(`   📉 Each animation uses ~${keyframeRulesPerAnimation.toFixed(0)} keyframes instead of ${routeLength}`);
  console.log(`   ⚡ Browser interpolates ${(routeLength - keyframeRulesPerAnimation).toFixed(0)} frames automatically`);
  console.log();

  console.log("✅ Test completed!");
  console.log();
  console.log("💡 To verify visually:");
  console.log("   1. Open test-outputs/custom-snake-optimized.svg in a browser");
  console.log("   2. Animation should be smooth despite fewer keyframes");
  console.log("   3. Browser CSS interpolation fills in the missing frames");
}

testOptimization().catch(console.error);
