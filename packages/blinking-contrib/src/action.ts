import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import * as core from '@actions/core';
import { generateBlinkingSVG } from './index';
import type { ContributionGrid, YearlyContribution } from './index';
import type { FontSize } from './pixelFont';

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

  // First, calculate the date range for the 53-week grid
  const isCurrentYear = year === currentYear;

  // End date: today for current year, Dec 31 for past years
  const endDate = isCurrentYear ? now : new Date(year, 11, 31);  // Find the Saturday on or after the end date (grid ends on Saturday)
  const lastSaturday = new Date(endDate);
  const endWeekday = endDate.getDay();
  if (endWeekday < 6) {
    lastSaturday.setDate(lastSaturday.getDate() + (6 - endWeekday));
  }

  // Calculate start date: 53 weeks (371 days) before the last Saturday
  const firstSunday = new Date(lastSaturday);
  firstSunday.setDate(firstSunday.getDate() - (53 * 7 - 1));

  // Query API from the calculated start date (may be in previous year) to end date
  const from = firstSunday.toISOString();
  const to = lastSaturday.toISOString();

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

  // Build a map of all actual contribution data by date
  const contributionMap = new Map<string, number>();
  calendar.weeks.forEach((week: any) => {
    week.contributionDays.forEach((day: any) => {
      contributionMap.set(day.date, day.contributionCount);
    });
  });

  // Build exactly 53 weeks from firstSunday (already calculated above)
  const weeks: any[][] = [];
  let currentDate = new Date(firstSunday);
  let maxCount = 0;

  for (let weekIdx = 0; weekIdx < 53; weekIdx++) {
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

  // All frames are same size (53 weeks), no offset needed
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
        weekOffset: 0 // All frames are 53 weeks, no offset needed
      });
      console.log("  ✓ Year " + year + ": " + gridData.weeks.length + " weeks (fixed 53-week grid), max count: " + gridData.maxCount);
    }
  }

  return yearlyContributions;
}// Main action logic
(async () => {
  try {
    // Get inputs using @actions/core
    const username = core.getInput('github_user_name', { required: true });
    const token = core.getInput('github_token') || process.env.GITHUB_TOKEN;
    const outputPath = core.getInput('output_path') || 'blinking-contrib.svg';
    const cellSize = parseInt(core.getInput('cell_size') || '12');
    const cellGap = parseInt(core.getInput('cell_gap') || '2');
    const cellRadius = parseInt(core.getInput('cell_radius') || '2');
    const frameDuration = parseFloat(core.getInput('frame_duration') || '3');
    const transitionDuration = parseFloat(core.getInput('transition_duration') || '0.8');
    const colorLevelsStr = core.getInput('color_levels') || '#161b22,#0e4429,#006d32,#26a641,#39d353';
    const colorLevels = colorLevelsStr.split(',').map(c => c.trim());
    const endingText = core.getInput('ending_text') || username.toUpperCase(); // Default to username
    const fontSizeInput = core.getInput('font_size') || '5x7'; // Default to standard 5x7 font
    const fontSize: FontSize = fontSizeInput === '3x5' ? '3x5' : '5x7';
    const textFrameDuration = parseFloat(core.getInput('text_frame_duration') || (frameDuration * 2).toString());

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

    // Note: We now allow transition_duration >= frame_duration/2 to enable overlapping fades
    // This creates a chaotic, jittery screen effect where multiple frames are partially visible at once

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
      endingText,
      fontSize,
      textFrameDuration,
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
