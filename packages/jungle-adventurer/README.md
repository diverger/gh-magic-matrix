# 🎮 Jungle Adventurer

Transform your GitHub contribution graph into an exciting shooting adventure! Watch your character run, walk, and shoot through contribution blocks with smooth sprite animations.

## Features

- 🏃 **Smooth Sprite Animations**: 8-frame sprite sheets for running, walking, and shooting
- 🔫 **Shooting Mechanics**: Character automatically shoots at contribution blocks
- 💥 **Block Destruction**: Blocks explode and disappear when hit
- 🎨 **Customizable**: Adjust character size, bullet speed, effects, and more
- 📊 **GitHub Integration**: Uses your real contribution data

## Usage

```yaml
- name: Generate Jungle Adventurer Animation
  uses: diverger/gh-magic-matrix/jungle-adventurer@main
  with:
    github_user_name: ${{ github.repository_owner }}
    output_path: dist/jungle-adventurer.svg
    sprite_run: 'assets/run.png'        # 8-frame sprite sheet
    sprite_walk: 'assets/walk.png'      # 8-frame sprite sheet
    sprite_shoot: 'assets/shoot.png'    # 8-frame sprite sheet
```

## Sprite Sheet Format

Your sprite sheets should be PNG files with **8 frames** arranged horizontally or vertically:

### Horizontal Layout (Recommended)
```
[Frame1][Frame2][Frame3][Frame4][Frame5][Frame6][Frame7][Frame8]
 48x64   48x64   48x64   48x64   48x64   48x64   48x64   48x64
```
Total size: **384x64 pixels**

### Vertical Layout
```
[Frame1]  48x64
[Frame2]  48x64
[Frame3]  48x64
[Frame4]  48x64
[Frame5]  48x64
[Frame6]  48x64
[Frame7]  48x64
[Frame8]  48x64
```
Total size: **48x512 pixels**

The system automatically detects the layout based on image dimensions.

## Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `github_user_name` | GitHub username | **Required** |
| `output_path` | Output SVG file path | `jungle-adventurer.svg` |
| `sprite_run` | Running sprite sheet (8 frames) | **Required** |
| `sprite_walk` | Walking sprite sheet (8 frames) | Optional |
| `sprite_shoot` | Shooting sprite sheet (8 frames) | Optional |
| `sprite_layout` | `horizontal` or `vertical` | `auto` (detect) |
| `cell_size` | Contribution cell size (px) | `12` |
| `character_scale` | Character scale factor | `1.0` |
| `bullet_speed` | Bullet speed (px/s) | `150` |
| `fire_rate` | Shots per second | `3` |
| `animation_fps` | Sprite animation FPS | `12` |
| `color_levels` | 5 contribution colors | GitHub default |

## Examples

### Basic Usage
```yaml
- uses: diverger/gh-magic-matrix/jungle-adventurer@main
  with:
    github_user_name: diverger
    sprite_run: 'sprites/hero_run.png'
    output_path: 'dist/adventure.svg'
```

### Custom Styling
```yaml
- uses: diverger/gh-magic-matrix/jungle-adventurer@main
  with:
    github_user_name: diverger
    sprite_run: 'sprites/hero_run.png'
    sprite_shoot: 'sprites/hero_shoot.png'
    cell_size: '16'
    character_scale: '1.2'
    bullet_speed: '200'
    fire_rate: '5'
    color_levels: '#f0f0f0,#ffb3ba,#ffdfba,#ffffba,#baffc9'
```

## How It Works

1. **Fetch Data**: Retrieves your GitHub contribution history
2. **Plan Route**: Calculates optimal path to clear all blocks
3. **Animate Character**: Cycles through sprite frames for movement
4. **Shoot Bullets**: Fires at nearby blocks while moving
5. **Destroy Blocks**: Blocks explode on hit with visual effects
6. **Generate SVG**: Creates an animated SVG with all elements

## Sprite Animation Details

- **Frame Count**: 8 frames per animation
- **Frame Size**: 48x64 pixels (each frame)
- **Sprite Size**: 16x32 pixels (actual character)
- **Frame Rate**: 12 FPS (0.08s per frame, full cycle = 0.67s)
- **Layout**: Auto-detected from image aspect ratio

## License

MIT
