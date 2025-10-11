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
): Promise<ContributionGrid | null> {
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

  // Build weeks array
  const weeks = calendar.weeks.map((week: any) => {
    return week.contributionDays.map((day: any) => ({
      date: day.date,
      count: day.contributionCount,
    }));
  });

  // Find max contribution count for this year
  let maxCount = 0;
  calendar.weeks.forEach((week: any) => {
    week.contributionDays.forEach((day: any) => {
      maxCount = Math.max(maxCount, day.contributionCount);
    });
  });

  return {
    weeks,
    maxCount: Math.max(maxCount, 1),
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

    const grid = await fetchYearContributions(username, token, year, createdAt);

    if (grid) {
      yearlyContributions.push({ year, grid });
      console.log("  ✓ Year " + year + ": " + grid.weeks.length + " weeks, max count: " + grid.maxCount);
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
    const colorLevelsStr = core.getInput('color_levels') || '#ebedf0,#9be9a8,#40c463,#30a14e,#216e39';
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
