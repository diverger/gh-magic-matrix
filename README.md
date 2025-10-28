# gh-magic-matrix

A collection of GitHub Actions for creating various animations and visualizations from contribution matrices.

## 🚀 Quick Start

```yaml
# Breathing animation - aggregates all history, cells breathe
- uses: diverger/gh-magic-matrix@main
  with:
    github_user_name: ${{ github.repository_owner }}
    output_path: dist/breathing-contrib/dark.svg

# Blinking animation - shows years sequentially with fade transitions
- uses: diverger/gh-magic-matrix/blinking-contrib@main
  with:
    github_user_name: ${{ github.repository_owner }}
    output_path: dist/blinking-contrib/dark.svg

# Snake animation - snake eats contributions using pathfinding
- uses: diverger/gh-magic-matrix/snake@main
  with:
    github_user_name: ${{ github.repository_owner }}
    output_path: dist/snake/dark.svg
```

## Actions

### 💨 Breathing Contribution Grid

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

**[📖 Full Documentation](./breathing-contrib/README.md)**

### ✨ Blinking Contribution Timeline

Generate an animated SVG that displays your GitHub contributions **year by year** with smooth fade transitions, creating a **starry sky blinking effect**. Like watching a movie of your GitHub journey through time!

<picture>
  <source
    media="(prefers-color-scheme: dark)"
    srcset="https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/blinking-contrib/dark.svg"
  />
  <source
    media="(prefers-color-scheme: light)"
    srcset="https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/blinking-contrib/light.svg"
  />
  <img
    alt="blinking contribution timeline animation"
    src="https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/blinking-contrib/dark.svg"
  />
</picture>

**[📖 Full Documentation](./blinking-contrib/README.md)**

### 🐍 Snake Contribution Grid

Generate an animated SVG showing a snake eating GitHub contributions inspired by the popular snk project.

<picture>
  <source
    media="(prefers-color-scheme: dark)"
    srcset="https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/snake/dark.svg"
  />
  <source
    media="(prefers-color-scheme: light)"
    srcset="https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/snake/light.svg"
  />
  <img
    alt="snake contribution grid animation"
    src="https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/snake/dark.svg"
  />
</picture>

**[📖 Full Documentation](./snake/README.md)**

> 🎯 **Live examples** are automatically generated daily and available in the [`output` branch](../../tree/output)

## Quick Reference

This repository contains **three GitHub Actions** that can be used independently:

| Action | Usage | Documentation |
|--------|-------|---------------|
| **Breathing** (default) | `uses: diverger/gh-magic-matrix@main` | [📖 breathing-contrib/README.md](./breathing-contrib/README.md) |
| **Blinking** (subdirectory) | `uses: diverger/gh-magic-matrix/blinking-contrib@main` | [📖 blinking-contrib/README.md](./blinking-contrib/README.md) |
| **Snake** (subdirectory) | `uses: diverger/gh-magic-matrix/snake@main` | [📖 snake/README.md](./snake/README.md) |

For detailed configuration options and advanced usage, see each action's documentation above.
