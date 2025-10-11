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

# LED Billboard - convert SVG images to animated pixel display
- uses: diverger/gh-magic-matrix/led-billboard@main
  with:
    input_path: 'images/*.svg'
    output_path: 'billboard.svg'
    matrix_width: '64'
    matrix_height: '32'
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
    srcset="https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/breathing-contrib/light.svg"
  />
  <img
    alt="breathing contribution grid animation"
    src="https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/breathing-contrib/dark.svg"
  />
</picture>

#### More Examples

- [Light theme](https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/breathing-contrib/light.svg)
- [Dark theme](https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/breathing-contrib/dark.svg)

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

#### Usage

**Smooth transitions (default):**
```yaml
- name: Generate blinking contribution timeline
  uses: diverger/gh-magic-matrix/blinking-contrib@main
  with:
    github_user_name: ${{ github.repository_owner }}
    output_path: dist/blinking-contrib/smooth.svg
    frame_duration: "3"             # Each year visible for 3 seconds
    transition_duration: "0.8"      # 0.8s fade transitions
    ending_text: "Thanks"           # Optional: pixel art text at end (default: username)
    font_size: "3x5"                # Compact font for longer text (or "5x7" for standard)
```

**Fast blinking effect:**
```yaml
- name: Generate fast blinking timeline
  uses: diverger/gh-magic-matrix/blinking-contrib@main
  with:
    github_user_name: ${{ github.repository_owner }}
    output_path: dist/blinking-contrib/fast.svg
    frame_duration: "0.5"           # Fast! Each year shows 0.5s
    transition_duration: "0"        # Instant on/off (no fade)
    text_frame_duration: "3"        # Text shows longer (3s)
    ending_text: "Hello World"
    font_size: "3x5"                # Compact font fits more text
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
          output_path: dist/breathing-contrib/light.svg
          period: "6"

      # Generate blinking animation (subdirectory action)
      - name: Generate blinking contribution timeline
        uses: diverger/gh-magic-matrix/blinking-contrib@main
        with:
          github_user_name: ${{ github.repository_owner }}
          output_path: dist/blinking-contrib/dark.svg
          frame_duration: "3"
          transition_duration: "0.8"

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
<!-- Breathing animation with theme support -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/USERNAME/REPO/output/breathing-contrib/dark.svg" />
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/USERNAME/REPO/output/breathing-contrib/light.svg" />
  <img alt="Breathing Contribution Grid" src="https://raw.githubusercontent.com/USERNAME/REPO/output/breathing-contrib/light.svg" />
</picture>

<!-- Blinking animation with theme support -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/USERNAME/REPO/output/blinking-contrib/dark.svg" />
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/USERNAME/REPO/output/blinking-contrib/light.svg" />
  <img alt="Blinking Contribution Timeline" src="https://raw.githubusercontent.com/USERNAME/REPO/output/blinking-contrib/dark.svg" />
</picture>
```

Or for simple display without theme switching:

