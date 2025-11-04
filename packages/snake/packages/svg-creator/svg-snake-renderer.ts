import type { Snake } from "../types/snake";
import { createKeyframeAnimation, type AnimationKeyframe } from "./css-utils";
import { createElement, createTextElement } from "./svg-utils";
import { processImageContent } from "./image-utils";

/** Logger interface for debug output */
export interface Logger {
  debug(...args: any[]): void;
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
}

/** No-op logger that silently discards all output */
const noopLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

export interface SvgSnakeConfig {
  /** Size of each grid cell in pixels */
  cellSize: number;
  /** Animation duration in milliseconds */
  animationDuration: number;
  /** Visual styling options */
  styling: {
    /** Color for snake head */
    head: string;
    /** Color for snake body */
    body: string;
    /** Optional border color */
    bodyBorder?: string;
  };
  /** Use custom content (emoji/image/text) instead of rectangles */
  useCustomContent?: boolean;
  /** Custom content configuration (only used when useCustomContent is true) */
  customContentConfig?: {
    /**
     * Array of content (emoji/image/text) for each segment (index 0 = head, 1 = second segment, etc.)
     * - Emoji: '🐍', '🟢', '🟡', '🔵'
     * - Images: 'https://example.com/image.png' or 'data:image/png;base64,...'
     * - Text: 'A', 'B', 'C', '1', '2', '3'
     * If array is shorter than snake length, remaining segments use the last content
     * Can also be a function: (index, length) => content string
     */
    segments?: string[] | ((segmentIndex: number, totalLength: number) => string);
    /** Default content for segments not specified (default: 🟢) */
    defaultContent?: string;
    /**
     * Animation timing function for smoother movement
     * Options: 'linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'
     * Default: 'linear' for smooth movement (non-linear causes jerky motion with optimized keyframes)
     */
    animationTiming?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  };
  /** Optional logger for debug output (defaults to silent no-op logger) */
  logger?: Logger;
}

export interface SvgSnakeResult {
  /** Array of SVG element strings */
  elements: string[];
  /** CSS styles for animations */
  styles: string;
  /** Total animation duration in milliseconds */
  duration: number;
}

/**
 * Renders an animated SVG snake that follows a path through the grid.
 * Creates rectangle elements positioned with CSS transforms, similar to SNK.
 *
 * @param snakeChain - Array of snake positions over time
 * @param config - Configuration for rendering (colors, timing, etc.)
 * @param dotSize - Size of the contribution dots (affects snake segment sizing)
 * @returns SVG elements and CSS styles for the animated snake
 *
 * @example
 * ```typescript
 * const snakeChain = [snake1, snake2, snake3]; // Snake positions over time
 * const config = {
 *   cellSize: 16,
 *   animationDuration: 3000,
 *   styling: { head: '#4CAF50', body: '#8BC34A' }
 * };
 *
 * const result = await renderAnimatedSvgSnake(snakeMovement, config, 12);
 * document.body.appendChild(result.elements[0]);
 * ```
 */
