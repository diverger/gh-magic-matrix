# @gh-magic-matrix/blinking-contrib

✨ GitHub Action that generates an animated SVG displaying your GitHub contributions year by year with smooth fade transitions, creating a **starry sky blinking effect**.

## 🌟 Effect Description

This action creates a mesmerizing animation where:
- Each year's contribution graph appears sequentially
- Years fade in and out smoothly like twinkling stars
- Creates a "movie" of your GitHub journey through time
- Perfect for showcasing contribution evolution over the years

## 📸 Examples

<picture>
  <source
    media="(prefers-color-scheme: dark)"
    srcset="https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/blinking-contrib/default.svg"
  />
  <source
    media="(prefers-color-scheme: light)"
    srcset="https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/blinking-contrib/light.svg"
  />
  <img
    alt="Blinking Contribution Animation"
    src="https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/blinking-contrib/default.svg"
  />
</picture>

### More Examples

- [Default (Dark Theme)](https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/blinking-contrib/default.svg)
- [Light Theme](https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/blinking-contrib/light.svg)

## 🚀 Quick Start

```yaml
- uses: diverger/gh-magic-matrix/blinking-contrib@main
  with:
    github_user_name: diverger
    output_path: dist/blinking-contrib/default.svg
```

## 📥 Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `github_user_name` | GitHub username to fetch contributions for | ✅ Yes | - |
| `github_token` | GitHub token for API access | No | `${{ github.token }}` |
| `output_path` | Path where the SVG will be saved | No | `blinking-contrib.svg` |
| `cell_size` | Size of each contribution cell (pixels) | No | `12` |
| `cell_gap` | Gap between cells (pixels) | No | `2` |
| `cell_radius` | Border radius of cells (pixels) | No | `2` |
| `frame_duration` | How long each year stays visible (seconds) | No | `1.5` |
| `transition_duration` | Duration of fade in/out transition (seconds) | No | `0.3` |
| `color_levels` | Comma-separated color levels (empty, L1-L4) | No | `#161b22,#0e4429,#006d32,#26a641,#39d353` (dark theme) |

## 📤 Outputs

| Output | Description |
|--------|-------------|
| `svg_path` | Path to the generated SVG file |
| `years_count` | Total number of years in the animation |

## 🎨 How It Works

1. **Fetches contributions** for each year since account creation
2. **Generates animated SVG** with:
   - Each year as a separate layer
   - Smooth fade-in and fade-out transitions
   - Year label that syncs with the animation
   - Continuous loop through all years

3. **Animation timing**:
   - Year appears (fade in): `transition_duration` seconds
   - Year visible: `frame_duration - 2×transition_duration` seconds
   - Year disappears (fade out): `transition_duration` seconds
   - Total cycle: `years_count × frame_duration` seconds

## 🚀 Usage Examples

### Basic Usage

```yaml
name: Generate Blinking Contribution Graph

on:
  schedule:
    - cron: '0 0 * * 0' # Weekly
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Generate Blinking SVG
        uses: diverger/gh-magic-matrix/blinking-contrib@main
        with:
          github_user_name: diverger
          output_path: dist/blinking-contrib/default.svg

      - name: Deploy to GitHub Pages
        uses: crazy-max/ghaction-github-pages@v4
        with:
          target_branch: output
          build_dir: dist
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Fast Blinking (More Dynamic)

```yaml
- uses: diverger/gh-magic-matrix/blinking-contrib@main
  with:
    github_user_name: diverger
    output_path: dist/blinking-contrib/fast.svg
    frame_duration: 1        # Each year visible for 1 second
    transition_duration: 0.2 # Quick, 0.2-second fade transitions
```

### Slow & Smooth (More Cinematic)

```yaml
- uses: diverger/gh-magic-matrix/blinking-contrib@main
  with:
    github_user_name: diverger
    output_path: dist/blinking-contrib/slow.svg
    frame_duration: 3        # Each year visible for 3 seconds
    transition_duration: 0.8 # Slower, 0.8-second fade transitions
```

### Custom Colors (Light Theme)

```yaml
- uses: diverger/gh-magic-matrix/blinking-contrib@main
  with:
    github_user_name: diverger
    output_path: dist/blinking-contrib/light.svg
    color_levels: '#ebedf0,#9be9a8,#40c463,#30a14e,#216e39'
```

### Larger Cells

```yaml
- uses: diverger/gh-magic-matrix/blinking-contrib@main
  with:
    github_user_name: diverger
    output_path: dist/blinking-contrib/large.svg
    cell_size: 16
    cell_gap: 3
    cell_radius: 3
```

## 🎬 Animation Details

The blinking effect is achieved using SVG SMIL animations:

- **Fade In**: Opacity goes from 0 to 1 using easeInOut timing
- **Hold**: Year stays at full opacity
- **Fade Out**: Opacity returns to 0 with easeInOut timing
- **Loop**: Animation repeats indefinitely

Each year transitions smoothly to the next, creating a continuous "movie" of your GitHub contribution history.

## 🔗 Embedding

Add the generated SVG to your README with automatic theme switching:

```markdown
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/blinking-contrib/default.svg" />
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/blinking-contrib/light.svg" />
  <img alt="Blinking Contribution Graph" src="https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/blinking-contrib/default.svg" />
</picture>
```

Or for simple display without theme switching:

```markdown
![Blinking Contribution Graph](https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/blinking-contrib/default.svg)
```

## 📊 Comparison with Other Actions

| Action | Effect | Use Case |
|--------|--------|----------|
| `breathing-contrib` | All days aggregate and breathe together | Show total historical contribution intensity |
| `blinking-contrib` | Years appear sequentially with fades | Show contribution evolution over time |

## 🛠 Development

```bash
# Install dependencies
bun install

# Build
bun run build

# The action will be bundled to ../../dist/blinking-contrib/index.js
```

## 📝 License

MIT

## 🌟 Credits

Part of the [gh-magic-matrix](https://github.com/diverger/gh-magic-matrix) project.
