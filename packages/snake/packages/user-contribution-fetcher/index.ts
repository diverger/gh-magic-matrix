/**
 * Interface for GitHub contribution fetcher options.
 */
export interface GitHubContributionOptions {
  githubToken: string;
}

/**
 * Represents a single contribution cell in the GitHub contribution grid.
 */
export interface ContributionCell {
  x: number;
  y: number;
  date: string;
  count: number;
  level: number;
}

/**
 * Internal GraphQL response structure for GitHub contributions.
 */
interface GraphQLResponse {
  user: {
    contributionsCollection: {
      contributionCalendar: {
        weeks: {
          contributionDays: {
            contributionCount: number;
            contributionLevel:
              | "FOURTH_QUARTILE"
              | "THIRD_QUARTILE"
              | "SECOND_QUARTILE"
              | "FIRST_QUARTILE"
              | "NONE";
            date: string;
            weekday: number;
          }[];
        }[];
      };
    };
  };
}

/**
 * Fetches the contribution grid from a GitHub user profile.
 *
 * @remarks
 * Retrieves the GitHub contribution calendar data for the specified user using the GitHub GraphQL API.
 * Returns a flattened array of contribution cells with normalized levels (0-4) and grid coordinates.
 * The time range defaults to the last year (as seen on GitHub profile pages).
 *
 * @param userName - The GitHub username to fetch contributions for.
 * @param options - Configuration options including the GitHub API token.
 * @returns Promise that resolves to an array of contribution cells.
 * @throws Error if the GitHub API request fails or returns an error.
 *
 * @example
 * ```typescript
 * const contributions = await fetchUserContributions("octocat", {
 *   githubToken: "your-token"
 * });
 * ```
 */
export const fetchUserContributions = async (
  userName: string,
  options: GitHubContributionOptions
): Promise<ContributionCell[]> => {
  const query = /* GraphQL */ `
    query ($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays {
                contributionCount
                contributionLevel
                weekday
                date
              }
            }
          }
        }
      }
    }
  `;
  const variables = { login: userName };

  const res = await fetch("https://api.github.com/graphql", {
    headers: {
      Authorization: `bearer ${options.githubToken}`,
      "Content-Type": "application/json",
      "User-Agent": "gh-magic-matrix",
    },
    method: "POST",
    body: JSON.stringify({ variables, query }),
  });

  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));

  const { data, errors } = (await res.json()) as {
    data: GraphQLResponse;
    errors?: { message: string }[];
  };

  if (errors?.[0]) throw errors[0];

  return data.user.contributionsCollection.contributionCalendar.weeks.flatMap(
    ({ contributionDays }, x) =>
      contributionDays.map((day): ContributionCell => ({
        x,
        y: day.weekday,
        date: day.date,
        count: day.contributionCount,
        level: convertContributionLevel(day.contributionLevel),
      }))
  );
};

/**
 * Converts GitHub GraphQL contribution level enum to numeric value.
 *
 * @param level - The GitHub contribution level enum.
 * @returns Numeric representation (0-4) where 0 is no contributions and 4 is highest.
 */
function convertContributionLevel(
  level:
    | "FOURTH_QUARTILE"
    | "THIRD_QUARTILE"
    | "SECOND_QUARTILE"
    | "FIRST_QUARTILE"
    | "NONE"
): number {
  switch (level) {
    case "FOURTH_QUARTILE":
      return 4;
    case "THIRD_QUARTILE":
      return 3;
    case "SECOND_QUARTILE":
      return 2;
    case "FIRST_QUARTILE":
      return 1;
    case "NONE":
    default:
      return 0;
  }
}

/**
 * Type alias for the result of fetchUserContributions function.
 */
export type GitHubContributionResult = ContributionCell[];

/**
 * @deprecated Use ContributionCell instead.
 */
export type Cell = ContributionCell;
