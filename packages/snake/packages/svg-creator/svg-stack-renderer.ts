/**
 * SVG Stack Renderer
 *
 * Provides functionality for rendering stack-based SVG elements with layered animations.
 * Creates visual stacks with configurable colors, shadows, and smooth transitions.
 *
 * @module svg-stack-renderer
 */

import { Point } from "../types/point";
import type { Color, Empty } from "../types/grid";
import { createKeyframeAnimation, type AnimationKeyframe } from "./css-utils";
import { createElement } from "./svg-utils";

/**
 * Configuration options for SVG stack rendering.
 */
export interface SvgStackConfig {
  /** Stack visual styling options */
  styling: {
    /** Stack layer colors indexed by level */
    layers: Record<number, string>;
    /** Base layer color */
    base: string;
    /** Shadow color */
    shadow: string;
    /** Border color */
    border: string;
  };
  /** Size of each grid cell in pixels */
  cellSize: number;
  /** Maximum stack height to render */
  maxHeight: number;
  /** Layer thickness in pixels */
  layerThickness: number;
  /** Corner radius for stack layers */
  borderRadius: number;
  /** Animation duration in milliseconds */
  animationDuration: number;
}

/**
 * Represents a stack at a specific position with height and timing.
 */
export interface StackData {
  /** Position of the stack */
  position: Point;
  /** Height of the stack (number of layers) */
  height: number;
  /** Color of the base layer */
  color: Color | Empty;
  /** Animation timing offset (0-1) */
  animationTime: number | null;
}

/**
 * Result of SVG stack rendering containing elements and styles.
 */
export interface SvgStackResult {
  /** SVG elements representing the stacks */
  elements: string[];
  /** CSS animation styles */
  styles: string;
  /** Total animation duration in milliseconds */
  duration: number;
}

/**
 * Creates an SVG group element representing a single stack with multiple layers.
 *
 * @param stack - Stack data including position, height, and color.
 * @param config - Stack rendering configuration.
 * @returns SVG group element string containing all stack layers.
 */
export const createStackLayers = (
  stack: StackData,
  config: SvgStackConfig
): string => {
  const { cellSize, layerThickness, borderRadius, styling } = config;
  const { position, height, color } = stack;

  const x = position.x * cellSize;
  const y = position.y * cellSize;
  const layers: string[] = [];

  // Create base layer
  const baseLayer = createElement("rect", {
    x: x + 2,
    y: y + cellSize - layerThickness,
    width: cellSize - 4,
    height: layerThickness,
    fill: typeof color === "string" ? color : styling.base,
    stroke: styling.border,
    "stroke-width": "0.5",
    rx: borderRadius,
    ry: borderRadius,
  });
  layers.push(baseLayer);

  // Create stack layers with depth effect
  for (let i = 1; i < Math.min(height, config.maxHeight); i++) {
    const layerY = y + cellSize - layerThickness - (i * (layerThickness * 0.8));
    const layerOffset = i * 0.5; // Slight offset for 3D effect

    const layer = createElement("rect", {
      x: x + 2 + layerOffset,
      y: layerY,
      width: cellSize - 4 - layerOffset,
      height: layerThickness,
      fill: styling.layers[i] || styling.layers[1] || "#6b7280",
      stroke: styling.border,
      "stroke-width": "0.5",
      rx: borderRadius,
      ry: borderRadius,
      opacity: Math.max(0.7, 1 - (i * 0.1)), // Fade upper layers slightly
    });
    layers.push(layer);
  }

  // Add shadow effect
  const shadow = createElement("ellipse", {
    cx: x + cellSize / 2,
    cy: y + cellSize,
    rx: (cellSize - 4) / 2,
    ry: 2,
    fill: styling.shadow,
    opacity: 0.3,
  });

  // Build group explicitly to avoid fragile replace() pattern
  const groupContent = [shadow, ...layers].join("");
  const groupClass = `stack-${position.x}-${position.y}`;
  return `<g class="${groupClass}">${groupContent}</g>`;
};

