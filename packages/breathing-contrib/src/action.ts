import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import * as core from '@actions/core';
import { generateBreathingSVG } from './index';
import type { ContributionGrid, ContributionDay } from './index';

// Fetch GitHub contribution data and aggregate by day of year (MM-DD) across all years
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

  // Aggregate contributions by day of year (MM-DD)
  // Key: "01-01", "01-02", etc. (365 possible keys, 366 with leap day)
  const dayOfYearMap = new Map<string, { mmdd: string; totalCount: number; weekday: number }>();
  let maxCount = 0;

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
                  weekday
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

    // Aggregate contributions by MM-DD across all years
    calendar.weeks.forEach((week: any) => {
      week.contributionDays.forEach((day: any) => {
        // Extract MM-DD from date (YYYY-MM-DD)
        const mmdd = day.date.substring(5); // "01-15", "12-31", etc.

        if (dayOfYearMap.has(mmdd)) {
          // Add to existing count for this day of year
          const existing = dayOfYearMap.get(mmdd)!;
          existing.totalCount += day.contributionCount;
          maxCount = Math.max(maxCount, existing.totalCount);
        } else {
          // First time seeing this day of year
          dayOfYearMap.set(mmdd, {
            mmdd: mmdd,
            totalCount: day.contributionCount,
            weekday: day.weekday,
          });
          maxCount = Math.max(maxCount, day.contributionCount);
        }
      });
    });
  }

  // Build a full year grid starting from current day of year going back 365 days
  const currentMmdd = now.toISOString().substring(5, 10); // Current MM-DD

  // Get all days sorted by MM-DD
  const allDaysOfYear = Array.from(dayOfYearMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]));

  // Create weeks array (53 weeks x 7 days pattern like GitHub)
  const weeks: ContributionDay[][] = [];
  let currentWeek: ContributionDay[] = Array(7).fill(null).map(() => ({ date: '', count: 0 }));
  let dayCount = 0;

  allDaysOfYear.forEach(([mmdd, data]) => {
    const weekday = data.weekday;

    currentWeek[weekday] = {
      date: `2025-${mmdd}`, // Use current year for display
      count: data.totalCount,
    };

    dayCount++;

    // Every 7 days (or when we hit Saturday), start a new week
    if (weekday === 6) {
      weeks.push([...currentWeek]);
      currentWeek = Array(7).fill(null).map(() => ({ date: '', count: 0 }));
    }
  });

  // Push last week if it has data
  if (dayCount % 7 !== 0) {
    weeks.push(currentWeek);
  }

  return { weeks, maxCount: Math.max(maxCount, 1) };
}

// Main action logic
(async () => {
  try {
    // Get inputs using @actions/core
    const username = core.getInput('github_user_name', { required: true });
    const token = core.getInput('github_token') || process.env.GITHUB_TOKEN;
    const outputPath = core.getInput('output_path') || 'breathing-contrib.svg';
    const cellSize = parseInt(core.getInput('cell_size') || '12');
    const cellGap = parseInt(core.getInput('cell_gap') || '2');
    const cellRadius = parseInt(core.getInput('cell_radius') || '2');
    const period = parseFloat(core.getInput('period') || '6'); // Longer default for deeper breathing effect
    const colorLevelsStr = core.getInput('color_levels') || '#ebedf0,#9be9a8,#40c463,#30a14e,#216e39';
    const colorLevels = colorLevelsStr.split(',').map(c => c.trim());

    if (!token) {
      throw new Error('GitHub token is required');
    }

    // Validate period parameter
    if (period <= 0) {
      throw new Error(
        `Invalid period: ${period}. Must be a positive number (e.g., 3 for a 3-second breathing cycle).`
      );
    }

    console.log("🎣 Fetching contributions for user: " + username);

    // Fetch contribution data
    const grid = await fetchGitHubContributions(username, token);

    console.log("📊 Fetched " + grid.weeks.length + " weeks of data");
    console.log("📊 First week has " + (grid.weeks[0]?.length ?? 0) + " days");
    console.log("📊 Last week has " + (grid.weeks[grid.weeks.length - 1]?.length ?? 0) + " days");
    console.log("📈 Max contribution count: " + grid.maxCount);

    // Generate SVG
    console.log("🖌 Generating breathing SVG...");
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
    console.log("💾 Writing to " + outputPath);
    writeFileSync(outputPath, svg, 'utf-8');

    console.log("✅ SVG generated successfully!");
    console.log("📦 SVG size: " + (svg.length / 1024).toFixed(2) + " KB");

    // Set output for GitHub Actions
    core.setOutput('svg_path', outputPath);

  } catch (error: any) {
    core.setFailed(`Action failed with "${error.message}"`);
  }
})();

