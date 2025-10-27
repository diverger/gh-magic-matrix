/**
 * CSS Animation Generator for GitHub README Compatible SVG
 * 
 * This module generates optimized CSS @keyframes animations using:
 * 1. **Shared keyframes** - All elements of same type share one @keyframes
 * 2. **animation-delay** - Control timing per element instead of unique keyframes
 * 3. **CSS variables** - Pass colors, positions dynamically via custom properties
 * 4. **Minimal CSS** - Drastically reduced code size vs per-element keyframes
 * 
 * Key optimizations over SNK approach:
 * - 1 keyframe for all grid cells (vs N keyframes for N cells)
 * - CSS variables for colors (--gc-color) instead of hardcoded fills
 * - animation-delay for timing (vs unique time offsets in keyframes)
 * - calc() for dynamic positioning where beneficial
 */

import { createKeyframeAnimation, type AnimationKeyframe, generateColorVariables } from "./css-utils";
import type { Color } from "../types/grid";

/**
 * Grid cell position and animation timing
 */
export interface GridCellAnimation {
  /** Grid cell X position */
  x: number;
  /** Grid cell Y position */
  y: number;
  /** Frame index when snake eats this cell (0-1 normalized) */
  eatTime: number;
  /** Color level after eating (0=empty, 1-4=contribution levels) */
  colorLevel: Color | 0;
}

/**
 * Snake body segment position over time
 */
export interface SnakeSegmentAnimation {
  /** Segment index (0=head, 1-n=body) */
  segmentIndex: number;
  /** Positions at each frame */
  positions: Array<{ x: number; y: number; t: number }>;
}

/**
 * Progress bar block configuration
 */
export interface ProgressBarBlock {
  /** Block X position */
  x: number;
  /** Block width */
  width: number;
  /** Color level (1-4) */
  colorLevel: Color;
  /** Growth keyframes (time -> scale value) */
  growthKeyframes: Array<{ t: number; scale: number }>;
}

/**
 * CSS Animation generation options
 */
export interface CssAnimationOptions {
  /** Total animation duration in milliseconds */
  duration: number;
  /** Cell size in pixels */
  cellSize: number;
  /** Dot size for progress bar */
  dotSize: number;
  /** Color palette */
  colors: {
    empty: string;
    level1: string;
    level2: string;
    level3: string;
    level4: string;
    snake: string;
  };
}

/**
 * Generated CSS animation result
 */
export interface CssAnimationResult {
  /** CSS style rules (including @keyframes) */
  styles: string;
  /** CSS variable declarations */
  variables: string;
  /** Class names for SVG elements */
  cellClassNames: Map<string, string>; // "x,y" -> class name
  snakeClassNames: string[]; // segment index -> class name
  progressBarClassNames: string[]; // block index -> class name
}

/**
 * Generates CSS variables for color palette
 */
const generateColorPalette = (colors: CssAnimationOptions['colors']): string => {
  return [
    `--ce:${colors.empty}`, // empty cell
    `--c1:${colors.level1}`, // level 1
    `--c2:${colors.level2}`, // level 2
    `--c3:${colors.level3}`, // level 3
    `--c4:${colors.level4}`, // level 4
    `--cs:${colors.snake}`, // snake body
  ].join(';') + ';';
};

/**
 * Generates OPTIMIZED CSS animation for grid cells
 * Uses single shared @keyframes + animation-delay + CSS variables
 */
