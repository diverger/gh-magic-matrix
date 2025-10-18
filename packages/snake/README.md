# Snake GitHub Contribution Graph

An advanced GitHub Action that generates an animated SVG showing a snake eating GitHub contributions using sophisticated pathfinding algorithms.

## Features

- **Advanced Pathfinding**: Uses A* algorithm and tunnel-based pathfinding similar to the snk project
- **Object-Oriented Design**: Built with TypeScript classes for maintainable and extensible code
- **Smart Route Optimization**: Two-phase clearing strategy for optimal snake movement
- **Customizable Animation**: Configurable snake length, colors, and animation timing
- **GitHub Integration**: Fetches real contribution data via GitHub GraphQL API

## Usage

```yaml
name: Generate Snake Animation
on:
  schedule:
    - cron: "0 0 * * *"
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - name: Generate snake animation
        uses: diverger/gh-magic-matrix/snake@main
        with:
          github_user_name: ${{ github.repository_owner }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
          output_path: snake.svg
          snake_length: 6
          animation_duration: 20
          colors: '#161b22,#0e4429,#006d32,#26a641,#39d353'

      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: snake-animation
          path: snake.svg
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `github_user_name` | GitHub username to fetch contributions for | ✅ | |
| `github_token` | GitHub token for API access | ❌ | `${{ github.token }}` |
| `output_path` | Path where the SVG will be saved | ❌ | `snake.svg` |
| `svg_width` | SVG canvas width in pixels | ❌ | `800` |
| `svg_height` | SVG canvas height in pixels | ❌ | `200` |
| `cell_size` | Size of each contribution cell in pixels | ❌ | `12` |
| `cell_gap` | Gap between cells in pixels | ❌ | `2` |
| `cell_radius` | Border radius of cells in pixels | ❌ | `2` |
| `snake_length` | Length of the snake in segments | ❌ | `6` |
| `animation_duration` | Total animation duration in seconds | ❌ | `20` |
| `colors` | Comma-separated color levels (empty, L1, L2, L3, L4) | ❌ | `#161b22,#0e4429,#006d32,#26a641,#39d353` |

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

## License

This project is part of the gh-magic-matrix collection and follows the same licensing terms.