/**
 * Creates animated stacks that grow over time.
 *
 * @param stacks - Array of stack data with animation timing.
 * @param config - Stack rendering configuration.
 * @returns SVG stack rendering result with animated growth.
 *
 * @example
 * ```typescript
 * const config: SvgStackConfig = {
 *   styling: {
 *     layers: { 1: "#3b82f6", 2: "#1d4ed8", 3: "#1e40af" },
 *     base: "#64748b",
 *     shadow: "#000000",
 *     border: "#374151"
 *   },
 *   cellSize: 16,
 *   maxHeight: 5,
 *   layerThickness: 4,
 *   borderRadius: 2,
 *   animationDuration: 2000
 * };
 *
 * const result = renderAnimatedSvgStacks(stackData, config);
 * ```
 */
export const renderAnimatedSvgStacks = (
  stacks: StackData[],
  config: SvgStackConfig
): SvgStackResult => {
  const elements: string[] = [];
  const animationStyles: string[] = [];

  if (stacks.length === 0) {
    return { elements, styles: "", duration: 0 };
  }

  for (const stack of stacks) {
    const stackElement = createStackLayers(stack, config);

    if (stack.animationTime !== null) {
      // Add growth animation
      const animationId = `stack-${stack.position.x}-${stack.position.y}`;
      const startTime = stack.animationTime * config.animationDuration;

      const keyframes: AnimationKeyframe[] = [
        { t: 0, style: "opacity: 0; transform: scale(0) translateY(10px);" },
        { t: startTime / config.animationDuration, style: "opacity: 0; transform: scale(0) translateY(10px);" },
        { t: (startTime + 300) / config.animationDuration, style: "opacity: 0.7; transform: scale(0.8) translateY(5px);" },
        { t: (startTime + 600) / config.animationDuration, style: "opacity: 1; transform: scale(1) translateY(0);" },
        { t: 1, style: "opacity: 1; transform: scale(1) translateY(0);" },
      ];

      const css = createKeyframeAnimation(`${animationId}-grow`, keyframes);
      animationStyles.push(`
        .${animationId} {
          animation: ${animationId}-grow ${config.animationDuration / 1000}s ease-out forwards;
          transform-origin: center bottom;
        }
        ${css}
      `);
    }

    elements.push(stackElement);
  }

  return {
    elements,
    styles: animationStyles.join("\n"),
    duration: config.animationDuration,
  };
};

/**
 * Creates static SVG representation of stacks without animations.
 *
 * @param stacks - Array of stack data.
 * @param config - Stack rendering configuration.
 * @returns Array of SVG elements representing the stacks.
 */
export const renderStaticSvgStacks = (
  stacks: StackData[],
  config: SvgStackConfig
): string[] => {
  return stacks.map(stack => createStackLayers(stack, config));
};

/**
 * Utility function to convert grid cell colors to stack data.
 *
 * @param gridWidth - Width of the grid.
 * @param gridHeight - Height of the grid.
 * @param getCellColor - Function to get cell color at position.
 * @param getStackHeight - Function to get stack height at position.
 * @returns Array of stack data for rendering.
 */
export const createStacksFromGrid = (
  gridWidth: number,
  gridHeight: number,
  getCellColor: (x: number, y: number) => Color | Empty,
  getStackHeight: (x: number, y: number) => number
): StackData[] => {
  const stacks: StackData[] = [];

  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      const height = getStackHeight(x, y);

      if (height > 0) {
        stacks.push({
          position: new Point(x, y),
          height,
          color: getCellColor(x, y),
          animationTime: null, // No animation by default
        });
      }
    }
  }

  return stacks;
};

/**
 * Cell data with animation timing information.
 */
export interface AnimatedCellData {
  /** Animation timing (0-1, null if not animated) */
  t: number | null;
  /** Cell color */
  color: Color | Empty;
}

