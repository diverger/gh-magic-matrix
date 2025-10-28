# User Contribution Fetcher

A TypeScript package for fetching GitHub user contribution data via the GitHub GraphQL API.

## Features

- Fetch GitHub contribution calendar data for any user
- Normalize contribution levels to 0-4 scale
- Type-safe with full TypeScript support
- Clean, well-documented API

## Usage

```typescript
import { fetchUserContributions } from "@snake/user-contribution-fetcher";

const contributions = await fetchUserContributions("octocat", {
  githubToken: "your-github-token"
});

// contributions is an array of ContributionCell objects
// Each cell contains: x, y, date, count, level (0-4)
```

## API

### `fetchUserContributions(userName, options)`

Fetches the contribution grid from a GitHub user profile.

**Parameters:**
- `userName` (string): GitHub username
- `options` (GitHubContributionOptions): Configuration object with `githubToken`

**Returns:** Promise<ContributionCell[]>

### Types

- `ContributionCell`: Represents a single contribution cell
- `GitHubContributionOptions`: Configuration options
- `GitHubContributionResult`: Type alias for the result array
