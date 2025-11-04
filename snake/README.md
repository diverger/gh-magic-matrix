# Snake Contribution Grid

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

## Table of Contents

- [Snake Contribution Grid](#snake-contribution-grid)
  - [Table of Contents](#table-of-contents)
  - [Usage](#usage)
    - [Basic Usage](#basic-usage)
    - [Advanced Configuration](#advanced-configuration)
  - [Configuration Options](#configuration-options)
    - [Basic Options](#basic-options)
    - [Custom Snake Options (Emoji/Letters/Images)](#custom-snake-options-emojilettersimages)
  - [Custom Snake Feature](#custom-snake-feature)
    - [Quick Start](#quick-start)
    - [Configuration Fields](#configuration-fields)
    - [Supported Content Types](#supported-content-types)
    - [Automatic Base64 Conversion](#automatic-base64-conversion)
    - [Advanced Examples](#advanced-examples)
    - [Complete Workflow Example](#complete-workflow-example)
    - [Contribution Counter Options](#contribution-counter-options)
    - [⚠️ Accessibility: Motion Preferences](#️-accessibility-motion-preferences)
  - [Contribution Counter Feature](#contribution-counter-feature)
    - [Position Modes](#position-modes)
      - [Fixed Positions](#fixed-positions)
      - [Follow Position](#follow-position)
      - [Free Position](#free-position)
    - [Quick Start](#quick-start-1)
    - [Counter Display Configuration](#counter-display-configuration)
      - [Position Options](#position-options)
      - [Text Display Options](#text-display-options)
      - [Image Display Options](#image-display-options)
      - [Full Configuration Reference](#full-configuration-reference)
      - [Image Configuration Fields](#image-configuration-fields)
      - [Sprite Configuration Fields](#sprite-configuration-fields)
    - [Animation Modes](#animation-modes)
      - [Sync Mode (`mode: "sync"`)](#sync-mode-mode-sync)
      - [Loop Mode (`mode: "loop"`)](#loop-mode-mode-loop)
      - [Level Mode (`mode: "level"`)](#level-mode-mode-level)
    - [Core Differences Summary](#core-differences-summary)
    - [Mode Combinations](#mode-combinations)
    - [Complete Examples](#complete-examples)
  - [Outputs](#outputs)
  - [Algorithm Details](#algorithm-details)
    - [1. Two-Phase Clearing Strategy](#1-two-phase-clearing-strategy)
    - [2. Tunnel-Based Pathfinding](#2-tunnel-based-pathfinding)
    - [3. Advanced Data Structures](#3-advanced-data-structures)
  - [Color Customization](#color-customization)
    - [Pre-defined Color Themes](#pre-defined-color-themes)
    - [Multi-Color Snake Segments](#multi-color-snake-segments)
    - [Color Shift Modes](#color-shift-modes)
  - [Display in Your README](#display-in-your-readme)
  - [Complete Workflow Example](#complete-workflow-example-1)
  - [Examples](#examples)

## Usage

### Basic Usage

```yaml
name: Generate Snake Animation
on:
  schedule:
    - cron: "0 0 * * *"  # Daily at midnight
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - name: Generate snake contribution animation
        uses: diverger/gh-magic-matrix/snake@main
        with:
          github_user_name: ${{ github.repository_owner }}
          outputs: dist/snake/dark.svg
          snake_length: "6"                   # Length of the snake
          animation_duration: "20"            # Total animation time in seconds
```

### Advanced Configuration

```yaml
- name: Generate custom snake animation
  uses: diverger/gh-magic-matrix/snake@main
  with:
    github_user_name: ${{ github.repository_owner }}
    ## Custom Snake Content (Emoji, Images, Text)

    You can render the snake using custom content for each segment: Unicode emoji, letters, numbers, or image URLs. This mode uses SVG `<text>` and `<image>` elements.

    ⚠️ **Important Limitations for GitHub**

    **Emoji rendering in SVG `<text>` is unreliable on GitHub** due to:
    - GitHub's SVG sanitization policies
    - Font availability and browser differences
    - Emoji may appear as blank boxes or fallback characters

    **Recommended Alternatives for GitHub README:**
    1. **Use image URLs instead of emoji** - Link to external emoji images (e.g., Twemoji CDN, Noto Emoji)
    2. **Server-side rendering** - Pre-render emoji as raster images and embed as data URIs
    3. **SVG path conversion** - Convert emoji to SVG path elements (requires additional tooling)
    4. **Traditional mode** - Use the standard colored rectangles (`useCustomSnake: false`)

    **For local/browser use only**, emoji in `<text>` elements work well in modern browsers with proper font support.

    ### How to Enable

    **Query Parameters (for GitHub Actions):**
    ```
    output.svg?use_custom_snake=true&custom_snake_segments=🐍,🟢,🟡,🔵
    ```

    **Programmatic API:**
    ```typescript
    drawOptions: {
      useCustomSnake: true,
      customSnakeConfig: {
        segments: ['🐍', '🟢', '🟡', '🔵'],  // Or use image URLs for GitHub
        defaultContent: '🟢'
      }
    }
    ```

    ### Configuration Examples

    **Emoji (local/browser use only):**

    ```yaml
    useCustomSnake: true
    customSnakeConfig:
      segments: ['🐍', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣']
      defaultContent: '⚪'
    ```

    **Image URLs (GitHub-compatible):**

    ```yaml
    useCustomSnake: true
    customSnakeConfig:
      segments:
        - 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f40d.svg'  # Snake emoji
        - 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f7e2.svg'  # Green circle
        - 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f7e1.svg'  # Yellow circle
      defaultContent: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f7e2.svg'
    ```

    **Function-based (programmatic only):**

    ```js
    customSnakeConfig: {
      segments: (index, total) => {
        if (index === 0) return 'https://example.com/head.svg';
        if (index === total - 1) return 'https://example.com/tail.svg';
        // Use image URLs for GitHub compatibility
        const images = [
          'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f7e2.svg',
          'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f7e1.svg',
          'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f7e0.svg'
        ];
        return images[Math.floor((index / total) * images.length)];
      },
      defaultContent: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f7e2.svg'
    }
    ```

    ### Quick Test Commands

    ```bash
    # Full mixed content test suite (emoji, letters, images)
    bun scripts/snake/test-mixed-snake.ts

    # Custom snake parsing test
    bun scripts/snake/test-custom-snake-parsing.ts

    # Emoji test (local browser preview recommended)
    bun scripts/snake/test-emoji-snake.ts
    ```

    Outputs from the test scripts are written to `test-outputs/`.

    ### Documentation & Examples

    - `packages/snake/packages/svg-creator/svg-snake-renderer.ts` — implementation details
    - `scripts/snake/test-mixed-snake.ts` — mixed content examples
    - Query parameter parsing: `packages/snake/src/outputs-options.ts`

    ### Technical Notes
    - **Size calculation**: Content size is calculated from `cell_size` and adjusted to fit the cell
    - **Image URLs**: Automatically converted to Base64 data URIs for GitHub compatibility
    - **Content mixing**: Can mix emoji, text, and images in a single snake (programmatically)
    - **Browser compatibility**: Emoji display varies; images provide consistent cross-platform rendering
    - **Traditional mode**: Set `useCustomSnake: false` to use original colored rectangles

    github_token: ${{ secrets.GITHUB_TOKEN }}
    outputs: snake.svg
    svg_width: "900"
    svg_height: "250"
    cell_size: "15"
    cell_gap: "3"
    cell_radius: "3"
    snake_length: "8"
    animation_duration: "30"
    colors: "#161b22,#0e4429,#006d32,#26a641,#39d353"  # GitHub dark theme
```

## Configuration Options

### Basic Options

| Option | Description | Default |
|--------|-------------|---------|
| `github_user_name` | GitHub username | (required) |
| `github_token` | GitHub token for API access | `${{ github.token }}` |
| `outputs` | Output SVG file path(s). Supports multiple files (one per line) with query string options | `snake.svg` |
| `svg_width` | SVG canvas width in pixels | `800` |
| `svg_height` | SVG canvas height in pixels | `200` |
| `cell_size` | Size of each contribution cell in pixels | `12` |
| `cell_gap` | Gap between cells in pixels | `2` |
| `cell_radius` | Border radius of cells in pixels | `2` |
| `snake_length` | Length of the snake in segments | `6` |
| `animation_duration` | Total animation duration in seconds | `20` |
| `colors` | Comma-separated color levels (empty, L1, L2, L3, L4) | GitHub default colors |

### Custom Snake Options (Emoji/Letters/Images)

| Option | Description | Default |
|--------|-------------|---------|
| `use_custom_snake` | Enable custom visual rendering for snake segments (emoji/letters/images) | `false` |
| `custom_snake_config` | JSON configuration for custom snake visuals (see examples below) | - |

**Note:** Supports Unicode emojis (🐍), letters (A-Z), numbers (0-9), and images (PNG/JPEG/GIF). External image URLs are automatically converted to Base64 for GitHub compatibility.

## Custom Snake Feature

Render snake segments as emojis, letters, numbers, or images instead of colored rectangles.

### Quick Start

**Basic Emoji Snake:**

```yaml
- uses: diverger/gh-magic-matrix/snake@main
  with:
    github_user_name: ${{ github.repository_owner }}
    outputs: emoji-snake.svg
    use_custom_snake: true
    custom_snake_config: |
      {
        "segments": ["🐍", "🟢", "🟡", "🔴"],
        "defaultContent": "🟢"
      }
```

**Letter Snake:**

```yaml
- uses: diverger/gh-magic-matrix/snake@main
  with:
    github_user_name: ${{ github.repository_owner }}
    outputs: letter-snake.svg
    use_custom_snake: true
    custom_snake_config: |
      {
        "segments": ["S", "N", "A", "K", "E"],
        "defaultContent": "·"
      }
```

**Image Snake (External URLs - Auto-converts to Base64):**

```yaml
- uses: diverger/gh-magic-matrix/snake@main
  with:
    github_user_name: ${{ github.repository_owner }}
    outputs: avatar-snake.svg
    use_custom_snake: true
    custom_snake_config: |
      {
        "segments": [
          "https://avatars.githubusercontent.com/u/1?s=16",
          "https://avatars.githubusercontent.com/u/2?s=16",
          "https://avatars.githubusercontent.com/u/3?s=16",
          "https://avatars.githubusercontent.com/u/4?s=16"
        ],
        "defaultContent": "🟢"
      }
```

### Configuration Fields

- **`segments`**: Array of emoji/letters/image URLs. The snake cycles through this array for each segment.
  - Emojis: `["🐍", "🟢", "🟡"]`
  - Letters: `["A", "B", "C"]`
  - Images: `["https://example.com/img.png", "data:image/png;base64,..."]`

- **`defaultContent`**: Fallback character/image for segments not defined in the array (default: `"🟢"`)

### Supported Content Types

1. **Emojis**: Any Unicode emoji (🐍, 🟢, 🎨, etc.)
2. **Letters**: A-Z, a-z, 0-9, special characters
3. **Images**:
   - External URLs (automatically converted to Base64)
   - Data URIs (Base64 PNG/JPEG/GIF)
   - Supports PNG, JPEG, GIF formats

### Automatic Base64 Conversion

External image URLs (starting with `http://` or `https://`) are **automatically converted to Base64 data URIs** during generation. This ensures:

- ✅ **GitHub CSP compatibility** (Content Security Policy)
- ✅ **No external dependencies** in README
- ✅ **Images display correctly** on GitHub
- ✅ **Self-contained SVG files**

**Performance:**
- External images are fetched and converted in parallel
- Conversion results are cached during generation
- Typical conversion time: ~1-2 seconds for 4 images
- Final SVG file size increases by ~3-5KB per embedded image

### Advanced Examples

**Mixed Content (Emoji + Images):**

```yaml
custom_snake_config: |
  {
    "segments": [
      "🐍",
      "https://avatars.githubusercontent.com/u/123?s=16",
      "🟢",
      "data:image/png;base64,iVBORw0KGgo..."
    ],
    "defaultContent": "·"
  }
```

**Gradient Pattern (Auto-cycles):**

```yaml
custom_snake_config: |
  {
    "segments": ["🔴", "🟠", "🟡", "🟢", "🔵", "🟣"],
    "defaultContent": "⚪"
  }
```

The system will cycle through: `🔴, 🟠, 🟡, 🟢, 🔵, 🟣, 🔴, 🟠, ...`

### Complete Workflow Example

```yaml
name: Generate Snake

on:
  schedule:
    - cron: "0 0 * * *"
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - name: Generate custom snake
        uses: diverger/gh-magic-matrix/snake@emoji-snake
        with:
          github_user_name: ${{ github.repository_owner }}
          outputs: |
            dist/custom-snake.svg
            dist/github-snake.svg?palette=github-dark&color_snake=blue
          use_custom_snake: true
          custom_snake_config: |
            {
              "segments": ["🐍", "🟢", "🟡", "🔴", "🔵"],
              "defaultContent": "🟢"
            }

      - name: Publish to GitHub Pages
        uses: crazy-max/ghaction-github-pages@v3
        with:
          target_branch: output
          build_dir: dist
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Contribution Counter Options

| Option | Description | Default |
|--------|-------------|---------|
| `show_contribution_counter` | Enable contribution counter and progress bar | `false` |
| `counter_displays` | JSON array of counter display configurations (see below) | - |
| `hide_progress_bar` | Hide the progress bar (only show counters/sprites) | `false` |
| `force_animations` | ⚠️ Force animations even when user prefers reduced motion (see Accessibility) | `false` |

### ⚠️ Accessibility: Motion Preferences

By default, this action forces animations to play since it's typically used for static README images where animation is the primary purpose.

**`force_animations` option:**
- When set to `true` (default), animations will play regardless of user motion preferences
- When set to `false`, respects the user's `prefers-reduced-motion` system setting
- **Default is `true`** since this is primarily used for static GitHub README badges
- Set to `false` if you want to respect user motion preferences (recommended for interactive web pages)

Example:
```yaml
with:
  show_contribution_counter: true
  force_animations: true  # Only if you have a justified reason
```

## Contribution Counter Feature

Display real-time contribution statistics with animated progress bars and customizable counters that update as the snake eats cells.

### Position Modes

Counter displays support three types of positioning:

#### Fixed Positions
Counter stays at a specific location on the canvas:
- **`top-left`**: Fixed at the left edge above the progress bar
- **`top-right`**: Right-aligned above the progress bar (auto-clamped to canvas width)
- **`bottom-left`**: Fixed at the left edge below the progress bar
- **`bottom-right`**: Right-aligned below the progress bar (auto-clamped to canvas width)

**Use cases**: Static labels, total counters, corner decorations

#### Follow Position
- **`follow`**: Moves with the progress bar head horizontally as the snake progresses

**Use cases**: Dynamic counters, walking character sprites, progress-tied elements

**Note**: When using `hide_progress_bar: true`, the progress bar remains in the DOM (invisible) to provide positioning reference for `follow` mode.

#### Free Position
- **`free`**: Custom positioning with exact `x` and `y` coordinates (in pixels)

**Configuration**:
```json
{
  "position": "free",
  "x": 100,
  "y": 50,
  "prefix": "Custom: ",
  "suffix": " 🎯"
}
```

**Use cases**: Precise positioning anywhere on canvas, custom layouts, overlays

### Quick Start

**Simple counter following the progress bar:**

```yaml
- name: Generate snake with counter
  uses: diverger/gh-magic-matrix/snake@main
  with:
    github_user_name: ${{ github.repository_owner }}
    outputs: snake.svg
    show_contribution_counter: true
    counter_displays: |
      [
        {
          "position": "follow",
          "prefix": "🎯 ",
          "suffix": " contributions",
          "color": "#7ee787"
        }
      ]
```

### Counter Display Configuration

The `counter_displays` parameter accepts a JSON array. Each display can have:

#### Position Options

- **`top-left`**: Fixed position at the left edge above the progress bar
- **`top-right`**: Right-aligned position above the progress bar (auto-clamped to canvas width)
- **`bottom-left`**: Fixed position at the left edge below the progress bar
- **`bottom-right`**: Right-aligned position below the progress bar (auto-clamped to canvas width)
- **`follow`**: Follows the progress bar head as it moves (on the same line)

#### Text Display Options

**Static Text:**
```json
{
  "position": "top-left",
  "text": "GitHub Contributions",
  "color": "#58a6ff",
  "fontSize": 16,
  "fontWeight": "bold"
}
```

**Dynamic Counter:**
```json
{
  "position": "follow",
  "prefix": "🎯 ",
  "suffix": " commits",
  "showCount": true,
  "showPercentage": true,
  "color": "#ffa657"
}
```

#### Image Display Options

**Static Image:**
```json
{
  "position": "follow",
  "images": [{
    "url": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "width": 32,
    "height": 32
  }]
}
```

**Sprite Sheet Animation (synced with progress):**
```json
{
  "position": "follow",
  "images": [{
    "url": "https://example.com/sprite.png",
    "width": 128,
    "height": 32,
    "sprite": {
      "frames": 4,
      "layout": "horizontal",
      "mode": "sync"
    }
  }]
}
```

**Multiple Image Files (GitHub workflow friendly):**
```json
{
  "position": "follow",
  "images": [{
    "urlFolder": "images/character",
    "framePattern": "frame-{n}.png",
    "width": 32,
    "height": 32,
    "sprite": {
      "frames": 8,
      "mode": "loop",
      "fps": 10
    }
  }]
}
```

#### Full Configuration Reference

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `position` | string | `'top-left'` \| `'top-right'` \| `'bottom-left'` \| `'bottom-right'` \| `'follow'` \| `'free'` | required |
| `x` | number | X coordinate in pixels (required for `free` position) | - |
| `y` | number | Y coordinate in pixels (required for `free` position) | - |
| `text` | string | Static text (ignores count/percentage if set) | - |
| `prefix` | string | Text before count/percentage | - |
| `suffix` | string | Text after count/percentage | - |
| `showCount` | boolean | Display contribution count | `true` |
| `showPercentage` | boolean | Display percentage | `true` |
| `fontSize` | number | Font size in pixels | `14` |
| `fontFamily` | string | Font family | `'Arial, sans-serif'` |
| `fontWeight` | string \| number | `'normal'`, `'bold'`, or 100-900 | `'normal'` |
| `fontStyle` | string | `'normal'` or `'italic'` | `'normal'` |
| `color` | string | Text color (CSS color) | `'#666'` |
| `images` | array | Array of image configurations | - |

#### Image Configuration Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `url` | string | Image URL (data URI or external) | - |
| `urlFolder` | string | Folder path for numbered frame files | - |
| `framePattern` | string | Filename pattern (e.g., `'frame-{n}.png'`) | `'frame-{n}.png'` |
| `width` | number | Image width in pixels | required |
| `height` | number | Image height in pixels | required |
| `offsetY` | number | Vertical offset in pixels | `0` |
| `anchor` | string | Predefined anchor point | `'bottom-center'` |
| `anchorX` | number | Custom horizontal anchor (0-1) | - |
| `anchorY` | number | Custom vertical anchor (0-1) | - |
| `spacing` | number | Horizontal spacing after image in pixels | `0` |
| `sprite` | object | Sprite animation configuration | - |

#### Sprite Configuration Fields

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `frames` | number | Number of animation frames¹ | ✅ |
| `frameWidth` | number | Frame width (sprite sheet only) | auto |
| `frameHeight` | number | Frame height (sprite sheet only) | auto |
| `layout` | string | `'horizontal'` or `'vertical'` | `'horizontal'` |
| `mode` | string | `'sync'`, `'loop'`, or `'level'` | `'sync'` |
| `fps` | number | Frames per second (loop mode) | - |
| `duration` | number | Animation duration in ms (loop mode) | - |

¹ **Level mode constraint**: When `mode: 'level'`, exactly 5 frames are required (mapped to contribution levels 0-4).

### Animation Modes

The sprite animation mode determines **when and how frames change**. There are three modes, each with distinct behavior:

#### Sync Mode (`mode: "sync"`)

**Frame timing**: Tied to snake progress (contribution count)
- Frame 0 displays at 0% progress
- Frame advances proportionally as snake eats cells
- Final frame displays at 100% progress
- **Frame changes**: Only when snake eats a cell (discrete steps)

**Use cases**:
- Progress indicators that evolve with contributions
- Character growth/transformation tied to achievements
- Visual feedback that reflects actual progress

**With different positions**:
- **+ `follow`**: Character walks AND transforms as progress increases (e.g., evolving character)
- **+ fixed/free**: Transformation indicator stays in place, shows current evolution stage

**Example**:
```json
{
  "position": "follow",
  "images": [{
    "url": "https://example.com/evolution.png",
    "width": 128,
    "height": 32,
    "sprite": {
      "frames": 4,
      "mode": "sync"
    }
  }],
  "suffix": " evolving..."
}
```

#### Loop Mode (`mode: "loop"`)

**Frame timing**: Independent continuous animation
- Frames cycle at constant speed defined by `fps` or `duration`
- Animation runs regardless of snake progress
- Creates smooth, continuous motion
- **Frame changes**: Based on elapsed time (continuous, smooth)

**Use cases**:
- Walking/running character animations
- Idle movements and breathing effects
- Background decorative animations
- Loading indicators

**With different positions**:
- **+ `follow`**: Character walks with constant animation while moving (e.g., walking sprite)
- **+ fixed/free**: Character animates in place (e.g., idle animation, bouncing icon)

**Example**:
```json
{
  "position": "follow",
  "images": [{
    "urlFolder": "assets/walk",
    "framePattern": "step-{n}.png",
    "width": 32,
    "height": 32,
    "sprite": {
      "frames": 8,
      "mode": "loop",
      "fps": 12
    }
  }],
  "prefix": "🎯 ",
  "suffix": " commits"
}
```

#### Level Mode (`mode: "level"`)

**Frame timing**: Based on current cell's contribution level (0-4)
- Frame 0: Empty cell (no contributions)
- Frame 1: Level 1 contributions (low)
- Frame 2: Level 2 contributions (medium-low)
- Frame 3: Level 3 contributions (medium-high)
- Frame 4: Level 4 contributions (high)
- Requires exactly **5 frames**
- **Frame changes**: When snake moves to a cell with different contribution level

**Use cases**:
- Character expressions changing with contribution intensity
- Color-coded indicators matching GitHub's contribution levels
- Visual feedback for contribution quality
- State indicators (idle → active states)

**With different positions**:
- **+ `follow`**: Character reacts to each cell's intensity while moving (e.g., happy on high contributions, sad on empty)
- **+ fixed/free**: Shows the current cell's level at a fixed location (e.g., intensity meter)

**Example**:
```json
{
  "position": "follow",
  "images": [{
    "urlFolder": "assets/states",
    "framePattern": "level-{n}.png",
    "width": 32,
    "height": 32,
    "sprite": {
      "frames": 5,
      "mode": "level"
    }
  }],
  "prefix": "State: ",
  "suffix": ""
}
```

### Core Differences Summary

| Mode | What Drives Frame Change | Frame Change Frequency | Best For |
|------|-------------------------|------------------------|----------|
| `sync` | Total progress (0-100%) | Each cell eaten | Showing overall progress/evolution |
| `loop` | Time (fps/duration) | Constant, smooth | Continuous animations (walk, idle) |
| `level` | Current cell's level (0-4) | Each cell transition | Reacting to contribution intensity |

**Visual Example**:
- **Sync**: Frame 1 → 2 → 3 → 4 (as total progress goes 25% → 50% → 75% → 100%)
- **Loop**: Frame 1 → 2 → 3 → 4 → 1 → 2... (repeating at 12fps regardless of progress)
- **Level**: Frame changes based on cell color: Empty(0) → Low(1) → High(4) → Empty(0)

### Mode Combinations

Combining **animation mode** with **position mode** gives distinct behaviors:

| Animation | Position | Frame Behavior | Position Behavior | Real-World Example |
|-----------|----------|----------------|-------------------|-------------------|
| `sync` | `follow` | Changes with overall progress | Moves with progress bar | Evolving character that walks and transforms |
| `sync` | fixed/free | Changes with overall progress | Stays in place | Corner indicator showing evolution stage |
| `loop` | `follow` | Cycles continuously (time-based) | Moves with progress bar | Walking character with constant stride |
| `loop` | fixed/free | Cycles continuously (time-based) | Stays in place | Idle bouncing icon in corner |
| `level` | `follow` | Changes per cell level (0-4) | Moves with progress bar | Character reacting to each cell's intensity |
| `level` | fixed/free | Changes per cell level (0-4) | Stays in place | Static meter showing current cell level |

**Key Insight**:
- **Position** controls WHERE the sprite appears (moves vs stays)
- **Animation Mode** controls WHEN frames change (progress, time, or cell level)

### Complete Examples

**Example 1: Multiple Text Displays**

```yaml
show_contribution_counter: true
counter_displays: |
  [
    {
      "position": "top-left",
      "text": "GitHub Contributions",
      "color": "#1f883d",
      "fontSize": 14,
      "fontWeight": "bold"
    },
    {
      "position": "top-right",
      "prefix": "Total: ",
      "suffix": " commits",
      "showCount": true,
      "showPercentage": true,
      "color": "#bf3989",
      "fontStyle": "italic"
    },
    {
      "position": "follow",
      "prefix": "🎯 ",
      "suffix": " contributions",
      "color": "#d29922"
    }
  ]
```

**Example 2: Image with Counter**

```yaml
show_contribution_counter: true
counter_displays: |
  [
    {
      "position": "follow",
      "images": [{
        "url": "data:image/png;base64,iVBORw0KG...",
        "width": 24,
        "height": 24,
        "spacing": 8
      }],
      "prefix": "",
      "suffix": " commits collected!",
      "color": "#7ee787"
    }
  ]
```

**Example 3: Sprite Animation**

```yaml
show_contribution_counter: true
counter_displays: |
  [
    {
      "position": "follow",
      "images": [{
        "url": "https://example.com/character-sprite.png",
        "width": 128,
        "height": 32,
        "anchor": "bottom-center",
        "sprite": {
          "frames": 4,
          "layout": "horizontal",
          "mode": "sync"
        }
      }]
    }
  ]
```

## Outputs

| Output | Description |
|--------|-------------|
| `svg_path` | Path to the generated SVG file |
| `moves_count` | Total number of moves in the snake path |
| `cells_eaten` | Number of contribution cells consumed |

## Algorithm Details

This action implements a sophisticated pathfinding system inspired by the snk project:

### 1. Two-Phase Clearing Strategy

- **Phase 1: Residual Color Clearing** - Removes remaining cells from previous color levels using priority-based tunnel selection
- **Phase 2: Clean Color Clearing** - Systematically consumes all cells of the current color level using closest-first strategy

### 2. Tunnel-Based Pathfinding

- **Tunnel Validation**: Ensures both entry and exit paths exist before committing to a route
- **Priority Scoring**: Balances tunnel length vs color distribution for optimal paths
- **Round-Trip Planning**: Guarantees the snake can always return to safe areas

### 3. Advanced Data Structures

- **Snake Representation**: Uses Uint8Array for memory-efficient coordinate storage
- **Grid System**: Branded TypeScript types for type-safe color management
- **Pathfinding Nodes**: A* algorithm with heuristic-based cost calculation

## Color Customization

### Pre-defined Color Themes

**GitHub Dark Theme (default):**
```yaml
colors: "#161b22,#0e4429,#006d32,#26a641,#39d353"
```

**GitHub Light Theme:**
```yaml
colors: "#ebedf0,#9be9a8,#40c463,#30a14e,#216e39"
```

**Custom Colors:**
```yaml
colors: "#f0f0f0,#ffb3ba,#ffdfba,#ffffba,#baffc9"
```

The colors represent:
1. Empty (no contributions)
2. Level 1 (low contributions)
3. Level 2 (medium-low)
4. Level 3 (medium-high)
5. Level 4 (high contributions)

### Multi-Color Snake Segments

Create rainbow or gradient snakes with different colors for each segment:

**Rainbow Snake:**
```yaml
outputs: |
  dist/snake.svg?color_snake=#ef4444,#f97316,#eab308,#22c55e,#3b82f6,#8b5cf6
```

**Two-Color Gradient:**
```yaml
outputs: |
  dist/snake.svg?color_snake=#ff0000,#0000ff
```

**Query Parameters:**
- `color_snake`: Single color or comma-separated list for multi-color segments
  - Single color: `color_snake=blue` (all segments use same color)
  - Multiple colors: `color_snake=#ff0000,#ff7700,#ffff00` (per-segment colors)

The snake assigns colors to segments in order (head to tail). If the color array is shorter than the snake length, the last color repeats for remaining segments.

### Color Shift Modes

Animate color transitions as the snake moves:

**Mode 1: Shift on Every Step**
```yaml
outputs: |
  dist/snake.svg?color_snake=#ef4444,#f97316,#eab308,#22c55e,#3b82f6,#8b5cf6&color_shift_mode=every-step
```
- Colors shift forward by one segment with each grid movement
- Creates a flowing, wave-like color animation
- Perfect for rainbow effects

**Mode 2: Shift When Eating Contributions**
```yaml
outputs: |
  dist/snake.svg?color_snake=#ef4444,#f97316,#eab308,#22c55e&color_shift_mode=on-eat
```
- Colors shift only when the snake eats a colored (non-empty) contribution cell
- Links color changes to actual contribution consumption
- More subtle and contribution-focused animation

**Available Modes:**
- `none` (default): Static colors - each segment keeps its assigned color
- `every-step`: Shift colors on every grid movement
- `on-eat`: Shift colors only when eating colored cells

**Dark Mode Support:**
```yaml
outputs: |
  dist/snake.svg?color_snake=#ef4444,#22c55e,#3b82f6&color_shift_mode=every-step&dark_color_snake=#8b5cf6,#ec4899,#f97316&dark_color_shift_mode=on-eat
```

## Display in Your README

Add the generated SVG to your profile README:

```markdown
<!-- Snake animation with theme support -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/USERNAME/REPO/output/snake/dark.svg" />
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/USERNAME/REPO/output/snake/light.svg" />
  <img alt="Snake Contribution Grid" src="https://raw.githubusercontent.com/USERNAME/REPO/output/snake/dark.svg" />
</picture>
```

Or for simple display without theme switching:

```markdown
![Snake Contribution Grid](https://raw.githubusercontent.com/USERNAME/REPO/output/snake/dark.svg)
```

## Complete Workflow Example

```yaml
name: Generate Snake Animations

on:
  schedule:
    - cron: "0 0 * * *"  # Daily at midnight
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Generate snake with light theme
      - name: Generate snake (light theme)
        uses: diverger/gh-magic-matrix/snake@main
        with:
          github_user_name: ${{ github.repository_owner }}
          outputs: dist/snake/light.svg
          snake_length: "6"
          animation_duration: "20"
          colors: "#ebedf0,#9be9a8,#40c463,#30a14e,#216e39"

      # Generate snake with dark theme
      - name: Generate snake (dark theme)
        uses: diverger/gh-magic-matrix/snake@main
        with:
          github_user_name: ${{ github.repository_owner }}
          outputs: dist/snake/dark.svg
          snake_length: "6"
          animation_duration: "20"
          colors: "#161b22,#0e4429,#006d32,#26a641,#39d353"

      - name: Deploy to GitHub Pages
        uses: crazy-max/ghaction-github-pages@v4
        with:
          target_branch: output
          build_dir: dist
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Examples

- [Light theme](https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/snake/light.svg)
- [Dark theme](https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/snake/dark.svg)