```markdown
<!-- Breathing animation -->
![Breathing Contribution Grid](https://raw.githubusercontent.com/USERNAME/REPO/output/breathing-contrib/light.svg)

<!-- Blinking animation -->
![Blinking Contribution Timeline](https://raw.githubusercontent.com/USERNAME/REPO/output/blinking-contrib/dark.svg)
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
| `period` | Breathing cycle duration (seconds) | `6` |
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
| `frame_duration` | How long each year stays visible (seconds) | `3` |
| `fade_in_duration` | Fade in duration (seconds) | `0.5` |
| `fade_out_duration` | Fade out duration (seconds) | `0.5` |
| `text_frame_duration` | Duration for ending text frame (seconds) | `2 × frame_duration` |
| `ending_text` | Pixel art text at end (A-Z, 0-9, space, -!?.:, auto-uppercase) | username |
| `font_size` | Font for ending text: `3x5` (compact) or `5x7` (standard) | `3x5` |
| `color_levels` | 5 colors: empty,low,med-low,med-high,high | GitHub dark theme colors |

### Animation Effects

Control the blinking effect using existing parameters:

**Smooth transitions (fade in/out):**
- `frame_duration`: `2-5` seconds (slower)
- `transition_duration`: `0.5-1` second (visible fade)

**Fast blinking (instant on/off):**
- `frame_duration`: `0.3-0.8` seconds (faster)
- `transition_duration`: `0` or `0.01` (instant/minimal fade)
- `text_frame_duration`: `3-5` seconds (text lingers longer)

Example:
```yaml
# Fast blink years, slow text
frame_duration: "0.5"           # Years flash quickly
transition_duration: "0"        # No fade = instant blink
text_frame_duration: "4"        # Text stays 4 seconds
```

### Font Size Options

The `font_size` parameter controls how text is rendered in the ending frame:

- **`3x5` (Compact)**: Fits more characters, ideal for longer messages (8-10 characters)
  - **Uppercase only** (A-Z, 0-9, space, -!?.:) - lowercase automatically converted
  ```yaml
  ending_text: "THANKS 2024"
  font_size: "3x5"
  ```

- **`5x7` (Standard)**: Better readability, suitable for short text (4-6 characters like usernames)
  - **Uppercase only** (A-Z, 0-9, space, -!?.:) - lowercase automatically converted
  ```yaml
  ending_text: "JOHN"
  font_size: "5x7"
  ```

**Note**: Both fonts support uppercase letters only. Lowercase text will be automatically converted to uppercase. The compact 3x5 font is based on the popular **Tom Thumb** font.

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

---

### 💡 LED Billboard

Convert SVG images to animated pixel-style LED billboard display with customizable matrix size and colors.

**Use cases:**
- Animated logos and branding
- Scrolling text displays
- Retro-style pixel animations
- Custom matrix visualizations

```yaml
- name: Generate LED Billboard
  uses: diverger/gh-magic-matrix/led-billboard@main
  with:
    input_path: 'images/*.svg'        # SVG files to animate
    output_path: 'billboard.svg'
    matrix_width: '64'                # 64 LEDs wide
    matrix_height: '32'               # 32 LEDs tall
    cell_size: '10'                   # LED size
    cell_gap: '3'                     # Gap between LEDs
    background_color: '#000000'       # Black background
    led_on_color: '#00ff00'           # Green when on
    led_off_color: '#003300'          # Dark green when off
    frame_durations: '0.5,0.5,1'      # Frame timing in seconds
```

#### Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `input_path` | Path to SVG file(s) - glob or directory | **Required** |
| `output_path` | Output billboard SVG path | `led-billboard.svg` |
| `matrix_width` | LED matrix width (0 = auto) | `0` |
| `matrix_height` | LED matrix height (0 = auto) | `0` |
| `cell_size` | LED cell size in pixels | `8` |
| `cell_gap` | Gap between LEDs | `2` |
| `cell_radius` | LED border radius | `1` |
| `background_color` | Background hex color | `#000000` |
| `led_on_color` | LED on state color | `#00ff00` |
| `led_off_color` | LED off state color | `#003300` |
| `stretch` | Fill matrix (true) or maintain aspect ratio (false) | `false` |
| `frame_durations` | Frame timings (comma-separated seconds) | `1s` per frame |

#### Color Presets

**Classic Green LED:**
```yaml
background_color: '#000000'
led_on_color: '#00ff00'
led_off_color: '#003300'
```

**Red Alert:**
```yaml
background_color: '#1a0000'
led_on_color: '#ff0000'
led_off_color: '#330000'
```

**Blue Digital:**
```yaml
background_color: '#00000a'
led_on_color: '#00aaff'
led_off_color: '#002233'
```

See [LED Billboard documentation](packages/led-billboard/README.md) for more examples and advanced usage.

---
