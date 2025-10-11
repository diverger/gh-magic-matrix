import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import * as core from '@actions/core';
import { generateBreathingSVG } from './index';
import type { ContributionGrid } from './index';

// Fetch GitHub contribution data for all years since registration
async function fetchGitHubContributions(username: string, token: string): Promise<ContributionGrid> {
  // First, get the user's creation date
  const userQuery = `
    query($userName:String!) {
      user(login: $userName){
        createdAt
      }
    }
  `;

  const userResponse = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'gh-magic-matrix',
    },
    body: JSON.stringify({
      query: userQuery,
      variables: { userName: username },
    }),
  });

  if (!userResponse.ok) {
    throw new Error(`GitHub API request failed: ${userResponse.statusText}`);
  }

  const userData = await userResponse.json() as any;

  if (userData.errors) {
    throw new Error(`GitHub API errors: ${JSON.stringify(userData.errors)}`);
  }

  const createdAt = new Date(userData.data.user.createdAt);
  const now = new Date();

  // Fetch contributions year by year
  const allWeeks: any[] = [];
  let maxCount = 0;

  // Start from creation year to current year
  const startYear = createdAt.getFullYear();
  const currentYear = now.getFullYear();

  for (let year = startYear; year <= currentYear; year++) {
    const from = year === startYear
      ? createdAt.toISOString()
      : `${year}-01-01T00:00:00Z`;
    const to = year === currentYear
      ? now.toISOString()
      : `${year}-12-31T23:59:59Z`;

    const query = `
      query($userName:String!, $from:DateTime!, $to:DateTime!) {
        user(login: $userName){
          contributionsCollection(from: $from, to: $to) {
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
        variables: { userName: username, from, to },
      }),
    });

    if (!response.ok) {
      throw new Error(`GitHub API request failed for year ${year}: ${response.statusText}`);
    }

    const data = await response.json() as any;

    if (data.errors) {
      throw new Error(`GitHub API errors for year ${year}: ${JSON.stringify(data.errors)}`);
    }

    const calendar = data.data.user.contributionsCollection.contributionCalendar;

    // Process weeks and days
    calendar.weeks.forEach((week: any) => {
      const days = week.contributionDays.map((day: any) => {
        maxCount = Math.max(maxCount, day.contributionCount);
        return {
          date: day.date,
          count: day.contributionCount,
        };
      });

      if (days.length > 0) {
        allWeeks.push(days);
      }
    });
  }

  return { weeks: allWeeks, maxCount: Math.max(maxCount, 1) };
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

