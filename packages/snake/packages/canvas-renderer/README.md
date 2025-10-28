# @snake/canvas-renderer

Canvas rendering utilities for grids, snakes, and visual elements in the gh-magic-matrix project.

## Features

- **Grid Rendering**: Render game grids with customizable colors and styles
- **Snake Rendering**: Draw snakes with smooth animations and interpolation
- **Stack Visualization**: Display progress and collected items
- **World Scenes**: Complete scene rendering with all game elements
- **Animation Support**: Smooth transitions and interpolated movements
- **TypeScript**: Full type safety with comprehensive interfaces

## Installation

```bash
npm install @snake/canvas-renderer
```

## Quick Start

```typescript
import { renderWorld, WorldRenderOptions } from "@snake/canvas-renderer";

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

const options: WorldRenderOptions = {
  colorDots: {
    1: '#196127',
    2: '#239a3b',
    3: '#7bc96f',
    4: '#c6e48b'
  },
  colorEmpty: '#161b22',
  colorDotBorder: '#21262d',
  colorSnake: '#7c3aed',
  cellSize: 16,
  dotSize: 12,
  dotBorderRadius: 2
};

renderWorld(ctx, grid, null, snake, stack, options);
```

## API Reference

### Core Utilities

#### `createRoundedRectPath(ctx, width, height, borderRadius)`
Creates a rounded rectangle path on the canvas context.

#### `lerp(t, start, end)`
Linear interpolation between two values.

#### `clamp(value, min, max)`
Clamps a value between min and max bounds.

### Grid Rendering

#### `renderGrid(ctx, grid, cells, options)`
Renders a grid with colored dots.

**Options:**
- `colorDots`: Color mapping for different cell values
- `colorEmpty`: Color for empty cells
- `colorDotBorder`: Border color for dots
- `cellSize`: Size of each grid cell
- `dotSize`: Size of dots within cells
- `dotBorderRadius`: Border radius for rounded dots

### Snake Rendering

#### `renderSnake(ctx, snake, options)`
Renders a snake with tapered segments.

#### `renderSnakeWithInterpolation(ctx, snakeStart, snakeEnd, t, options)`
Renders a snake with smooth animation between two states.

**Options:**
- `colorSnake`: Color for snake segments
- `cellSize`: Size of each grid cell

### Stack Visualization

#### `renderHorizontalStack(ctx, stack, maxItems, totalWidth, options)`
Renders a horizontal progress bar showing collected items.

#### `renderCircularStack(ctx, stack, options)`
Renders items in a circular pattern.

### World Rendering

#### `renderWorld(ctx, grid, visibleCells, snake, stack, options)`
Renders a complete game scene with all elements.

#### `renderWorldWithInterpolation(ctx, grid, visibleCells, snakeStart, snakeEnd, stack, t, options)`
Renders a complete scene with animated snake movement.

## Examples

### Basic Grid Rendering

```typescript
import { renderGrid, GridRenderOptions } from "@snake/canvas-renderer";

const gridOptions: GridRenderOptions = {
  colorDots: { 1: '#196127', 2: '#239a3b' },
  colorEmpty: '#161b22',
  colorDotBorder: '#21262d',
  cellSize: 16,
  dotSize: 12,
  dotBorderRadius: 2
};

renderGrid(ctx, grid, null, gridOptions);
```

### Animated Snake

```typescript
import { renderSnakeWithInterpolation } from "@snake/canvas-renderer";

// Animate between two snake states
const animationProgress = 0.5; // 50% through animation
renderSnakeWithInterpolation(ctx, oldSnake, newSnake, animationProgress, {
  colorSnake: '#7c3aed',
  cellSize: 16
});
```

### Custom Color Schemes

```typescript
// GitHub-style green theme
const githubTheme = {
  colorDots: {
    1: '#0e4429',
    2: '#006d32',
    3: '#26a641',
    4: '#39d353'
  },
  colorEmpty: '#161b22',
  colorDotBorder: '#21262d',
  colorSnake: '#f85149'
};

// Matrix-style theme
const matrixTheme = {
  colorDots: {
    1: '#003300',
    2: '#00ff00',
    3: '#66ff66',
    4: '#ccffcc'
  },
  colorEmpty: '#000000',
  colorDotBorder: '#004400',
  colorSnake: '#ff0000'
};
