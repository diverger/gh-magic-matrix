# SVG Creator Package

A comprehensive TypeScript package for generating animated SVG elements for game visualizations. Provides modular utilities for creating SVG graphics with CSS animations, including grid cells, snake movement, and stack visualizations.

## Features

- **🎨 Grid Rendering**: Animated grid cells with configurable colors and timing
- **🐍 Snake Animation**: Smooth snake movement with path animations
- **📚 Stack Visualization**: Layered stack elements with growth animations
- **⚡ CSS Animations**: Optimized keyframe animations with customizable timing
- **🔧 TypeScript**: Full type safety with comprehensive TSDoc documentation
- **🎯 Modular Design**: Individual components can be used independently

## Installation

```bash
npm install @magic-matrix/svg-creator
```

## Quick Start

### Grid Rendering

```typescript
import { renderAnimatedSvgGrid, createAnimatedGridCells } from '@magic-matrix/svg-creator';

const gridOptions = {
  colorDots: { 1: '#4ade80', 2: '#3b82f6', 3: '#f59e0b' },
  colorEmpty: '#f3f4f6',
  colorDotBorder: '#374151',
  cellSize: 16,
  dotSize: 12,
  dotBorderRadius: 6
};

const cells = createAnimatedGridCells(grid, snakeChain, null);
const result = renderAnimatedSvgGrid(cells, gridOptions);

// result.elements contains SVG strings
// result.styles contains CSS animations
```

### Snake Animation

```typescript
import { renderAnimatedSvgSnake } from '@magic-matrix/svg-creator';

const snakeConfig = {
  styling: {
    body: '#4ade80',
    head: '#22c55e',
    bodyBorder: '#166534'
  },
  cellSize: 16,
  thickness: 0.8,
  borderRadius: 2,
  animationDuration: 3.0
};

const result = renderAnimatedSvgSnake(snakeMovement, snakeConfig);
```

### Stack Visualization

```typescript
import { renderAnimatedSvgStacks } from '@magic-matrix/svg-creator';

const stackConfig = {
  styling: {
    layers: { 1: '#3b82f6', 2: '#1d4ed8', 3: '#1e40af' },
    base: '#64748b',
    shadow: '#000000',
    border: '#374151'
  },
  cellSize: 16,
  maxHeight: 5,
  layerThickness: 4,
  borderRadius: 2,
  animationDuration: 2.0
};

const result = renderAnimatedSvgStacks(stackData, stackConfig);
```

## API Reference

### Core Utilities

#### `svg-utils.ts`
- `createElement(tagName, attributes)` - Create SVG element strings
- `convertToAttributes(attributes)` - Convert object to SVG attributes
- `createSvgContainer(options)` - Create SVG container with viewBox
- `escapeXml(text)` - Escape XML special characters

#### `css-utils.ts`
- `createKeyframeAnimation(name, keyframes)` - Generate CSS keyframe animations
- `toPercentage(value)` - Convert decimal to percentage string
- `minifyCss(css)` - Minify CSS strings
- `generateColorVariables(colors)` - Create CSS color variables

### Rendering Components

#### Grid Renderer (`svg-grid-renderer.ts`)

**Interfaces:**
- `AnimatedGridCell` - Grid cell with animation properties
- `SvgGridRenderOptions` - Grid rendering configuration
- `SvgGridResult` - Rendering result with elements and styles

**Functions:**
- `createAnimatedGridCells(grid, snakeChain, visibleCells)` - Create animated grid cells
- `renderAnimatedSvgGrid(cells, options)` - Render animated grid SVG

#### Snake Renderer (`svg-snake-renderer.ts`)

**Interfaces:**
- `SnakeColorConfig` - Snake color configuration
- `SvgSnakeConfig` - Snake rendering configuration
- `SvgSnakeResult` - Rendering result with elements and styles

**Functions:**
- `renderAnimatedSvgSnake(snakeChain, config)` - Render animated snake SVG
- `renderStaticSvgSnake(snake, config)` - Render static snake SVG
- `createSnakeSegmentPath(from, to, config)` - Create path for snake segment

#### Stack Renderer (`svg-stack-renderer.ts`)

**Interfaces:**
- `StackData` - Stack position and height data
- `SvgStackConfig` - Stack rendering configuration
- `SvgStackResult` - Rendering result with elements and styles

**Functions:**
- `renderAnimatedSvgStacks(stacks, config)` - Render animated stacks
- `renderStaticSvgStacks(stacks, config)` - Render static stacks
- `createStacksFromGrid(width, height, getColor, getHeight)` - Convert grid to stacks

## Animation System

The package uses CSS keyframe animations for smooth, performant graphics:

```typescript
interface AnimationKeyframe {
  /** Time offset (0-1) when this keyframe occurs */
  t: number;
  /** CSS style declarations for this keyframe */
  style: string;
}
```

Animations are optimized by:
- Merging identical keyframes
- Using CSS transforms for performance
- Minimizing animation complexity
- Supporting custom timing functions

## Type Safety

All components are fully typed with comprehensive TSDoc documentation:

```typescript
/**
 * Renders an animated SVG grid with timed cell appearances.
 *
 * @param cells - Array of animated grid cells with timing information.
 * @param options - Grid rendering configuration options.
 * @returns SVG rendering result with elements and animation styles.
 */
export const renderAnimatedSvgGrid = (
  cells: AnimatedGridCell[],
  options: SvgGridRenderOptions
): SvgGridResult
```

## Integration

The svg-creator package integrates seamlessly with other magic-matrix components:

- Uses `Point` and `Grid` types from `@magic-matrix/types`
- Works with `Snake` instances from game logic
- Supports contribution data from `@magic-matrix/user-contribution-fetcher`
- Compatible with canvas rendering from `@magic-matrix/draw`

## Performance

- **String-based SVG generation** for minimal memory usage
- **CSS animations** leverage browser optimization
- **Modular architecture** allows tree-shaking unused components
- **Efficient keyframe merging** reduces animation complexity

## Browser Support

- Modern browsers supporting CSS animations
- SVG 1.1 compatible
- ES2020+ JavaScript features
- TypeScript 5.0+ for development