export const renderAnimatedSvgSnake = async (
  snakeChain: Snake[],
  config: SvgSnakeConfig,
  dotSize: number
): Promise<SvgSnakeResult> => {
  const elements: string[] = [];
  const animationStyles: string[] = [];

  // Use provided logger or default to no-op logger
  const logger = config.logger || noopLogger;

  if (snakeChain.length === 0) {
    return { elements, styles: "", duration: 0 };
  }

  // Get the length of the snake from the first frame
  const snakeLength = snakeChain[0] ? snakeChain[0].toCells().length : 0;

  // Create arrays to store positions for each snake segment across all frames
  const snakeParts: Array<Array<{ x: number, y: number }>> = Array.from({ length: snakeLength }, () => []);

  // Collect positions for each segment across all frames
  // Each segment follows its natural position in the snake for each frame
  for (const snake of snakeChain) {
    const cells = snake.toCells();
    for (let i = 0; i < cells.length && i < snakeLength; i++) {
      snakeParts[i].push(cells[i]);
    }
  }

  // Helper function to create transform style
  const transform = (point: { x: number, y: number }) =>
    `transform:translate(${point.x * config.cellSize}px,${point.y * config.cellSize}px)`;

  /**
   * Removes keyframes that can be interpolated by the browser.
   * If a position is exactly at the midpoint between its neighbors,
   * the browser can interpolate it automatically, so we can skip that keyframe.
   * This reduces CSS size and improves performance.
   *
   * SNK optimization: Only removes positions on straight lines, preserving all turns.
   */
  const removeInterpolatedPositions = <T extends { x: number; y: number }>(arr: T[]): T[] => {
    return arr.filter((u, i, arr) => {
      // Always keep first and last positions
      if (i - 1 < 0 || i + 1 >= arr.length) return true;

      const a = arr[i - 1];  // Previous position
      const b = arr[i + 1];  // Next position

      // Calculate expected position if linearly interpolated
      const ex = (a.x + b.x) / 2;
      const ey = (a.y + b.y) / 2;

      // If current position is at the midpoint, browser can interpolate it
      // Remove this keyframe to reduce CSS size
      return !(Math.abs(ex - u.x) < 0.01 && Math.abs(ey - u.y) < 0.01);
    });
  };

  // Helper function to get content for a segment (emoji/letter/image)
  const getContentForSegment = (segmentIndex: number): string => {
    // Normalize configuration upfront
    const customContentConfig = config.customContentConfig;
    const segments = customContentConfig?.segments;
    const defaultContent = customContentConfig?.defaultContent ?? '🟢';

    // Case 1: No custom config or no segments - use default snake head/body
    if (!customContentConfig || !segments) {
      return segmentIndex === 0 ? '🐍' : defaultContent;
    }

    // Case 2: Segments is a function - call it with current position
    if (typeof segments === 'function') {
      return segments(segmentIndex, snakeLength);
    }

    // Case 3: Segments is an array - return element at index or last/default
    if (segmentIndex < segments.length) {
      return segments[segmentIndex];
    }
    return segments[segments.length - 1] || defaultContent;
  };

  // Pre-process all image URLs to Base64 for GitHub compatibility
  const imageContentsToProcess: string[] = [];
  if (config.useCustomContent) {
    for (let i = 0; i < snakeLength; i++) {
      const content = getContentForSegment(i);
      if (content.startsWith('http://') || content.startsWith('https://')) {
        imageContentsToProcess.push(content);
      }
    }
  }

  // Convert all external URLs to Base64 in parallel
  const convertedImages = new Map<string, string>();
  if (imageContentsToProcess.length > 0) {
    logger.debug(`🔄 Converting ${imageContentsToProcess.length} external image URLs to Base64...`);
    const results = await Promise.allSettled(
      imageContentsToProcess.map(url => processImageContent(url))
    );

    let successCount = 0;
    let failureCount = 0;

    results.forEach((result, index) => {
      const url = imageContentsToProcess[index];
      if (result.status === 'fulfilled') {
        convertedImages.set(url, result.value);
        successCount++;
      } else {
        // Log error and use original URL as fallback
        logger.warn(`⚠️ Failed to convert image ${url}: ${result.reason}`);
        convertedImages.set(url, url); // Fallback to original URL
        failureCount++;
      }
    });

    logger.debug(`✅ Image conversion complete: ${successCount} succeeded, ${failureCount} failed`);
  }

  // Helper to get processed content (with URL -> Base64 conversion)
  const getProcessedContent = (segmentIndex: number): string => {
    const original = getContentForSegment(segmentIndex);
    return convertedImages.get(original) || original;
  };

  // Create SVG elements for each snake segment
  snakeParts.forEach((positions, i) => {
    if (positions.length === 0) return;

    // Use SNK SVG creator's exact formula (from snk/packages/svg-creator/snake.ts)
    const dMin = dotSize * 0.8;              // SNK's minimum size formula
    const dMax = config.cellSize * 0.9;     // SNK's maximum size formula
    const iMax = Math.min(4, snakeLength);  // SNK's transition segment count
    const u = (1 - Math.min(i, iMax) / iMax) ** 2; // SNK's quadratic falloff
    const s = dMin + (dMax - dMin) * u;     // SNK's linear interpolation (lerp)

    const margin = (config.cellSize - s) / 2;
    const radius = Math.min(4.5, (4 * s) / dotSize); // SNK's radius formula

    let segmentElement: string;

    if (config.useCustomContent) {
      const content = getProcessedContent(i); // Use processed content (URLs converted to Base64)

      // Check if content is an image (data URI or remaining external URL)
      const isImage = content.startsWith('http://') ||
                     content.startsWith('https://') ||
                     content.startsWith('data:');

      if (isImage) {
        // Create image element for images
        // Use full segment size to make segments appear more connected
        const imageSize = s;
        const imageOffset = (config.cellSize - imageSize) / 2;

        segmentElement = createElement("image", {
          class: `snake-segment snake-segment-${i}`,
          x: imageOffset.toFixed(1),
          y: imageOffset.toFixed(1),
          width: imageSize.toFixed(1),
          height: imageSize.toFixed(1),
          href: content,
          // Add transform-origin to match rectangle behavior
          style: "transform-box: fill-box; transform-origin: center center;",
        });
      } else {
        // Create text element for emoji/characters
        // Use full segment size to make segments appear more connected
        const fontSize = s;

        segmentElement = createTextElement({
          class: `snake-segment snake-segment-${i}`,
          x: (config.cellSize / 2).toFixed(1),
          y: (config.cellSize / 2).toFixed(1),
          "font-size": fontSize.toFixed(1),
          "text-anchor": "middle",
          "dominant-baseline": "central",
          "user-select": "none",
          // Add transform-origin to match rectangle behavior
          style: "transform-box: fill-box; transform-origin: center center;",
        }, content);
      }
    } else {
      // Create rectangle element
      segmentElement = createElement("rect", {
        class: `snake-segment snake-segment-${i}`,
        x: margin.toFixed(1),
        y: margin.toFixed(1),
        width: s.toFixed(1),
        height: s.toFixed(1),
        rx: radius.toFixed(1),
        ry: radius.toFixed(1),
        fill: i === 0 ? config.styling.head : config.styling.body,
        stroke: i === 0 ? "none" : (config.styling.bodyBorder ?? "none"),
        "stroke-width": i === 0 || !config.styling.bodyBorder ? "0" : "0.5",
      });
    }

    elements.push(segmentElement);

    // Create animation if there are multiple positions
    if (positions.length > 1) {
      const animationName = `snake-segment-${i}`;

      // Get animation timing function
      // IMPORTANT: Defaults to 'linear' to avoid "spring effect" between keyframes
      // With optimized keyframes (only turns preserved), non-linear timing causes
      // acceleration/deceleration between waypoints, creating jerky movement
      // Custom content can override with animationTiming if desired
      const timingFunction = config.useCustomContent && config.customContentConfig?.animationTiming
        ? config.customContentConfig.animationTiming
        : 'linear'; // Default to linear for smooth movement unless overridden

      // Create keyframes for movement - match SNK's timing exactly
      // SNK uses i / length (not i / (length - 1)), so keyframes end before 100%
      const positionsWithTime = positions.map((pos, frameIndex) => ({
        x: pos.x,
        y: pos.y,
        t: frameIndex / positions.length  // Match SNK: last frame at (length-1)/length
      }));

      // Apply interpolation optimization to remove redundant keyframes
      // This reduces CSS size by ~60% while preserving exact animation timing
      const optimizedPositions = removeInterpolatedPositions(positionsWithTime);

      // Create keyframes from optimized positions
      const keyframes = optimizedPositions.map(pos => ({
        t: pos.t,
        style: transform(pos)
      }));

      const css = createKeyframeAnimation(animationName, keyframes);

      animationStyles.push(`
        .snake-segment-${i} {
          ${transform(positions[0])};
          animation: ${animationName} ${config.animationDuration}ms ${timingFunction} infinite;
        }
        ${css}
      `);
    } else {
      // Static position for single frame
      animationStyles.push(`
        .snake-segment-${i} {
          ${transform(positions[0])};
        }
      `);
    }
  });

  // Add base styles for all snake segments
  animationStyles.unshift(`
    .snake-segment {
      shape-rendering: geometricPrecision;
      transform-box: fill-box;
    }
  `);

  return {
    elements,
    styles: animationStyles.join('\n'),
    duration: config.animationDuration
  };
};

/**
 * Creates a static SVG representation of a snake without animations.
 */
export const renderStaticSvgSnake = async (
  snake: Snake,
  config: SvgSnakeConfig,
  dotSize: number
): Promise<SvgSnakeResult> => {
  return renderAnimatedSvgSnake([snake], config, dotSize);
};