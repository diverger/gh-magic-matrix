# Blinking Action Scripts

Testing and validation scripts for the blinking GitHub action.

## Scripts

### `test-blinking.sh`
**Main testing script for the blinking action**

```bash
# Basic usage
./scripts/blinking-contrib/test-blinking.sh              # Dark theme, smooth transitions (default)
./scripts/blinking-contrib/test-blinking.sh light        # Light theme, smooth transitions
./scripts/blinking-contrib/test-blinking.sh dark fast    # Dark theme, fast blinking
./scripts/blinking-contrib/test-blinking.sh light smooth # Light theme, smooth transitions

# With custom parameters
GITHUB_USER=octocat ENDING_TEXT="HELLO" ./scripts/blinking-contrib/test-blinking.sh light fast
```

**Environment Variables:**
- `GITHUB_USER` - GitHub username (default: diverger)
- `FRAME_DURATION` - How long each year stays visible in seconds (default: 3 for smooth, 0.5 for fast)
- `TRANSITION_DURATION` - Fade transition duration in seconds (default: 0.8 for smooth, 0 for fast)
- `TEXT_FRAME_DURATION` - Duration for ending text frame in seconds (default: 6)
- `ENDING_TEXT` - Pixel art text at end (default: username)
- `FONT_SIZE` - Font size: 3x5 or 5x7 (default: 3x5)
- `CELL_SIZE` - Cell size in pixels (default: 12)
- `CELL_GAP` - Gap between cells (default: 2)
- `CELL_RADIUS` - Cell border radius (default: 2)

**Animation Modes:**
- **smooth**: Smooth fade in/out transitions (default)
- **fast**: Instant on/off for starry blinking effect

**Output:**
- Generates timestamped SVG files in `test-outputs/`
- Creates `blinking-latest.svg` symlink for quick access
- Validates SVG structure and animation elements

### `validate-blinking.sh`
**Comprehensive validation script**

```bash
./scripts/blinking-contrib/validate-blinking.sh
```

Performs complete validation:
- ✅ File structure checks
- ✅ TypeScript compilation
- ✅ Action.yml validation
- ✅ Font configuration
- ✅ Workflow integration
- ✅ Build artifacts

## Usage Workflow

1. **Integration**: Use `test-blinking.sh` to test the full action
2. **Validation**: Use `validate-blinking.sh` before committing

## Output Location

All test outputs are saved to `test-outputs/` directory:
```text
test-outputs/
├── blinking-dark-smooth-20241018_143022.svg    # Timestamped outputs
├── blinking-light-fast-20241018_143155.svg
└── blinking-latest.svg -> blinking-light-fast-20241018_143155.svg  # Latest symlink
```

## Font Configuration

The blinking action supports two font sizes for ending text:

- **3x5 (Compact)**: Fits more characters, ideal for longer messages (8-10 characters)
- **5x7 (Standard)**: Better readability, suitable for short text (4-6 characters)

Both fonts support uppercase letters only (A-Z, 0-9, space, -!?.:).

## Troubleshooting

**Common Issues:**

1. **"Blinking package directory not found"**
   - Run scripts from repository root
   - Ensure `packages/blinking-contrib/` exists

2. **"Build failed - dist/index.js not found"**
   - Check npm build errors
   - Verify `npm install` completed successfully
   - Ensure TypeScript source files exist

3. **"Failed to generate SVG"**
   - Check GitHub token permissions
   - Verify internet connection for API calls
   - Check user exists and has public contributions

4. **"Text not appearing correctly"**
   - Check font size (3x5 vs 5x7)
   - Ensure text is uppercase only
   - Verify text contains only supported characters

**Debug Mode:**
```bash
# Enable verbose output
set -x
./scripts/blinking-contrib/test-blinking.sh dark fast
```