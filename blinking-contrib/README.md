# Blinking Contribution Timeline

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

## Features

- **Year-by-Year Animation**: Shows your GitHub journey through time
- **Smooth Transitions**: Configurable fade in/out effects
- **Fast Blinking Mode**: Instant on/off for starry effect
- **Custom Text Ending**: Display pixel art text at the end
- **Multiple Font Sizes**: Compact 3x5 or standard 5x7 fonts
- **Theme Support**: Light and dark color schemes

## Usage

### Smooth Transitions (Default)

```yaml
name: Generate Blinking Timeline
on:
  schedule:
    - cron: "0 0 * * *"  # Daily at midnight
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - name: Generate blinking contribution timeline
        uses: diverger/gh-magic-matrix/blinking-contrib@main
        with:
          github_user_name: ${{ github.repository_owner }}
          output_path: dist/blinking-contrib/smooth.svg
          frame_duration: "3"             # Each year visible for 3 seconds
          transition_duration: "0.8"      # 0.8s fade transitions
          ending_text: "Thanks"           # Optional: pixel art text at end
          font_size: "3x5"                # Compact font for longer text
```

### Fast Blinking Effect

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

### Basic Usage

```yaml
- name: Generate blinking animation
  uses: diverger/gh-magic-matrix/blinking-contrib@main
  with:
    github_user_name: ${{ github.repository_owner }}
    output_path: blinking-contrib.svg
```

## Configuration Options

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
| `ending_text` | Pixel art text at end (A-Z, 0-9, space, -!?.:) | username |
| `font_size` | Font for ending text: `3x5` (compact) or `5x7` (standard) | `3x5` |
| `color_levels` | 5 colors: empty,low,med-low,med-high,high | GitHub dark theme colors |

## Outputs

| Output | Description |
|--------|-------------|
| `svg_path` | Path to the generated SVG file |
| `years_animated` | Number of years included in animation |
| `total_frames` | Total number of animation frames |

## Animation Effects

Control the blinking effect using existing parameters:

### Smooth Transitions (Fade In/Out)
- `frame_duration`: `2-5` seconds (slower)
- `transition_duration`: `0.5-1` second (visible fade)

```yaml
frame_duration: "3"           # Years transition smoothly
transition_duration: "0.8"    # Visible fade effect
```

### Fast Blinking (Instant On/Off)
- `frame_duration`: `0.3-0.8` seconds (faster)
- `transition_duration`: `0` or `0.01` (instant/minimal fade)
- `text_frame_duration`: `3-5` seconds (text lingers longer)

```yaml
frame_duration: "0.5"           # Years flash quickly
transition_duration: "0"        # No fade = instant blink
text_frame_duration: "4"        # Text stays 4 seconds
```

## Font Options

The `font_size` parameter controls how text is rendered in the ending frame:

### 3x5 Compact Font (Default)
- Fits more characters, ideal for longer messages (8-10 characters)
- **Uppercase only** (A-Z, 0-9, space, -!?.:) - lowercase automatically converted
- Based on the popular **Tom Thumb** font

```yaml
ending_text: "THANKS 2024"
font_size: "3x5"
```

### 5x7 Standard Font
- Better readability, suitable for short text (4-6 characters like usernames)
- **Uppercase only** (A-Z, 0-9, space, -!?.:) - lowercase automatically converted

```yaml
ending_text: "JOHN"
font_size: "5x7"
```

**Note**: Both fonts support uppercase letters only. Lowercase text will be automatically converted to uppercase.

## Color Customization

### Pre-defined Color Themes

**GitHub Dark Theme (default):**
```yaml
color_levels: "#161b22,#0e4429,#006d32,#26a641,#39d353"
```

**GitHub Light Theme:**
```yaml
color_levels: "#ebedf0,#9be9a8,#40c463,#30a14e,#216e39"
```

**Custom Colors:**
```yaml
color_levels: "#f0f0f0,#ffb3ba,#ffdfba,#ffffba,#baffc9"
```

The colors represent:
1. Empty (no contributions)
2. Level 1 (low contributions)
3. Level 2 (medium-low)
4. Level 3 (medium-high)
5. Level 4 (high contributions)

## Display in Your README

Add the generated SVG to your profile README:

```markdown
<!-- Blinking animation with theme support -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/USERNAME/REPO/output/blinking-contrib/dark.svg" />
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/USERNAME/REPO/output/blinking-contrib/light.svg" />
  <img alt="Blinking Contribution Timeline" src="https://raw.githubusercontent.com/USERNAME/REPO/output/blinking-contrib/dark.svg" />
</picture>
```html

Or for simple display without theme switching:

```markdown
![Blinking Contribution Timeline](https://raw.githubusercontent.com/USERNAME/REPO/output/blinking-contrib/dark.svg)
```

## Complete Workflow Example

```yaml
name: Generate Blinking Animations

on:
  schedule:
    - cron: "0 0 * * *"  # Daily at midnight
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Smooth blinking with custom text
      - name: Generate smooth blinking timeline
        uses: diverger/gh-magic-matrix/blinking-contrib@main
        with:
          github_user_name: ${{ github.repository_owner }}
          output_path: dist/blinking-contrib/smooth.svg
          frame_duration: "3"
          transition_duration: "0.8"
          ending_text: "CODING LIFE"
          font_size: "3x5"

      # Fast blinking effect
      - name: Generate fast blinking timeline
        uses: diverger/gh-magic-matrix/blinking-contrib@main
        with:
          github_user_name: ${{ github.repository_owner }}
          output_path: dist/blinking-contrib/fast.svg
          frame_duration: "0.4"
          transition_duration: "0"
          text_frame_duration: "4"
          ending_text: "HELLO"
          font_size: "5x7"

      - name: Deploy to GitHub Pages
        uses: crazy-max/ghaction-github-pages@v4
        with:
          target_branch: output
          build_dir: dist
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Examples

- [Smooth transitions](https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/blinking-contrib/light.svg)
- [Fast blinking](https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/blinking-contrib/dark.svg)
