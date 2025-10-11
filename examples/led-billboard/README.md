# LED Billboard Examples

This directory contains example SVG files for testing the LED Billboard generator.

## Example Files

- `frame1.svg` - Smiley face
- `frame2.svg` - Winking face

## Usage

```yaml
- name: Generate LED Billboard
  uses: ./led-billboard
  with:
    input_path: 'examples/led-billboard/*.svg'
    output_path: 'billboard-example.svg'
    matrix_width: '32'
    matrix_height: '32'
    led_on_color: '#00ff00'
    frame_durations: '0.5,0.5'
```

This will create an animated billboard that alternates between the smiley and winking faces.
