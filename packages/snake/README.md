# Snake GitHub Contribution Graph

An advanced snake contribution animation generator using sophisticated pathfinding algorithms, inspired by the original SNK project.

## Features

- **Advanced Pathfinding**: A* algorithm with tunnel-based pathfinding for optimal routes
- **Object-Oriented Design**: Modular TypeScript architecture with clear separation of concerns
- **Smart Route Optimization**: Two-phase clearing strategy (residual + clean) for efficient traversal
- **Customizable Output**: SVG generation with configurable colors and animation timing
- **Memory Efficient**: Uses Uint8Array for snake state storage with bounds validation
- **Type Safe**: Full TypeScript with branded types for grid colors and validation

## Architecture

```text
packages/snake/
├── packages/
│   ├── action/                      # GitHub Action entry point
│   │   ├── index.ts                 # Main action entry
│   │   ├── generate-contribution-snake.ts
│   │   ├── outputs-options.ts       # Output configuration parser
│   │   └── palettes.ts              # Color palettes
│   ├── canvas-renderer/             # Canvas-based rendering (for demos)
│   │   ├── canvas-utils.ts
│   │   └── snake-renderer.ts
│   ├── solver/                      # Core pathfinding algorithms
│   │   ├── outside-grid.ts          # Boundary detection system
│   │   ├── pathfinder.ts            # A* pathfinding implementation
│   │   ├── snake-solver.ts          # Main solver orchestrator
│   │   └── tunnel.ts                # Tunnel validation & management
│   ├── svg-creator/                 # SVG generation
│   │   ├── svg-builder.ts           # Main SVG builder
│   │   ├── svg-grid-renderer.ts     # Grid rendering
│   │   ├── svg-snake-renderer.ts    # Snake animation
│   │   ├── svg-stack-renderer.ts    # Stack visualization
│   │   └── svg-utils.ts             # SVG utilities
│   ├── types/                       # Core data structures
│   │   ├── grid.ts                  # Grid with branded color types
│   │   ├── point.ts                 # Point class and directions
│   │   └── snake.ts                 # Snake state with Uint8Array storage
│   └── user-contribution-fetcher/   # GitHub API integration
│       └── index.ts
├── src/
│   └── index.ts                     # Standalone usage entry
├── action.yml                       # GitHub Action definition
└── package.json
```

## Development

To work on this action locally:

```bash
cd packages/snake
bun install
bun build src/index.ts --outdir dist --target node
bun start
```

## Algorithm Details

The implementation uses sophisticated pathfinding inspired by the original SNK project:

### 1. Two-Phase Clearing Strategy

**Residual Phase**: Clears cells from previous color levels using priority-based tunnel selection
- Finds all "tunnelable" cells (cells with color < current target)
- Scores tunnels by priority (balancing color mix vs tunnel length)
- Selects best tunnel and navigates to it
- Can traverse through residual colored cells (enhancement over SNK)

**Clean Phase**: Systematically consumes all cells of the current color level
- Uses BFS to find closest reachable cell
- Moves to cell and marks it as consumed
- Repeats until no cells of target color remain

### 2. Tunnel-Based Pathfinding

**Tunnel Concept**: A validated round-trip path that guarantees safe entry and exit
- **Entry Path**: Route from current position to tunnel start
- **Tunnel Path**: Sequence of cells to consume
- **Exit Path**: Route from tunnel end back to outside/safe area

**Tunnel Validation**:
1. Find escape path from start cell to outside boundary
2. Simulate consumption and find return path
3. Trim empty cells from both ends
4. Only use tunnel if round-trip is guaranteed

**Priority Scoring**: `priority = nLess / nColor`
- `nColor`: Number of target color cells in tunnel
- `nLess`: Sum of color differences for residual cells
- Higher priority = better mix of residual and target cells

### 3. Advanced A* Pathfinding

**Standard A* Features**:
- Cost function: `f(n) = g(n) + h(n)`
- `g(n)`: Actual cost from start
- `h(n)`: Manhattan distance heuristic
- Closed list tracking at **expansion time** (not generation)

**Enhancements Over SNK**:
- `maxColor` parameter: Allows traversing cells ≤ maxColor during residual phase
- SNK only traverses empty cells; we can navigate through colored residuals
- Better error handling with path continuity validation

### 4. Data Structure Optimizations

**Snake State** (`Uint8Array` storage):
- Coordinates stored as `[x+2, y+2, ...]` pairs
- +2 offset allows range [-2, 253] without negative indices
- Bounds validation prevents wraparound corruption
- Memory efficient: 1 byte per coordinate vs 4 bytes for number

