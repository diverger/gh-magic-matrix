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
      width: Math.max(1, cellSize - 4 - layerOffset),
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
          transform-box: fill-box;
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
  /** X coordinate (for contribution counting) */
  x?: number;
  /** Y coordinate (for contribution counting) */
  y?: number;
}

/**
 * Result of progress stack rendering.
 */
export interface ProgressStackResult {
  /** SVG elements for the progress bar */
  svgElements: string[];
  /** CSS styles for animations (concatenated) */
  styles: string;
}

/**
 * Text position mode for contribution counter.
 */
export type CounterPosition = 'top-left' | 'top-right' | 'follow';

/**
 * Image configuration for counter display.
 */
export interface CounterImageConfig {
  /** Image URL (data URI or external URL) */
  url: string;
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
  /** Vertical offset from baseline (positive = up, negative = down) */
  offsetY?: number;
  /**
   * Anchor point on the image that will be aligned to the text baseline
   * Defines which point of the image should be placed at the reference position
   *
   * - 'top-left': Image's top-left corner aligns to baseline
   * - 'top-center': Image's top-center point aligns to baseline
   * - 'top-right': Image's top-right corner aligns to baseline
   * - 'center-left': Image's center-left point aligns to baseline
   * - 'center': Image's center point aligns to baseline (useful when icon is centered in a larger frame)
   * - 'center-right': Image's center-right point aligns to baseline
   * - 'bottom-left': Image's bottom-left corner aligns to baseline
   * - 'bottom-center': Image's bottom-center point aligns to baseline (default, good for text alignment)
   * - 'bottom-right': Image's bottom-right corner aligns to baseline
   *
   * Default: 'bottom-center'
   *
   * Example: If you have a 32x32 frame with a 24x24 icon centered inside,
   * use anchor: 'center' to align the icon's visual center to the baseline,
   * not the frame's edge.
   */
  anchor?: 'top-left' | 'top-center' | 'top-right'
         | 'center-left' | 'center' | 'center-right'
         | 'bottom-left' | 'bottom-center' | 'bottom-right';
  /**
   * Custom anchor X position (0-1 normalized, 0 = left edge, 0.5 = center, 1 = right edge)
   * Overrides the X component of 'anchor' if set
   *
   * This value specifies which point on the image (horizontally) will be aligned to the reference position.
   * Example: 0.5 = image's horizontal center point aligns to baseline
   */
  anchorX?: number;
  /**
   * Custom anchor Y position (0-1 normalized, 0 = top edge, 0.5 = center, 1 = bottom edge)
   * Overrides the Y component of 'anchor' if set
   *
   * This value specifies which point on the image (vertically) will be aligned to the reference position.
   * Example: 0.85 = a point at 85% down from the top (useful for character feet) aligns to baseline
   */
  anchorY?: number;
  /** Sprite sheet configuration (for animated sprites) */
  sprite?: {
    /** Number of frames in the sprite sheet */
    frames: number;
    /** Frame width (if different from image width / frames) */
    frameWidth?: number;
    /** Frame height (if different from image height) */
    frameHeight?: number;
    /** Layout: 'horizontal' (default) or 'vertical' */
    layout?: 'horizontal' | 'vertical';
    /**
     * Animation mode:
     * - 'sync': Synced with progress bar (frame changes with progress steps)
     * - 'loop': Independent looping animation (CSS-based)
     */
    mode?: 'sync' | 'loop';
    /**
     * Animation duration in milliseconds (for loop mode only)
     * Default: same as progress bar duration
     */
    duration?: number;
    /**
     * Frames per second (for loop mode only, alternative to duration)
     * If both fps and duration are set, fps takes precedence
     */
    fps?: number;
  };
}

/**
 * Configuration for a single counter display.
 */
