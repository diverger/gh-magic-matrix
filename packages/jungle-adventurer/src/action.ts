/**
 * GitHub Action Entry Point
 * Fetches contribution data and generates Jungle Adventurer SVG
 */

import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import { generateJungleAdventurerSVG, ContributionWeek } from './index';

/**
 * Load sprite sheet from file and convert to base64 data URL
 * NOTE: Not used anymore - sprites are loaded automatically from built-in assets
 */
async function loadSpriteSheet(filePath: string): Promise<string> {
  try {
    const imageBuffer = fs.readFileSync(filePath);
    const base64 = imageBuffer.toString('base64');
    const mimeType = filePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    throw new Error(`Failed to load sprite sheet from ${filePath}: ${error}`);
  }
}

/**
 * Fetch GitHub contribution data
 * (Simplified version - you may want to use the actual GitHub API)
 */
async function fetchContributionData(
  username: string,
  token?: string
): Promise<ContributionWeek[]> {
  // TODO: Implement actual GitHub GraphQL API call
  // For now, return mock data

  const weeks: ContributionWeek[] = [];
  const numWeeks = 53;

  for (let w = 0; w < numWeeks; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const count = Math.floor(Math.random() * 20);
      const level = count === 0 ? 0 : Math.min(4, Math.floor(count / 5) + 1);

      days.push({
        date: new Date(2024, 0, 1 + w * 7 + d).toISOString().split('T')[0],
        count,
        level,
      });
    }
    weeks.push({ days });
  }

  return weeks;
}

/**
 * Main action function
 */
async function run(): Promise<void> {
  try {
    // Get inputs (simplified!)
    const githubUserName = core.getInput('github_user_name', { required: true });
    const githubToken = core.getInput('github_token') || process.env.GITHUB_TOKEN;
    const outputPath = core.getInput('output_path') || 'jungle-adventurer.svg';

    // Color settings (only user-facing configuration)
    const colorScheme = core.getInput('color_scheme') || 'github-green';
    const customColors = core.getInput('custom_colors') || undefined;

    core.info(`🎮 Generating Jungle Adventurer animation for ${githubUserName}...`);
    core.info(`🎨 Color scheme: ${colorScheme}`);

    // Fetch contribution data
    core.info(`🎣 Fetching contribution data for ${githubUserName}...`);
    const contributionWeeks = await fetchContributionData(githubUserName, githubToken);
    core.info(`📊 Found ${contributionWeeks.length} weeks of contributions`);

    // Generate SVG (sprites are loaded automatically from built-in assets)
    core.info(`🎨 Generating animated SVG with 8-directional sprites...`);
    const svg = generateJungleAdventurerSVG(contributionWeeks, {
      colorScheme,
      customColors,
      // All other settings use sensible defaults
    });

    // Write output
    core.info(`💾 Writing to ${outputPath}...`);
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(outputPath, svg, 'utf-8');

    core.info(`✅ Successfully generated Jungle Adventurer animation!`);
    core.setOutput('output_path', outputPath);

  } catch (error: any) {
    core.setFailed(`Action failed: ${error.message}`);
    console.error(error);
  }
}

// Run the action
run();
