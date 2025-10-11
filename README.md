# gh-magic-matrix

A collection of GitHub Actions for creating various animations and visualizations from contribution matrices.

## 🚀 Quick Start

```yaml
# Breathing animation - aggregates all history, cells breathe
- uses: diverger/gh-magic-matrix@main
  with:
    github_user_name: ${{ github.repository_owner }}
    output_path: dist/breathing-contrib/default.svg

# Blinking animation - shows years sequentially with fade transitions
- uses: diverger/gh-magic-matrix/blinking-contrib@main
  with:
    github_user_name: ${{ github.repository_owner }}
    output_path: dist/blinking-contrib/default.svg
```

## Actions

### 🌊 Breathing Contribution Grid

Generate a breathing light effect animation from your GitHub contribution grid. Each cell breathes with intensity based on contribution count.

<picture>
  <source
    media="(prefers-color-scheme: dark)"
    srcset="https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/breathing-contrib/dark.svg"
  />
  <source
    media="(prefers-color-scheme: light)"
    srcset="https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/breathing-contrib/default.svg"
  />
  <img
    alt="breathing contribution grid animation"
    src="https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/breathing-contrib/default.svg"
  />
</picture>

#### More Examples

- [Default theme](https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/breathing-contrib/default.svg)
- [Dark theme](https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/breathing-contrib/dark.svg)
- [Ocean theme](https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/breathing-contrib/ocean.svg)

### ✨ Blinking Contribution Timeline

Generate an animated SVG that displays your GitHub contributions **year by year** with smooth fade transitions, creating a **starry sky blinking effect**. Like watching a movie of your GitHub journey through time!

![Blinking Contribution Timeline](https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/blinking-contrib/default.svg)

#### Features

- 🎬 Each year appears sequentially
- 🌟 Smooth fade-in and fade-out transitions
- 📅 Year labels sync with animations
- ♾️ Continuous loop through all years
- ⏱️ Customizable timing and transitions

#### Usage

```yaml
- name: Generate blinking contribution timeline
  uses: diverger/gh-magic-matrix/blinking-contrib@main
  with:
    github_user_name: ${{ github.repository_owner }}
    output_path: blinking-contrib.svg
    frame_duration: "1.5"    # Each year visible for 1.5 seconds
    transition_duration: "0.3"  # 0.3s fade transitions
```

See [blinking-contrib documentation](./packages/blinking-contrib/README.md) for full options.

> 💡 **Live examples** are automatically generated daily and available in the [`output` branch](../../tree/output)

## Usage

### Calling Actions from This Repo

This repository contains **two GitHub Actions** that can be used independently:

1. **Breathing Contribution Grid** (default action):
   ```yaml
   uses: diverger/gh-magic-matrix@main
   ```

2. **Blinking Contribution Timeline** (subdirectory action):
   ```yaml
   uses: diverger/gh-magic-matrix/blinking-contrib@main
   ```

### Complete Workflow Example

Create a workflow file (e.g., `.github/workflows/contrib-animations.yml`):

```yaml
name: Generate Contribution Animations

on:
  schedule:
    - cron: "0 0 * * *"  # Daily at midnight
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      # Generate breathing animation (default action)
      - name: Generate breathing contribution animation
        uses: diverger/gh-magic-matrix@main
        with:
          github_user_name: ${{ github.repository_owner }}
          output_path: dist/breathing-contrib/default.svg
          period: "3"

      # Generate blinking animation (subdirectory action)
      - name: Generate blinking contribution timeline
        uses: diverger/gh-magic-matrix/blinking-contrib@main
        with:
          github_user_name: ${{ github.repository_owner }}
          output_path: dist/blinking-contrib/default.svg
          frame_duration: "1.5"
          transition_duration: "0.3"

      - name: Deploy to GitHub Pages
        uses: crazy-max/ghaction-github-pages@v4
        with:
          target_branch: output
          build_dir: dist
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Display in Your README

Add the generated SVGs to your profile README:

```markdown
<!-- Breathing animation -->
![Breathing Contribution Grid](https://raw.githubusercontent.com/USERNAME/REPO/output/breathing-contrib/default.svg)

<!-- Blinking animation -->
![Blinking Contribution Timeline](https://raw.githubusercontent.com/USERNAME/REPO/output/blinking-contrib/default.svg)
```

For dark mode support, use the `<picture>` element:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="breathing-contrib/dark.svg" />
  <source media="(prefers-color-scheme: light)" srcset="breathing-contrib/default.svg" />
  <img alt="contribution animation" src="breathing-contrib/default.svg" />
</picture>
```

## Configuration Options

### Breathing Contribution Grid (`diverger/gh-magic-matrix@main`)

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

### Blinking Contribution Timeline (`diverger/gh-magic-matrix/blinking-contrib@main`)

| Option | Description | Default |
|--------|-------------|---------|
| `github_user_name` | GitHub username | (required) |
| `github_token` | GitHub token for API access | `${{ github.token }}` |
| `output_path` | Output SVG file path | `blinking-contrib.svg` |
| `cell_size` | Cell size in pixels | `12` |
| `cell_gap` | Gap between cells in pixels | `2` |
| `cell_radius` | Border radius in pixels | `2` |
| `frame_duration` | How long each year stays visible (seconds) | `1.5` |
| `transition_duration` | Fade in/out duration (seconds) | `0.3` |
| `color_levels` | 5 colors: empty,low,med-low,med-high,high | GitHub dark theme colors |

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
