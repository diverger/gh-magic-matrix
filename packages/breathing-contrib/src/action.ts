import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import * as core from '@actions/core';
import { generateBreathingSVG } from './index';
import type { ContributionGrid } from './index';

// Fetch GitHub contribution data
async function fetchGitHubContributions(username: string, token: string): Promise<ContributionGrid> {
  const query = `
    query($userName:String!) {
      user(login: $userName){
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'gh-magic-matrix',
    },
    body: JSON.stringify({
      query,
      variables: { userName: username },
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub API request failed: ${response.statusText}`);
  }

  const data = await response.json() as any;

  if (data.errors) {
    throw new Error(`GitHub API errors: ${JSON.stringify(data.errors)}`);
  }

  const calendar = data.data.user.contributionsCollection.contributionCalendar;

  const weeks = calendar.weeks.map((week: any) =>
    week.contributionDays.map((day: any) => ({
      date: day.date,
      count: day.contributionCount,
    }))
  );

  const maxCount = Math.max(...weeks.flat().map((d: any) => d.count), 1);

  return { weeks, maxCount };
}

// Main action logic
(async () => {
  try {
    // Get inputs using @actions/core
    const username = core.getInput('github_user_name', { required: true });
    const token = process.env.GITHUB_TOKEN ?? core.getInput('github_token');
    const outputPath = core.getInput('output_path') || 'breathing-contrib.svg';
    const cellSize = parseInt(core.getInput('cell_size') || '12');
    const cellGap = parseInt(core.getInput('cell_gap') || '2');
    const cellRadius = parseInt(core.getInput('cell_radius') || '2');
    const period = parseFloat(core.getInput('period') || '3');
    const colorLevelsStr = core.getInput('color_levels') || '#ebedf0,#9be9a8,#40c463,#30a14e,#216e39';
    const colorLevels = colorLevelsStr.split(',').map(c => c.trim());

    if (!token) {
      throw new Error('GitHub token is required');
    }

    console.log(`🎣 Fetching contributions for user: ${username}`);

    // Fetch contribution data
    const grid = await fetchGitHubContributions(username, token);

    console.log(`📊 Fetched ${grid.weeks.length} weeks of data`);
    console.log(`📈 Max contribution count: ${grid.maxCount}`);

    // Generate SVG
    console.log(`🖌 Generating breathing SVG...`);
    const svg = generateBreathingSVG(grid, {
      cellSize,
      cellGap,
      cellRadius,
      period,
      colorLevels,
    });

    // Ensure output directory exists
    const dir = dirname(outputPath);
    mkdirSync(dir, { recursive: true });

    // Write output file
    console.log(`💾 Writing to ${outputPath}`);
    writeFileSync(outputPath, svg, 'utf-8');

    console.log(`✅ SVG generated successfully!`);
    console.log(`📦 SVG size: ${(svg.length / 1024).toFixed(2)} KB`);

    // Set output for GitHub Actions
    core.setOutput('svg_path', outputPath);

  } catch (error: any) {
    core.setFailed(`Action failed with "${error.message}"`);
  }
})();

