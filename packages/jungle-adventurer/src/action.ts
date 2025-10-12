/**
 * GitHub Action Entry Point
 * Fetches contribution data and generates Jungle Adventurer SVG
 */

import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import { generateJungleAdventurerSVG } from './index';
import { fetchContributionData } from './githubApi';

/**
 * Main action function
 */
async function run(): Promise<void> {
  try {
    // Get inputs (simplified!)
    const githubUserName = core.getInput('github_user_name', { required: true });
    const githubToken = core.getInput('github_token') || process.env.GITHUB_TOKEN || '';
    const outputPath = core.getInput('output_path') || 'jungle-adventurer.svg';

    // Color settings (only user-facing configuration)
    const colorScheme = core.getInput('color_scheme') || 'github-green';
    const customColors = core.getInput('custom_colors') || undefined;

    core.info(`🎮 Generating Jungle Adventurer animation for ${githubUserName}...`);
    core.info(`🎨 Color scheme: ${colorScheme}`);

    // Fetch contribution data
    core.info(`🎣 Fetching contribution data for ${githubUserName}...`);

    let contributionWeeks;
    if (!githubToken) {
      core.warning('⚠️  No GitHub token provided, using mock data for testing');
      const { generateMockContributionData } = await import('./githubApi');
      contributionWeeks = generateMockContributionData();
    } else {
      try {
        contributionWeeks = await fetchContributionData(githubUserName, githubToken);
      } catch (error: any) {
        core.warning(`⚠️  Failed to fetch real contribution data: ${error.message}`);
        core.warning('⚠️  Falling back to mock data');
        const { generateMockContributionData } = await import('./githubApi');
        contributionWeeks = generateMockContributionData();
      }
    }

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
