# Snake GitHub Contribution Graph

An advanced snake contribution animation generator using sophisticated pathfinding algorithms, inspired by the original SNK project.

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