const generateGridCellAnimations = (
  cells: GridCellAnimation[],
  options: CssAnimationOptions
): { styles: string[]; classNames: Map<string, string> } => {
  const styles: string[] = [];
  const classNames = new Map<string, string>();

  // Single shared keyframe: empty -> colored (instant transition)
  // Uses CSS variable --gc-color set per element
  const sharedKeyframes: AnimationKeyframe[] = [
    { t: 0, style: `fill:var(--ce)` },
    { t: 0.999, style: `fill:var(--ce)` },
    { t: 1, style: `fill:var(--gc-color)` },
  ];

  styles.push(
    createKeyframeAnimation('gcEat', sharedKeyframes),
    `.gc {
      fill: var(--ce);
      animation: gcEat 1ms linear forwards;
      animation-play-state: paused;
    }`
  );

  // For each cell, set CSS variable and animation-delay
  cells.forEach((cell, index) => {
    if (cell.colorLevel === 0) {
      // Empty cell - no animation, stays --ce colored
      return;
    }

    const className = `gc${index}`;
    const key = `${cell.x},${cell.y}`;
    classNames.set(key, className);

    // Set color variable and delay
    // animation-delay: negative value starts animation at specific point
    const delayMs = Math.round(cell.eatTime * options.duration);
    
    styles.push(
      `.gc.${className} {
        --gc-color: var(--c${cell.colorLevel});
        animation-play-state: running;
        animation-delay: -${delayMs}ms;
      }`
    );
  });

  return { styles, classNames };
};

/**
 * Generates OPTIMIZED CSS animation for snake body segments
 * 
 * Strategy: Each segment gets its own @keyframes (unavoidable for different paths),
 * but we optimize by:
 * 1. Removing interpolated positions (SNK optimization - keep this!)
 * 2. Using transform-origin to reduce calculations
 * 3. Simplifying keyframe timing with animation timing functions
 */
const generateSnakeAnimations = (
  segments: SnakeSegmentAnimation[],
  options: CssAnimationOptions
): { styles: string[]; classNames: string[] } => {
  const styles: string[] = [];
  const classNames: string[] = [];

  // Base style for all snake segments  
  styles.push(
    `.sn {
      shape-rendering: geometricPrecision;
      fill: var(--cs);
      animation: none linear ${options.duration}ms infinite;
    }`
  );

  segments.forEach((segment) => {
    const className = `sn${segment.segmentIndex}`;
    const animationName = `sna${segment.segmentIndex}`;
    classNames[segment.segmentIndex] = className;

    // Optimize: Remove interpolated positions to reduce keyframe count
    const optimizedPositions = removeInterpolatedPositions(segment.positions);

    // Create transform keyframes with optimized precision
    const keyframes: AnimationKeyframe[] = optimizedPositions.map(({ x, y, t }) => ({
      t,
      style: `transform:translate(${(x * options.cellSize).toFixed(1)}px,${(y * options.cellSize).toFixed(1)}px)`
    }));

    const initialPos = segment.positions[0];
    const initialTransform = `transform:translate(${(initialPos.x * options.cellSize).toFixed(1)}px,${(initialPos.y * options.cellSize).toFixed(1)}px)`;

    styles.push(
      createKeyframeAnimation(animationName, keyframes),
      `.sn.${className} {
        ${initialTransform};
        animation-name: ${animationName};
      }`
    );
  });

  return { styles, classNames };
};

/**
 * Generates OPTIMIZED CSS animation for progress bar blocks
 * 
 * Strategy: Use shared @keyframes for scale animation pattern,
 * customize per block with:
 * 1. CSS variable --pb-max-scale for final scale value
 * 2. animation-delay for timing offset
 * 3. transform-origin for growth anchor point
 * 
 * This reduces CSS from N keyframes to 1 shared keyframe!
 */