/**
 * Result of progress stack rendering.
 */
export interface ProgressStackResult {
  /** SVG elements for the progress bar */
  svgElements: string[];
  /** CSS styles for animations */
  styles: string[];
}

/**
 * Creates a horizontal progress bar showing cell consumption over time.
 * This matches SNK's createStack functionality - a timeline showing when cells are eaten.
 *
 * The progress bar is divided into colored blocks, where each block represents cells
 * of the same color consumed sequentially. The blocks grow horizontally as the animation
 * progresses, providing a visual timeline of the snake's path.
 *
 * @param cells - Array of cells with their animation timing and colors.
 * @param dotSize - Size of the progress bar height.
 * @param width - Total width of the progress bar.
 * @param y - Y position of the progress bar.
 * @param duration - Animation duration in milliseconds.
 * @returns SVG elements and styles for the animated progress bar.
 *
 * @example
 * ```typescript
 * const progressBar = createProgressStack(
 *   animatedCells,
 *   12,
 *   gridWidth * cellSize,
 *   (gridHeight + 2) * cellSize,
 *   duration
 * );
 * ```
 */
export const createProgressStack = (
  cells: AnimatedCellData[],
  dotSize: number,
  width: number,
  y: number,
  duration: number,
): ProgressStackResult => {
  const svgElements: string[] = [];
  const styles: string[] = [
    `.u{
      transform-origin: 0 0;
      transform: scale(0,1);
      animation: none linear ${duration}ms infinite;
    }`,
  ];

  // Filter and sort cells by animation time
  const sortedCells = cells
    .filter((cell) => cell.t !== null)
    .sort((a, b) => a.t! - b.t!);

  if (sortedCells.length === 0) {
    return { svgElements, styles };
  }

  // Group consecutive cells of the same color into blocks
  interface ColorBlock {
    color: Color;
    times: number[];
  }

  const blocks: ColorBlock[] = [];

  for (const cell of sortedCells) {
    const latestBlock = blocks[blocks.length - 1];

    if (latestBlock && latestBlock.color === cell.color) {
      // Same color as previous block - add to existing block
      latestBlock.times.push(cell.t!);
    } else {
      // Different color - create new block
      blocks.push({
        color: cell.color as Color,
        times: [cell.t!],
      });
    }
  }

  // Calculate width per cell
  const cellWidth = width / sortedCells.length;

  let blockIndex = 0;
  let currentX = 0;

  for (const block of blocks) {
    // Generate unique ID for this block
    const blockId = "u" + blockIndex.toString(36);
    const animationName = blockId;
    const x = currentX.toFixed(1);
    const blockWidth = (block.times.length * cellWidth + 0.6).toFixed(1);

    // Create SVG rect element for this block
    svgElements.push(
      createElement("rect", {
        class: `u ${blockId}`,
        height: dotSize.toString(),
        width: blockWidth,
        x,
        y: y.toString(),
      }),
    );

    // Create scale animation keyframes
    const keyframes: AnimationKeyframe[] = block.times.flatMap((t, i, arr) => {
      const t1 = Math.max(0, t - 0.0001);
      const t2 = Math.min(1, t + 0.0001);
      return [
        { t: t1, style: `transform:scale(${(i / arr.length).toFixed(3)},1)` },
        { t: t2, style: `transform:scale(${((i + 1) / arr.length).toFixed(3)},1)` },
      ];
    });

    // Add final keyframe
    keyframes.push({
      t: 1,
      style: `transform:scale(1.000,1)`,
    });

    // Generate CSS animation and styles
    styles.push(
      createKeyframeAnimation(animationName, keyframes),
      `.u.${blockId} {
        fill: var(--c${block.color});
        animation-name: ${animationName};
        transform-origin: ${x}px 0;
      }`,
    );

    currentX += block.times.length * cellWidth;
    blockIndex++;
  }

  return { svgElements, styles };
};