**Grid Colors** (Branded types):
```typescript
type Empty = 0 & { readonly __brand: "Empty" };
type Color = 1 | 2 | 3 | 4 & { readonly __brand: "Color" };
```
- Compile-time type safety for color values
- Prevents invalid color assignments
- Zero runtime overhead

## Development

To work on this locally:

```bash
cd packages/snake
bun install
bun run build
bun run start
```

**Available Scripts:**
- `bun run build` - Build TypeScript to JavaScript
- `bun run start` - Run the built action
- `bun run dev` - Watch mode for development
- `bun run test` - Run unit tests

## Image Placeholder System

### Overview

The counter display system supports embedding images inline with text using `{img:N}` placeholders. Images can be displayed in **three positions**: `top-left`, `top-right`, and `follow`.

### Positions

1. **`top-left`**: Fixed position at top-left corner of the progress bar
2. **`top-right`**: Fixed position at top-right corner of the progress bar
3. **`follow`**: Moves with the progress bar, showing current position

### Syntax

```json
{
  "position": "top-left",
  "prefix": "{img:0} ",
  "suffix": " contributions",
  "images": [
    {
      "url": ".github/assets/tree.png",
      "width": 32,
      "height": 32,
      "anchorY": 0.875
    }
  ]
}
```

This configuration renders: `[tree icon] 123 contributions`

### Multiple Images

```json
{
  "position": "top-left",
  "prefix": "{img:0} Progress {img:1} ",
  "suffix": " total",
  "images": [
    {
      "url": ".github/assets/icon1.png",
      "width": 24,
      "height": 24,
      "anchorY": 0.8
    },
    {
      "url": ".github/assets/icon2.png",
      "width": 20,
      "height": 20,
      "anchorY": 0.75
    }
  ]
}
```

Result: `[icon1] Progress [icon2] 123 total`

### All Three Positions Example

```json
{
  "displays": [
    {
      "position": "top-left",
      "prefix": "{img:0} Total: ",
      "suffix": "",
      "images": [
        {
          "url": ".github/assets/tree.png",
          "width": 24,
          "height": 24,
          "anchorY": 0.8
        }
      ]
    },
    {
      "position": "top-right",
      "prefix": "",
      "suffix": " {img:0}",
      "images": [
        {
          "url": ".github/assets/star.png",
          "width": 24,
          "height": 24,
          "anchorY": 0.8
        }
      ]
    },
    {
      "position": "follow",
      "prefix": "{img:0} ",
      "suffix": " commits",
      "images": [
        {
          "url": ".github/assets/fire.png",
          "width": 20,
          "height": 20,
          "anchorY": 0.75
        }
      ]
    }
  ]
}
```

This shows:
- Top-left: `[tree] Total: 456`
- Top-right: `123 (27%) [star]`
- Follow (moving): `[fire] 123 commits`

### Features

- ✅ Inline image embedding with text
- ✅ Supports multiple images per display
- ✅ Local files (converted to data URIs) or external URLs
- ✅ Flexible placement (prefix, suffix, or text)
- ✅ Automatic layout calculation (width and height)
- ✅ Smart line height computation (accounts for image heights)
- ✅ Backward compatible (no placeholders = original behavior)

### Image Configuration

- `url`: Local file path or HTTP(S) URL
- `width`: **Display width** in SVG pixels (scaled size, not original image size)
- `height`: **Display height** in SVG pixels (scaled size, not original image size)
- `anchorX`: Horizontal anchor point (0.0-1.0, default 0)
- `anchorY`: Vertical anchor point (0.0-1.0, default 0.5)
  - `0.0` = top edge aligns with baseline
  - `0.5` = middle aligns with baseline
  - `1.0` = bottom edge aligns with baseline

**Note**: `width` and `height` define how the image will be **displayed** in the SVG, not the original image dimensions. For example, if your PNG file is 100x100px but you set `width: 32, height: 32`, the image will be scaled down to 32x32 pixels in the rendered SVG.

For more details, see [IMAGE_PLACEHOLDER_TEST.md](./IMAGE_PLACEHOLDER_TEST.md)

## Key Differences from Original SNK

| Aspect | SNK | This Implementation |
|--------|-----|---------------------|
| **Language Style** | Functional programming | Object-oriented with classes |
| **Type System** | TypeScript functions | Classes with branded types |
| **Module Structure** | Flat file structure | Layered package architecture |
| **A* Implementation** | Closed list at generation | Closed list at expansion (correct A*) |
| **Residual Traversal** | Empty cells only | Can traverse colored cells |
| **Error Handling** | Minimal validation | Comprehensive bounds checking |
| **Memory Safety** | Trust Uint8Array range | Explicit coordinate validation |
| **Animation Units** | Seconds | Milliseconds (standardized) |

## License

This project is part of the gh-magic-matrix collection and follows the same licensing terms.
