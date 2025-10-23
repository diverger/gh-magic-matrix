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