export interface CounterDisplayConfig {
  /** Text position mode */
  position: CounterPosition;
  /** Fixed text to display (if set, only this text is shown, no count/percentage) */
  text?: string;
  /** Text prefix (used when showing count, can include emoji) */
  prefix?: string;
  /** Text suffix (used when showing count, can include emoji) */
  suffix?: string;
  /** Show count number (default: true if text is not set) */
  showCount?: boolean;
  /** Show percentage (default: true if text is not set) */
  showPercentage?: boolean;
  /** Font size in pixels */
  fontSize?: number;
  /** Font family */
  fontFamily?: string;
  /** Text color */
  color?: string;
  /** Font weight: 'normal', 'bold', or numeric (100-900) */
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | number;
  /** Font style: 'normal' or 'italic' */
  fontStyle?: 'normal' | 'italic';
  /**
   * Array of images that can be referenced in text using {img:0}, {img:1}, etc.
   * Images will be inserted at the placeholder position in the text.
   * If no text is provided, the first image will be displayed alone.
   */
  images?: CounterImageConfig[];
}

/**
 * Configuration for contribution counter display.
 */
export interface ContributionCounterConfig {
  /** Enable counter display */
  enabled: boolean;
  /** Array of counter displays (can show multiple counters at different positions) */
  displays?: CounterDisplayConfig[];
  /** Map from "x,y" coordinates to contribution count */
  contributionMap?: Map<string, number>;
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
 * @param counterConfig - Optional configuration for contribution counter display.
 * @returns SVG elements and styles for the animated progress bar.
 *
 * @example
 * ```typescript
 * const progressBar = createProgressStack(
 *   animatedCells,
 *   12,
 *   gridWidth * cellSize,
 *   (gridHeight + 2) * cellSize,
 *   duration,
 *   { enabled: true, prefix: '🎯 ', suffix: ' contributions' }
 * );
 * ```
 */
export const createProgressStack = (
  cells: AnimatedCellData[],
  dotSize: number,
  width: number,
  y: number,
  duration: number,
  counterConfig?: ContributionCounterConfig,
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
    return { svgElements, styles: styles.join('\n') };
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

  // Add contribution counter if enabled
  if (counterConfig?.enabled && counterConfig.displays) {
    // Calculate total contributions from map or fall back to cell count
    const totalContributions = counterConfig.contributionMap
      ? Array.from(counterConfig.contributionMap.values()).reduce((sum, count) => sum + count, 0)
      : sortedCells.length;

    // Calculate width per cell
    const cellWidth = width / sortedCells.length;

    // Process each display
    counterConfig.displays.forEach((display, displayIndex) => {
      const fontSize = display.fontSize || dotSize;
      const fontFamily = display.fontFamily || 'Arial, sans-serif';
      const textColor = display.color || '#666';
      const fontWeight = display.fontWeight || 'normal';
      const fontStyle = display.fontStyle || 'normal';
      const position = display.position;
      // follow mode: same line as progress bar; others: above progress bar
      const textY = position === 'follow' ? (y + dotSize / 2) : (y - fontSize * 0.5);
      const textOffsetX = fontSize * 0.5; // Small offset

      // Build common text attributes
      const textAttrs: Record<string, string> = {
        "font-size": fontSize.toString(),
        "font-family": fontFamily,
        fill: textColor,
        "text-anchor": position === 'top-right' ? 'end' : 'start',
        "dominant-baseline": "middle",
      };

      // Add font-weight if not normal
      if (fontWeight !== 'normal') {
        textAttrs["font-weight"] = fontWeight.toString();
      }

      // Add font-style if not normal
      if (fontStyle !== 'normal') {
        textAttrs["font-style"] = fontStyle;
      }

      // Check if this is a fixed text display
      if (display.text) {
        // Fixed text mode - show only the static text
        svgElements.push(
          createElement("text", {
            class: `contrib-counter contrib-fixed-${displayIndex}`,
            x: position === 'top-right' ? width.toFixed(1) : '0',
            y: textY.toString(),
            ...textAttrs,
          }).replace("/>", `>${display.text}</text>`)
        );
      } else {
        // Dynamic counter mode - show animated count/percentage
        const prefix = display.prefix || '';
        const suffix = display.suffix || '';
        const showCount = display.showCount !== false; // Default true
        const showPercentage = display.showPercentage !== false; // Default true

        // Build counter states
        let cumulativeCount = 0;
        let cumulativeWidth = 0;
        const textElements: Array<{ count: number; percentage: string; time: number; x: number }> = [];

        // Initial state
        textElements.push({
          count: 0,
          percentage: '0.0',
          time: 0,
          x: position === 'top-left' ? 0 : (position === 'top-right' ? width : 0)
        });

        sortedCells.forEach((cell, index) => {
          // Get contribution count for this cell using its coordinates
          let count = 1; // Default to 1 if no map or coordinates
          if (counterConfig.contributionMap && cell.x !== undefined && cell.y !== undefined) {
            const key = `${cell.x},${cell.y}`;
            count = counterConfig.contributionMap.get(key) || 1;
          }

          cumulativeCount += count;
          cumulativeWidth += cellWidth;
          const percentage = ((cumulativeCount / totalContributions) * 100).toFixed(1);

          let x: number;
          if (position === 'top-left') {
            x = 0;
          } else if (position === 'top-right') {
            // Clamp x to width to prevent text overflow when using text-anchor="end"
            x = Math.min(cumulativeWidth, width);
          } else {
            // follow mode
            x = cumulativeWidth + textOffsetX;
          }

          textElements.push({
            count: cumulativeCount,
            percentage,
            time: cell.t!,
            x,
          });
        });

        // Create text elements with position and opacity animations
        textElements.forEach((elem, index) => {
          const textId = `contrib-text-${displayIndex}-${index}`;

          // Build display text based on showCount and showPercentage flags
          let displayText = prefix;
          if (showCount && showPercentage) {
            displayText += `${elem.count} (${elem.percentage}%)`;
          } else if (showCount) {
            displayText += `${elem.count}`;
          } else if (showPercentage) {
            displayText += `${elem.percentage}%`;
          }
          displayText += suffix;

          svgElements.push(
            createElement("text", {
              class: `contrib-counter ${textId}`,
              x: elem.x.toFixed(1),
              y: textY.toString(),
              ...textAttrs,
            }).replace("/>", `>${displayText}</text>`)
          );

      // Create opacity animation keyframes
      const keyframes: AnimationKeyframe[] = [];

      // Before this element's time: opacity 0
      if (index === 0) {
        // First element: visible from start
        keyframes.push({ t: 0, style: 'opacity:1' });
      } else {
        // Start invisible
        keyframes.push({ t: 0, style: 'opacity:0' });
        // Stay invisible until just before this element's time
        if (elem.time > 0) {
          keyframes.push({ t: Math.max(0, elem.time - 0.0001), style: 'opacity:0' });
        }
      }

      // At this element's time: opacity 1
      if (elem.time > 0 || index > 0) {
        keyframes.push({ t: Math.max(0, elem.time), style: 'opacity:1' });
      }

      // At next element's time: opacity 0 (or stay at 1 if last)
      if (index < textElements.length - 1) {
        const nextTime = textElements[index + 1].time;
        if (nextTime > elem.time) {
          keyframes.push({ t: Math.max(0, Math.min(1, nextTime - 0.0001)), style: 'opacity:1' });
        }
        keyframes.push({ t: Math.max(0, Math.min(1, nextTime)), style: 'opacity:0' });
        keyframes.push({ t: 1, style: 'opacity:0' });
      } else {
        keyframes.push({ t: 1, style: 'opacity:1' });
      }

          const animName = `contrib-anim-${displayIndex}-${index}`;
          styles.push(
            createKeyframeAnimation(animName, keyframes),
            `.${textId} {
              animation: ${animName} linear ${duration}ms infinite;
              opacity: 0;
            }`
          );
        }); // End textElements.forEach
      } // End if (display.text) else
    }); // End displays.forEach
  } // End if (counterConfig?.enabled)

  return { svgElements, styles: styles.join('\n') };
};