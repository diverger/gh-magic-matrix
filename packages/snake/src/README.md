# Action Package

GitHub Action package for generating snake contribution animations with advanced pathfinding algorithms. This package orchestrates the entire snake generation process from data fetching to SVG output.

## Features

- **🎣 Data Fetching**: GitHub API integration for contribution data
- **🗺️ Grid Conversion**: Transform contributions to pathfinding grids
- **🧠 Smart Pathfinding**: Advanced snake routing with optimal coverage
- **🎨 SVG Generation**: Animated output with configurable styling
- **⚙️ Flexible Configuration**: Multiple output formats and options
- **🔧 TypeScript**: Full type safety with comprehensive documentation

## Usage

### As GitHub Action Entry Point

```typescript
// This is the main entry point used by the GitHub Action
import "./index";
```

### Programmatic Usage

```typescript
import { generateContributionSnake } from '@snake/action';

const outputs = [
  {
    filename: "snake.svg",
    format: "svg" as const,
    drawOptions: {
      sizeCell: 16,
      sizeDot: 12,
      sizeDotBorderRadius: 6,
      colorDots: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
      colorEmpty: "#ebedf0",
      colorSnake: "#7c3aed",
      colorDotBorder: "#1b1f230a",
    },
    animationOptions: {
      step: 1,
      frameDuration: 100,
    },
  },
];

const results = await generateContributionSnake("username", outputs, {
  githubToken: process.env.GITHUB_TOKEN!,
});
```

## Configuration

### Output Options

The action supports flexible output configuration via URL parameters or JSON:

```yaml
# URL parameter style
outputs: |
  dist/snake.svg?palette=github-dark&step=2
  dist/snake-ocean.svg?palette=ocean&frame_duration=150

# JSON style
outputs: |
  dist/snake.svg {"palette": "github-dark", "step": 2}
  dist/custom.svg {"color_dots": ["#f0f", "#0f0", "#00f"]}
```

### Available Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `palette` | string | `"default"` | Color palette name |
| `dark_palette` | string | - | Override dark theme palette |
| `color_snake` | string | - | Custom snake color |
| `color_dots` | string[] | - | Custom contribution colors |
| `color_dot_border` | string | - | Custom border color |
| `step` | number | `1` | Animation step size |
| `frame_duration` | number | `100` | Frame duration in ms |

### Color Palettes

Built-in palettes include:

- `github` / `github-light` - GitHub's default light theme
- `github-dark` - GitHub's dark theme
- `ocean` - Blue ocean theme
- `forest` - Green forest theme

## API Reference

### Main Functions

#### `generateContributionSnake(userName, outputs, options)`

Main orchestrator function that handles the complete snake generation process.

**Parameters:**
- `userName` (string) - GitHub username
- `outputs` (OutputConfig[]) - Array of output configurations
- `options` (GenerationOptions) - Generation options including GitHub token

**Returns:** Promise<(string | null)[]> - Array of generated file contents

#### `parseOutputsOption(lines)`

Parses GitHub Action output configuration strings.

**Parameters:**
- `lines` (string[]) - Array of output configuration strings

**Returns:** (OutputConfig | null)[] - Parsed output configurations

#### `userContributionToGrid(cells)`

Converts contribution data to pathfinding grid.

**Parameters:**
- `cells` (ContributionCell[]) - GitHub contribution data

**Returns:** Grid - Pathfinding grid for snake routing

### Types

#### `OutputConfig`

```typescript
interface OutputConfig {
  filename: string;
  format: "svg" | "gif";
  drawOptions: SvgDrawOptions;
  animationOptions: AnimationOptions;
}
```

#### `SvgDrawOptions`

```typescript
interface SvgDrawOptions {
  sizeCell: number;
  sizeDot: number;
  sizeDotBorderRadius: number;
  colorDotBorder: string;
  colorEmpty: string;
  colorSnake: string;
  colorDots: string[];
  dark?: {
    colorDotBorder: string;
    colorEmpty: string;
    colorSnake: string;
    colorDots: string[];
  };
}
```

#### `AnimationOptions`

```typescript
interface AnimationOptions {
  step: number;
  frameDuration: number;
}
```

## Process Flow

1. **Input Parsing** - Parse GitHub Action inputs and output configurations
2. **Data Fetching** - Fetch contribution data from GitHub GraphQL API
3. **Grid Conversion** - Transform contributions to colored pathfinding grid
4. **Pathfinding** - Compute optimal snake route using advanced algorithms
5. **SVG Generation** - Create animated SVG with CSS keyframe animations
6. **File Output** - Write generated content to specified files

## Error Handling

The action provides comprehensive error handling:

- **Invalid Configuration** - Clear messages for malformed output configs
- **API Failures** - Detailed GitHub API error reporting
- **Pathfinding Issues** - Fallback strategies for difficult grids
- **File System Errors** - Proper directory creation and permission handling

## Integration

This package integrates with other magic-matrix components:

- `@snake/user-contribution-fetcher` - GitHub API data fetching
- `@snake/solver` - Advanced pathfinding algorithms
- `@snake/svg-creator` - SVG generation and animations
- `@snake/types` - Shared type definitions

## Performance

- **Efficient Pathfinding** - Optimized A* with heuristics
- **Minimal Memory Usage** - Stream-based processing where possible
- **Fast SVG Generation** - String-based SVG creation
- **Caching Support** - Built-in caching for repeated runs

## Browser Support

Generated SVGs work in all modern browsers:
- CSS animations support
- SVG 1.1 compatibility
- Responsive design friendly
- Dark/light theme support