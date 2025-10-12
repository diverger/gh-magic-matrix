/**
 * GitHub API Integration
 * Fetches real contribution data using GitHub GraphQL API
 */

import type { ContributionWeek, ContributionDay } from './index';

/**
 * Fetch GitHub contribution data for the last 53 weeks
 */
export async function fetchContributionData(
  username: string,
  token: string
): Promise<ContributionWeek[]> {
  const query = `
    query($userName: String!) {
      user(login: $userName) {
        contributionsCollection {
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
      'User-Agent': 'gh-magic-matrix-jungle-adventurer',
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

  // Calculate max count for level scaling
  let maxCount = 0;
  calendar.weeks.forEach((week: any) => {
    week.contributionDays.forEach((day: any) => {
      maxCount = Math.max(maxCount, day.contributionCount);
    });
  });

  // Convert to our format with levels (0-4)
  const weeks: ContributionWeek[] = calendar.weeks.map((week: any) => ({
    days: week.contributionDays.map((day: any) => {
      const count = day.contributionCount;

      // Calculate level (0-4) similar to GitHub's color scheme
      let level: number;
      if (count === 0) {
        level = 0;
      } else if (maxCount === 0) {
        level = 0;
      } else {
        // Scale to 1-4 based on contribution count
        const percentage = count / maxCount;
        if (percentage >= 0.75) level = 4;
        else if (percentage >= 0.5) level = 3;
        else if (percentage >= 0.25) level = 2;
        else level = 1;
      }

      return {
        date: day.date,
        count: count,
        level: level,
      } as ContributionDay;
    }),
  }));

  return weeks;
}

/**
 * Generate mock contribution data for testing
 * Only use this when GitHub API is not available
 */
export function generateMockContributionData(): ContributionWeek[] {
  const weeks: ContributionWeek[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 371); // ~53 weeks ago

  for (let weekIndex = 0; weekIndex < 53; weekIndex++) {
    const days: ContributionDay[] = [];

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + weekIndex * 7 + dayIndex);

      const count = Math.floor(Math.random() * 20);
      const level = count === 0 ? 0 : Math.ceil(count / 5);

      days.push({
        date: currentDate.toISOString().split('T')[0],
        count: Math.min(count, 20),
        level: Math.min(level, 4),
      });
    }

    weeks.push({ days });
  }

  return weeks;
}
