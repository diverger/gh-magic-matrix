# Breathing Action Scripts

Testing and validation scripts for the breathing GitHub action.

## Scripts

### `test-breathing.sh`
**Main testing script for the breathing action**

```bash
# Basic usage
./scripts/breathing-contrib/test-breathing.sh              # Dark theme (default)
./scripts/breathing-contrib/test-breathing.sh light        # Light theme
./scripts/breathing-contrib/test-breathing.sh dark         # Dark theme

# With custom parameters
GITHUB_USER=octocat PERIOD=4 ./scripts/breathing-contrib/test-breathing.sh light
```

**Environment Variables:**
- `GITHUB_USER` - GitHub username (default: diverger)
- `PERIOD` - Breathing cycle duration in seconds (default: 6)
- `CELL_SIZE` - Cell size in pixels (default: 12)
- `CELL_GAP` - Gap between cells (default: 2)
- `CELL_RADIUS` - Cell border radius (default: 2)

**Output:**
- Generates timestamped SVG files in `test-outputs/`
- Creates `breathing-latest.svg` symlink for quick access
- Validates SVG structure and animation elements

### `validate-breathing.sh`
**Comprehensive validation script**

```bash
./scripts/breathing-contrib/validate-breathing.sh
```

Performs complete validation:
- ✅ File structure checks
- ✅ TypeScript compilation
- ✅ Action.yml validation
- ✅ Workflow integration
- ✅ Build artifacts

## Usage Workflow

1. **Integration**: Use `test-breathing.sh` to test the full action
2. **Validation**: Use `validate-breathing.sh` before committing

## Output Location

All test outputs are saved to `test-outputs/` directory:
```
test-outputs/
├── breathing-20241018_143022.svg    # Timestamped outputs
├── breathing-20241018_143155.svg
└── breathing-latest.svg -> breathing-20241018_143155.svg  # Latest symlink
```

## Troubleshooting

**Common Issues:**

1. **"Breathing package directory not found"**
   - Run scripts from repository root
   - Ensure `packages/breathing-contrib/` exists

2. **"Build failed - dist/index.js not found"**
   - Check npm build errors
   - Verify `npm install` completed successfully
   - Ensure TypeScript source files exist

3. **"Failed to generate SVG"**
   - Check GitHub token permissions
   - Verify internet connection for API calls
   - Check user exists and has public contributions

**Debug Mode:**
```bash
# Enable verbose output
set -x
./scripts/breathing-contrib/test-breathing.sh dark
```