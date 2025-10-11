# LED Billboard Quick Start

## Installation

The LED Billboard action is already built and ready to use at:
- **Action**: `diverger/gh-magic-matrix/led-billboard@main`
- **Dist**: `/dist/led-billboard/index.js` (492kB)

## Minimal Example

```yaml
- uses: diverger/gh-magic-matrix/led-billboard@main
  with:
    input_path: 'my-images/*.svg'
    output_path: 'billboard.svg'
```

## Complete Example

```yaml
- name: Create LED Display
  uses: diverger/gh-magic-matrix/led-billboard@main
  with:
    # Input/Output
    input_path: 'frames/*.svg'        # Multiple SVG files
    output_path: 'display.svg'

    # Matrix Size (0 = auto-detect)
    matrix_width: '64'
    matrix_height: '32'

    # LED Appearance
    cell_size: '10'                   # 10px per LED
    cell_gap: '3'                     # 3px spacing
    cell_radius: '2'                  # Rounded edges

    # Colors
    background_color: '#000000'
    led_on_color: '#00ff00'           # Green
    led_off_color: '#003300'          # Dark green

    # Timing (seconds, comma-separated)
    frame_durations: '0.5,0.5,1'
```

## Testing Locally

```bash
# Run the example
cd gh-magic-matrix
bun dist/led-billboard/index.js

# With environment variables
INPUT_INPUT_PATH="examples/led-billboard" \
INPUT_OUTPUT_PATH="test-output.svg" \
INPUT_MATRIX_WIDTH="32" \
INPUT_MATRIX_HEIGHT="32" \
bun dist/led-billboard/index.js
```

## File Structure

```
led-billboard/
├── action.yml                # GitHub Action metadata
packages/led-billboard/
├── src/
│   ├── index.ts             # Core logic
│   └── action.ts            # Action entrypoint
├── package.json
└── README.md
examples/led-billboard/
├── frame1.svg               # Test frame 1
├── frame2.svg               # Test frame 2
└── README.md
dist/led-billboard/
└── index.js                 # Compiled action
```

## Key Features

✅ Multi-frame SVG animation
✅ Auto-size detection from SVG
✅ Custom LED matrix dimensions
✅ Customizable colors and appearance
✅ Frame-based timing control
✅ Retro LED pixel style

## Next Steps

1. Add your SVG files to a directory
2. Configure the action in your workflow
3. Customize colors and matrix size
4. Run and view the animated LED billboard!

For more details, see [packages/led-billboard/README.md](../packages/led-billboard/README.md)