const generateProgressBarAnimations = (
  blocks: ProgressBarBlock[],
  options: CssAnimationOptions
): { styles: string[]; classNames: string[] } => {
  const styles: string[] = [];
  const classNames: string[] = [];

  // Shared keyframe: grow from 0 to var(--pb-max-scale)
  const sharedKeyframes: AnimationKeyframe[] = [
    { t: 0, style: `transform:scale(0,1)` },
    { t: 0.999, style: `transform:scale(0,1)` },
    { t: 1, style: `transform:scale(var(--pb-max-scale,1),1)` },
  ];

  styles.push(
    createKeyframeAnimation('pbGrow', sharedKeyframes),
    `.pb {
      transform-origin: 0 0;
      transform: scale(0,1);
      animation: pbGrow 1ms linear forwards;
      animation-play-state: paused;
    }`
  );

  blocks.forEach((block, index) => {
    const className = `pb${index}`;
    classNames[index] = className;

    // Calculate timing: when does this block start/finish growing?
    const growKeyframes = block.growthKeyframes;
    if (growKeyframes.length === 0) return;

    // Find first non-zero growth and final scale
    const firstGrowth = growKeyframes.find(kf => kf.scale > 0);
    const finalScale = growKeyframes[growKeyframes.length - 1].scale;
    
    if (!firstGrowth) return;

    const delayMs = Math.round(firstGrowth.t * options.duration);

    styles.push(
      `.pb.${className} {
        fill: var(--c${block.colorLevel});
        transform-origin: ${block.x.toFixed(1)}px 0;
        --pb-max-scale: ${finalScale.toFixed(3)};
        animation-play-state: running;
        animation-delay: -${delayMs}ms;
      }`
    );
  });

  return { styles, classNames };
};

/**
 * Removes interpolated positions to optimize animation size
 * Keeps only positions where direction changes
 * (Same optimization as SNK)
 */
const removeInterpolatedPositions = <T extends { x: number; y: number }>(
  positions: T[]
): T[] => {
  return positions.filter((pos, i, arr) => {
    if (i - 1 < 0 || i + 1 >= arr.length) return true;

    const prev = arr[i - 1];
    const next = arr[i + 1];

    const expectedX = (prev.x + next.x) / 2;
    const expectedY = (prev.y + next.y) / 2;

    // Keep position if it's not exactly midway between neighbors
    return !(Math.abs(expectedX - pos.x) < 0.01 && Math.abs(expectedY - pos.y) < 0.01);
  });
};

/**
 * Main function: Generate complete CSS animation system
 * 
 * @param gridCells - Grid cell animation data
 * @param snakeSegments - Snake body segment animation data
 * @param progressBlocks - Progress bar block animation data
 * @param options - Animation options
 * @returns Complete CSS animation result
 * 
 * @example
 * ```typescript
 * const result = generateCssAnimations(
 *   gridCells,
 *   snakeSegments,
 *   progressBlocks,
 *   {
 *     duration: 10000,
 *     cellSize: 10,
 *     dotSize: 2,
 *     colors: {
 *       empty: '#161b22',
 *       level1: '#0e4429',
 *       level2: '#006d32',
 *       level3: '#26a641',
 *       level4: '#39d353',
 *       snake: '#ffffff'
 *     }
 *   }
 * );
 * 
 * // Use in SVG:
 * // <style>${result.variables}${result.styles}</style>
 * // <rect class="gc ${result.cellClassNames.get('5,10')}" ... />
 * ```
 */
export const generateCssAnimations = (
  gridCells: GridCellAnimation[],
  snakeSegments: SnakeSegmentAnimation[],
  progressBlocks: ProgressBarBlock[],
  options: CssAnimationOptions
): CssAnimationResult => {
  // Generate color variables
  const variables = `:root{${generateColorPalette(options.colors)}}`;

  // Generate animations for each component
  const gridResult = generateGridCellAnimations(gridCells, options);
  const snakeResult = generateSnakeAnimations(snakeSegments, options);
  const progressResult = generateProgressBarAnimations(progressBlocks, options);

  // Combine all styles
  const allStyles = [
    ...gridResult.styles,
    ...snakeResult.styles,
    ...progressResult.styles,
  ].join('\n');

  return {
    styles: allStyles,
    variables,
    cellClassNames: gridResult.classNames,
    snakeClassNames: snakeResult.classNames,
    progressBarClassNames: progressResult.classNames,
  };
};
