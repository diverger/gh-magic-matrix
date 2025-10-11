# LED Billboard Generator

Convert SVG images to animated pixel-style LED billboard display with customizable matrix size and colors.

## Features

- 🎬 **Multi-frame Animation**: Support multiple SVG files for frame-by-frame animation
- 📏 **Auto-sizing**: Automatically infer matrix dimensions from SVG files
- 🎨 **Customizable Colors**: Set background, LED on/off colors
- ⚙️ **Flexible Configuration**: Control LED size, spacing, and border radius
- 🔄 **Smooth Transitions**: Animated LED state changes with custom frame durations

## Usage

### Basic Example

```yaml
- name: Generate LED Billboard
  uses: diverger/gh-magic-matrix/led-billboard@main
  with:
    input_path: 'images/*.svg'
    output_path: 'output/billboard.svg'
```

### Advanced Example with Custom Settings

```yaml
- name: Generate Custom LED Billboard
  uses: diverger/gh-magic-matrix/led-billboard@main
  with:
    input_path: 'frames'              # Directory containing SVG files
    output_path: 'billboard.svg'
    matrix_width: '64'                # 64 LEDs wide
    matrix_height: '32'               # 32 LEDs tall
    cell_size: '10'                   # 10px per LED
    cell_gap: '3'                     # 3px gap between LEDs
    cell_radius: '2'                  # Rounded corners
    background_color: '#0a0a0a'       # Dark background
    led_on_color: '#ff0000'           # Red when on
    led_off_color: '#330000'          # Dark red when off
    frame_durations: '0.5,0.5,1,0.5'  # Custom timing per frame
```

### Matrix Display Example

```yaml
- name: Create Scrolling Text Display
  uses: diverger/gh-magic-matrix/led-billboard@main
  with:
    input_path: 'text-frames/*.svg'
    matrix_width: '80'
    matrix_height: '16'
    led_on_color: '#00ff00'           # Classic green LED
    led_off_color: '#001100'
    frame_durations: '0.1,0.1,0.1'    # Fast scrolling
```

## Input Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `input_path` | Path to SVG file(s) - glob pattern or directory | **Required** |
| `output_path` | Output path for LED billboard SVG | `led-billboard.svg` |
| `matrix_width` | LED matrix width (0 = auto) | `0` |
| `matrix_height` | LED matrix height (0 = auto) | `0` |
| `cell_size` | Size of each LED in pixels | `8` |
| `cell_gap` | Gap between LEDs in pixels | `2` |
| `cell_radius` | Border radius for rounded LEDs | `1` |
| `background_color` | Background hex color | `#000000` |
| `led_on_color` | LED on state hex color | `#00ff00` |
| `led_off_color` | LED off state hex color | `#003300` |
| `stretch` | Stretch to fill matrix (true) or maintain aspect ratio (false) | `false` |
| `frame_durations` | Comma-separated durations (seconds) | `1s` per frame |

## Input Formats

### Glob Patterns
```yaml
input_path: 'images/*.svg'           # All SVG files in images/
input_path: 'frames/frame-*.svg'     # Matching pattern
```

### Directory
```yaml
input_path: 'my-frames'              # All SVG files in directory
```

### Single File
```yaml
input_path: 'image.svg'              # Single static image
```

## How It Works

1. **SVG Parsing**: Reads SVG file(s) and converts to pixel matrix
2. **Auto-sizing**: Infers dimensions from SVG viewBox or uses custom size
3. **LED Rendering**: Creates circle elements for each LED position
4. **Animation**: Uses SMIL animations to transition between frames
5. **Output**: Generates single animated SVG file

## Aspect Ratio & Stretching

The `stretch` parameter controls how SVG content is scaled to fit the LED matrix:

### Maintain Aspect Ratio (Default: `stretch: 'false'`)
- Preserves original proportions of the SVG
- Centers content with letterboxing/pillarboxing
- Best for logos, icons, or graphics where proportions matter
- Example: 16:9 video on a square matrix adds black bars on sides

```yaml
stretch: 'false'              # Recommended for logos and images
matrix_width: '32'
matrix_height: '32'           # SVG aspect ratio preserved, centered
```

### Fill Matrix (`stretch: 'true'`)
- Stretches SVG to fill entire matrix dimensions
- May distort aspect ratio
- Best for text displays or when you want maximum fill
- Example: Wide text fills full width regardless of height ratio

```yaml
stretch: 'true'               # Recommended for text scrollers
matrix_width: '80'
matrix_height: '16'           # SVG stretched to fill 80x16
```

## Color Schemes

### Classic Green LED
```yaml
background_color: '#000000'
led_on_color: '#00ff00'
led_off_color: '#003300'
```

### Red Alert
```yaml
background_color: '#1a0000'
led_on_color: '#ff0000'
led_off_color: '#330000'
```

### Blue Digital
```yaml
background_color: '#00000a'
led_on_color: '#00aaff'
led_off_color: '#002233'
```

### Amber Retro
```yaml
background_color: '#000000'
led_on_color: '#ffaa00'
led_off_color: '#332200'
```

```

## Frame Durations

Control how long each frame displays:

```yaml
frame_durations: '1,0.5,0.5,2'       # 1s, 0.5s, 0.5s, 2s
frame_durations: '0.1,0.1,0.1'       # Fast animation (100ms each)
```

If not specified, each frame displays for 1 second.

## Tips

- **Matrix Size**: Start with auto-sizing (0x0) and adjust as needed
- **LED Size**: Larger cells (12-16px) work better for larger displays
- **Gaps**: Increase gap for more authentic LED matrix look
- **Colors**: Use darker off-colors for better contrast
- **Frame Count**: Keep under 20 frames for reasonable file size

## Examples

See the [examples directory](../../examples/led-billboard/) for sample configurations and SVG inputs.

## License

MIT
