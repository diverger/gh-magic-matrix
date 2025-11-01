/**
 * Test custom snake interpolation optimization
 * Compares optimized vs non-optimized keyframe counts
 */

import * as fs from "fs";
import * as path from "path";
import { generateContributionSnake } from "../../packages/snake/src/generate-contribution-snake";
import { parseOutputsOption } from "../../packages/snake/src/outputs-options";

const username = "diverger";

// Get repo root
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

console.log("🧪 Testing Custom Snake Interpolation Optimization");
console.log("=".repeat(60));
console.log();

async function testOptimization() {
  const githubToken = loadGitHubToken();
  const OUTPUT_PATH = path.join(REPO_ROOT, "test-outputs", "custom-snake-optimized.svg");

  console.log("🎨 Generating emoji snake with optimization...");

  const outputs = parseOutputsOption([`${OUTPUT_PATH}?palette=github-light`]);

  // Apply emoji configuration
  outputs.forEach(output => {
    if (output && output.drawOptions) {
      output.drawOptions.useEmojiSnake = true;
      output.drawOptions.emojiSnakeConfig = {
        segments: ["🐍", "🟢", "🔵", "🟡"],
        defaultEmoji: "⚪",
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
  console.log(`   📦 Average keyframes per segment: ${(totalKeyframeRules / keyframeCount).toFixed(1)}`);
  console.log(`   💾 File size: ${fileSizeKB} KB`);
  console.log();

  // Calculate theoretical unoptimized size
  // If snake has 834 frames and 4 segments, that would be 834 keyframes per segment
  const theoreticalUnoptimizedKeyframes = 834 * snakeSegments;
  const theoreticalReduction = ((1 - totalKeyframeRules / theoreticalUnoptimizedKeyframes) * 100).toFixed(1);

  console.log("🔍 Optimization Analysis:");
  console.log("-".repeat(60));
  console.log(`   📊 Theoretical unoptimized keyframes: ${theoreticalUnoptimizedKeyframes}`);
  console.log(`   ✨ Actual keyframes (optimized): ${totalKeyframeRules}`);
  console.log(`   🎯 Reduction: ${theoreticalReduction}% fewer keyframes`);
  console.log();

  // Analyze keyframe distribution
  const keyframeRulesPerAnimation = totalKeyframeRules / keyframeCount;
  const compressionRatio = (834 / keyframeRulesPerAnimation).toFixed(1);

  console.log("💡 Performance Impact:");
  console.log("-".repeat(60));
  console.log(`   🚀 Compression ratio: ${compressionRatio}x`);
  console.log(`   📉 Each animation uses ~${keyframeRulesPerAnimation.toFixed(0)} keyframes instead of 834`);
  console.log(`   ⚡ Browser interpolates ${(834 - keyframeRulesPerAnimation).toFixed(0)} frames automatically`);
  console.log();

  console.log("✅ Test completed!");
  console.log();
  console.log("💡 To verify visually:");
  console.log("   1. Open test-outputs/custom-snake-optimized.svg in a browser");
  console.log("   2. Animation should be smooth despite fewer keyframes");
  console.log("   3. Browser CSS interpolation fills in the missing frames");
}

testOptimization().catch(console.error);
