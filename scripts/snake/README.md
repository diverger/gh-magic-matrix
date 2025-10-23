# Snake Action Scripts

Testing and validation scripts for the snake GitHub action.

## Scripts

### `test-snake.sh`
**Main testing script for the snake action**

```bash
# Basic usage
./scripts/snake/test-snake.sh              # Dark theme (default)
./scripts/snake/test-snake.sh light        # Light theme
./scripts/snake/test-snake.sh dark         # Dark theme

# With custom parameters
GITHUB_USER=octocat SNAKE_LENGTH=8 ./scripts/snake/test-snake.sh light
```

**Environment Variables:**
- `GITHUB_USER` - GitHub username (default: diverger)
- `SNAKE_LENGTH` - Snake length in segments (default: 6)
- `ANIMATION_DURATION` - Animation duration in seconds (default: 20)
- `SVG_WIDTH` - Canvas width (default: 800)
- `SVG_HEIGHT` - Canvas height (default: 200)
- `CELL_SIZE` - Cell size in pixels (default: 12)
- `CELL_GAP` - Gap between cells (default: 2)
- `CELL_RADIUS` - Cell border radius (default: 2)

**Output:**
- Generates timestamped SVG files in `test-outputs/`
- Creates `snake-latest.svg` symlink for quick access
- Validates SVG structure and animation elements

### `test-snake-units.sh`
**Unit testing script for snake TypeScript classes**

```bash
./scripts/snake/test-snake-units.sh
```

Tests the core snake logic:
- Snake class functionality
- Grid operations
- Point calculations
- Basic solver operations

Uses Bun for fast TypeScript compilation and execution.

### `validate-snake.sh`
**Comprehensive validation script**

```bash
./scripts/snake/validate-snake.sh
```

Performs complete validation:
- ✅ File structure checks
- ✅ TypeScript compilation
- ✅ Action.yml validation
- ✅ Docker configuration
- ✅ Workflow integration
- ✅ Build artifacts

## Usage Workflow

1. **Development**: Use `test-snake-units.sh` for quick unit testing
2. **Integration**: Use `test-snake.sh` to test the full action
3. **Validation**: Use `validate-snake.sh` before committing

## Output Location

All test outputs are saved to `test-outputs/` directory:
```text
test-outputs/
├── snake-20241018_143022.svg    # Timestamped outputs
├── snake-20241018_143155.svg
└── snake-latest.svg -> snake-20241018_143155.svg  # Latest symlink
```

## Troubleshooting

**Common Issues:**

1. **"Snake package directory not found"**
   - Run scripts from repository root
   - Ensure `packages/snake/` exists

2. **"Build failed - dist/index.js not found"**
   - Check Bun build errors
   - Verify `bun install` completed successfully
   - Ensure TypeScript source files exist

3. **"Failed to generate SVG"**
   - Check GitHub token permissions
   - Verify internet connection for API calls
   - Check user exists and has public contributions

**Debug Mode:**
```bash
# Enable verbose output
set -x
./scripts/snake/test-snake.sh dark
```