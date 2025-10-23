# Breathing Contribution Grid

Generate a breathing light effect animation from your GitHub contribution grid. Each cell breathes with intensity based on contribution count.

<picture>
  <source
    media="(prefers-color-scheme: dark)"
    srcset="https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/breathing-contrib/dark.svg"
  />
  <source
    media="(prefers-color-scheme: light)"
    srcset="https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/breathing-contrib/light.svg"
  />
  <img
    alt="breathing contribution grid animation"
    src="https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/breathing-contrib/dark.svg"
  />
</picture>

## Features

- **Breathing Animation**: Cells pulse with intensity based on contribution count
- **Theme Support**: Automatic light/dark theme detection
- **GitHub Integration**: Fetches real contribution data via GitHub API
- **Customizable**: Configure colors, timing, and cell appearance

## Usage

### Basic Usage

```yaml
name: Generate Breathing Animation
on:
  schedule:
    - cron: "0 0 * * *"  # Daily at midnight
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - name: Generate breathing contribution animation
        uses: diverger/gh-magic-matrix@main
        with:
          github_user_name: ${{ github.repository_owner }}
          output_path: dist/breathing-contrib/dark.svg
```

### Advanced Configuration

```yaml
- name: Generate custom breathing animation
  uses: diverger/gh-magic-matrix@main
  with:
    github_user_name: ${{ github.repository_owner }}
    github_token: ${{ secrets.GITHUB_TOKEN }}
    output_path: breathing-contrib.svg
    cell_size: "15"
    cell_gap: "3"
    cell_radius: "3"
    period: "4"
    color_levels: "#f0f0f0,#ffb3ba,#ffdfba,#ffffba,#baffc9"
```

## Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `github_user_name` | GitHub username | (required) |
| `github_token` | GitHub token for API access | `${{ github.token }}` |
| `output_path` | Output SVG file path | `breathing-contrib.svg` |
| `cell_size` | Cell size in pixels | `12` |
| `cell_gap` | Gap between cells in pixels | `2` |
| `cell_radius` | Border radius in pixels | `2` |
| `period` | Breathing cycle duration (seconds) | `6` |
| `color_levels` | 5 colors: empty,low,med-low,med-high,high | GitHub default colors |

## Outputs

| Output | Description |
|--------|-------------|
| `svg_path` | Path to the generated SVG file |
| `total_contributions` | Total number of contributions found |
| `animation_duration` | Duration of the breathing cycle |

## Color Customization

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

### Pre-defined Color Themes

**GitHub Dark Theme (default):**
```yaml
color_levels: "#161b22,#0e4429,#006d32,#26a641,#39d353"
```

**GitHub Light Theme:**
```yaml
color_levels: "#ebedf0,#9be9a8,#40c463,#30a14e,#216e39"
```

**Pastel Theme:**
```yaml
color_levels: "#f0f0f0,#ffb3ba,#ffdfba,#ffffba,#baffc9"
```

## Display in Your README

Add the generated SVG to your profile README with theme support:

```markdown
<!-- Breathing animation with theme support -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/USERNAME/REPO/output/breathing-contrib/dark.svg" />
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/USERNAME/REPO/output/breathing-contrib/light.svg" />
  <img alt="Breathing Contribution Grid" src="https://raw.githubusercontent.com/USERNAME/REPO/output/breathing-contrib/dark.svg" />
</picture>
```html

Or for simple display without theme switching:

```markdown
![Breathing Contribution Grid](https://raw.githubusercontent.com/USERNAME/REPO/output/breathing-contrib/dark.svg)
```

## Examples

- [Light theme](https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/breathing-contrib/light.svg)
- [Dark theme](https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/breathing-contrib/dark.svg)

## License

This project is part of the gh-magic-matrix collection and follows the same licensing terms.