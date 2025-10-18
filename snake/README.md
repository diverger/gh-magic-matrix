# Snake Contribution Grid

Generate an animated SVG showing a snake eating GitHub contributions using advanced pathfinding algorithms inspired by the popular snk project. Features sophisticated A* pathfinding and tunnel-based optimization for smooth, optimal snake movement.

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

## Features

- **Advanced Pathfinding**: Uses A* algorithm and tunnel-based pathfinding for optimal snake movement
- **Object-Oriented Design**: Built with TypeScript classes for maintainable and extensible code
- **Smart Route Optimization**: Two-phase clearing strategy (residual + clean color clearing)
- **Sophisticated Algorithms**: Implements the same core algorithms as snk but with modern architecture
- **GitHub Integration**: Fetches real contribution data via GitHub GraphQL API
- **Customizable Animation**: Configurable snake length, colors, and animation timing

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
          output_path: dist/snake/dark.svg
          snake_length: "6"                   # Length of the snake
          animation_duration: "20"            # Total animation time in seconds
```

### Advanced Configuration

```yaml
- name: Generate custom snake animation
  uses: diverger/gh-magic-matrix/snake@main
  with:
    github_user_name: ${{ github.repository_owner }}
    github_token: ${{ secrets.GITHUB_TOKEN }}
    output_path: snake.svg
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

| Option | Description | Default |
|--------|-------------|---------|
| `github_user_name` | GitHub username | (required) |
| `github_token` | GitHub token for API access | `${{ github.token }}` |
| `output_path` | Output SVG file path | `snake.svg` |
| `svg_width` | SVG canvas width in pixels | `800` |
| `svg_height` | SVG canvas height in pixels | `200` |
| `cell_size` | Size of each contribution cell in pixels | `12` |
| `cell_gap` | Gap between cells in pixels | `2` |
| `cell_radius` | Border radius of cells in pixels | `2` |
| `snake_length` | Length of the snake in segments | `6` |
| `animation_duration` | Total animation duration in seconds | `20` |
| `colors` | Comma-separated color levels (empty, L1, L2, L3, L4) | GitHub default colors |

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
          output_path: dist/snake/light.svg
          snake_length: "6"
          animation_duration: "20"
          colors: "#ebedf0,#9be9a8,#40c463,#30a14e,#216e39"

      # Generate snake with dark theme
      - name: Generate snake (dark theme)
        uses: diverger/gh-magic-matrix/snake@main
        with:
          github_user_name: ${{ github.repository_owner }}
          output_path: dist/snake/dark.svg
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

## Architecture

```
packages/snake/
├── packages/
│   ├── types/           # Core data structures
│   │   ├── grid.ts      # Grid class with branded types
│   │   ├── point.ts     # Point class with utilities
│   │   └── snake.ts     # Snake class with movement logic
│   └── solver/          # Pathfinding algorithms
│       ├── OutsideGrid.ts    # Boundary detection
│       ├── Pathfinder.ts     # A* pathfinding
│       ├── Tunnel.ts         # Tunnel management
│       └── SnakeSolver.ts    # Main solver class
├── src/
│   └── index.ts         # GitHub Action implementation
├── action.yml           # Action definition
└── package.json         # Dependencies
```

## Development

To work on this action locally:

```bash
cd packages/snake
bun install
bun build src/index.ts --outdir dist --target node
bun start
```

**Available Scripts:**
- `bun run build` - Build TypeScript to JavaScript
- `bun run start` - Run the built action
- `bun run dev` - Watch mode for development
- `bun run test` - Run unit tests

## Comparison to Original SNK

This implementation differs from the original snk project by:

- **Object-Oriented Design**: Uses classes instead of functional programming
- **TypeScript Throughout**: Full type safety with branded types
- **Modular Architecture**: Clear separation of concerns
- **GitHub Action Integration**: Direct integration with GitHub workflows
- **Enhanced Error Handling**: Comprehensive error checking and validation

## Examples

- [Light theme](https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/snake/light.svg)
- [Dark theme](https://raw.githubusercontent.com/diverger/gh-magic-matrix/output/snake/dark.svg)

## License

This project is part of the gh-magic-matrix collection and follows the same licensing terms.