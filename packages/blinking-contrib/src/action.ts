import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import * as core from '@actions/core';
import { generateBlinkingSVG } from './index';
import type { ContributionGrid, YearlyContribution } from './index';

// Fetch GitHub contribution data for a specific year
async function fetchYearContributions(
  username: string,
  token: string,
  year: number,
  userCreatedAt: Date
): Promise<{ weeks: any[][]; maxCount: number; weekOffset: number } | null> {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Skip years before account creation
  if (year < userCreatedAt.getFullYear()) {
    return null;
  }

  // Skip years in the future
  if (year > currentYear) {
    return null;
  }

  const from = year === userCreatedAt.getFullYear()
    ? userCreatedAt.toISOString()
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

  // Create a full year grid (Jan 1 - Dec 31) with 0 for missing data
  // This ensures all years have the same structure for proper alignment

  // Build a map of all actual contribution data by date
  const contributionMap = new Map<string, number>();
  calendar.weeks.forEach((week: any) => {
    week.contributionDays.forEach((day: any) => {
      contributionMap.set(day.date, day.contributionCount);
    });
  });

  // Generate full year grid starting from Jan 1
  const yearStart = new Date(year, 0, 1); // January 1st
  const yearEnd = new Date(year, 11, 31); // December 31st

  // Find the Sunday before or on Jan 1 (GitHub grids start on Sunday)
  const firstSunday = new Date(yearStart);
  const jan1Weekday = yearStart.getDay(); // 0 = Sunday, 6 = Saturday
  if (jan1Weekday > 0) {
    firstSunday.setDate(firstSunday.getDate() - jan1Weekday);
  }

  // Find the Saturday after or on Dec 31
  const lastSaturday = new Date(yearEnd);
  const dec31Weekday = yearEnd.getDay();
  if (dec31Weekday < 6) {
    lastSaturday.setDate(lastSaturday.getDate() + (6 - dec31Weekday));
  }

  // Build weeks array with full year coverage
  const weeks: any[][] = [];
  let currentDate = new Date(firstSunday);
  let maxCount = 0;

  while (currentDate <= lastSaturday) {
    const week: any[] = [];

    // Build one week (7 days)
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const dateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const count = contributionMap.get(dateStr) || 0;

      week.push({
        date: dateStr,
        count: count,
      });

      maxCount = Math.max(maxCount, count);

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    weeks.push(week);
  }

  // weekOffset is always 0 now since all years start from the week containing Jan 1
  const weekOffset = 0;

  return {
    weeks,
    maxCount: Math.max(maxCount, 1),
    weekOffset,
  };
}

// Fetch all yearly contributions
async function fetchAllYearlyContributions(
  username: string,
  token: string
): Promise<YearlyContribution[]> {
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
  const startYear = createdAt.getFullYear();
  const currentYear = now.getFullYear();

  const yearlyContributions: YearlyContribution[] = [];

  // Fetch contributions for each year
  for (let year = startYear; year <= currentYear; year++) {
    console.log("🎬 Fetching contributions for year " + year + "...");

    const gridData = await fetchYearContributions(username, token, year, createdAt);

    if (gridData) {
      yearlyContributions.push({
        year,
        grid: { weeks: gridData.weeks, maxCount: gridData.maxCount },
        weekOffset: gridData.weekOffset
      });
      console.log("  ✓ Year " + year + ": " + gridData.weeks.length + " weeks, weekOffset: " + gridData.weekOffset + ", max count: " + gridData.maxCount);
    }
  }

  return yearlyContributions;
}

// Main action logic
(async () => {
  try {
    // Get inputs using @actions/core
    const username = core.getInput('github_user_name', { required: true });
    const token = core.getInput('github_token') || process.env.GITHUB_TOKEN;
    const outputPath = core.getInput('output_path') || 'blinking-contrib.svg';
    const cellSize = parseInt(core.getInput('cell_size') || '12');
    const cellGap = parseInt(core.getInput('cell_gap') || '2');
    const cellRadius = parseInt(core.getInput('cell_radius') || '2');
    const frameDuration = parseFloat(core.getInput('frame_duration') || '1.5');
    const transitionDuration = parseFloat(core.getInput('transition_duration') || '0.3');
    const colorLevelsStr = core.getInput('color_levels') || '#161b22,#0e4429,#006d32,#26a641,#39d353';
    const colorLevels = colorLevelsStr.split(',').map(c => c.trim());

    if (!token) {
      throw new Error('GitHub token is required');
    }

    // Validate timing parameters early
    if (frameDuration <= 0) {
      throw new Error(
        `Invalid frame_duration: ${frameDuration}. Must be a positive number (e.g., 2 for 2 seconds per year).`
      );
    }

    if (transitionDuration < 0) {
      throw new Error(
        `Invalid transition_duration: ${transitionDuration}. Must be non-negative (e.g., 0.5 for 0.5 second fade).`
      );
    }

    const maxTransitionDuration = frameDuration / 2;
    if (transitionDuration >= maxTransitionDuration) {
      throw new Error(
        `Invalid timing: transition_duration (${transitionDuration}s) must be strictly less than half of frame_duration (${maxTransitionDuration}s). ` +
        `Equal values create zero-length spline segments with duplicate keyTimes, which are invalid in SMIL animations. ` +
        `Please use transition_duration < ${maxTransitionDuration}s or increase frame_duration.`
      );
    }

    console.log("✨ Blinking Contribution Generator");
    console.log("👤 User: " + username);
    console.log("⏱️  Frame duration: " + frameDuration + "s, Transition: " + transitionDuration + "s");

    // Fetch all yearly contribution data
    console.log("🎣 Fetching all yearly contributions...");
    const yearlyContributions = await fetchAllYearlyContributions(username, token);

    console.log("📊 Total years: " + yearlyContributions.length);

    if (yearlyContributions.length === 0) {
      throw new Error('No contribution data found');
    }

    // Generate blinking SVG
    console.log("🌟 Generating blinking SVG with year transitions...");
    const svg = generateBlinkingSVG(yearlyContributions, {
      cellSize,
      cellGap,
      cellRadius,
      frameDuration,
      transitionDuration,
      colorLevels,
    });

    // Ensure output directory exists
    const dir = dirname(outputPath);
    mkdirSync(dir, { recursive: true });

    // Write output file
    console.log("💾 Writing to " + outputPath);
    writeFileSync(outputPath, svg, 'utf-8');

    console.log("✅ Blinking SVG generated successfully!");
    console.log("📦 SVG size: " + (svg.length / 1024).toFixed(2) + " KB");
    console.log("🎬 Animation: " + yearlyContributions.length + " years × " + frameDuration + "s = " + (yearlyContributions.length * frameDuration) + "s total cycle");

    // Set output for GitHub Actions
    core.setOutput('svg_path', outputPath);
    core.setOutput('years_count', yearlyContributions.length.toString());

  } catch (error: any) {
    core.setFailed("Action failed with \"" + error.message + "\"");
  }
})();
