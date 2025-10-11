# gh-magic-matrix

A collection of GitHub Actions for creating various animations and visualizations from contribution matrices.

## Actions

### 🌊 Breathing Contribution Grid

Generate a breathing light effect animation from your GitHub contribution grid. Each cell breathes with intensity based on contribution count.

#### Examples

Default theme:
![Breathing Contribution Animation](https://raw.githubusercontent.com/YOUR_USERNAME/gh-magic-matrix/examples/breathing-contrib.svg)

Dark theme:
![Breathing Dark](https://raw.githubusercontent.com/YOUR_USERNAME/gh-magic-matrix/examples/breathing-contrib-dark.svg)

Ocean theme:
![Breathing Ocean](https://raw.githubusercontent.com/YOUR_USERNAME/gh-magic-matrix/examples/breathing-contrib-ocean.svg)

> 💡 **Live examples** are automatically generated daily and available in the [`examples` branch](../../tree/examples)

## Usage

### As a GitHub Action

Create a workflow file (e.g., `.github/workflows/breathing-grid.yml`):

```yaml
name: Generate Breathing Grid

on:
  schedule:
    - cron: "0 0 * * *"  # Daily at midnight
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Generate breathing contribution animation
        uses: YOUR_USERNAME/gh-magic-matrix@main
        with:
          github_user_name: ${{ github.repository_owner }}
          output_path: breathing-contrib.svg
          period: "3"
          color_levels: "#ebedf0,#9be9a8,#40c463,#30a14e,#216e39"

      - name: Commit and push
        run: |
          git config user.name github-actions[bot]
          git config user.email github-actions[bot]@users.noreply.github.com
          git add breathing-contrib.svg
          git commit -m "Update breathing grid" || exit 0
          git push
```

### Display in Your README

Add the generated SVG to your profile README:

```markdown
![Breathing Contribution Grid](./breathing-contrib.svg)
```

### Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `github_user_name` | GitHub username | (required) |
| `github_token` | GitHub token for API access | `${{ github.token }}` |
| `output_path` | Output SVG file path | `breathing-contrib.svg` |
| `cell_size` | Cell size in pixels | `12` |
| `cell_gap` | Gap between cells in pixels | `2` |
| `cell_radius` | Border radius in pixels | `2` |
| `period` | Breathing cycle duration (seconds) | `3` |
| `color_levels` | 5 colors: empty,low,med-low,med-high,high | GitHub default colors |

### Color Customization

Customize colors by providing 5 comma-separated hex colors:

```yaml
color_levels: "#f0f0f0,#ffb3ba,#ffdfba,#ffffba,#baffc9"
```

The colors represent:
1. Empty (no contributions)
2. Level 1 (low contributions)
3. Level 2 (medium-low)
4. Level 3 (medium-high)
5. Level 4 (high contributions)

## Packages

- `@magic-matrix/breathing-contrib`: Generate breathing light effect animations for GitHub contribution grids

## Development

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0

### Installation

```bash
bun install
```

### Build

```bash
bun run build
```

### Docker

Build the Docker image:

```bash
docker build -t gh-magic-matrix .
```

Run the container:

```bash
docker run gh-magic-matrix
```

### Publishing a Release

The project supports two Docker registry options:

#### Option 1: Docker Hub (Public, widely compatible)
1. Create a Docker Hub account at https://hub.docker.com
2. Add GitHub secrets to your repository:
   - `DOCKERHUB_USERNAME`: Your Docker Hub username
   - `DOCKERHUB_TOKEN`: Docker Hub access token
3. Trigger the release workflow manually from GitHub Actions

#### Option 2: GitHub Container Registry (ghcr.io) (Recommended)
1. No additional setup needed (uses `GITHUB_TOKEN`)
2. Free for public repositories
3. Integrated with GitHub
4. Trigger the release workflow manually

To create a release:
1. Go to Actions → Release workflow
2. Click "Run workflow"
3. Enter version (e.g., `1.0.0`) and description
4. The workflow will:
   - Build and push Docker image
   - Update `action.yml` with the new image digest
   - Create a Git tag and GitHub release

## License

MIT
