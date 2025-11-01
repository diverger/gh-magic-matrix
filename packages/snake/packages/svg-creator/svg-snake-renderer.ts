import type { Snake } from "../types/snake";
import { createKeyframeAnimation, type AnimationKeyframe } from "./css-utils";
import { createElement } from "./svg-utils";

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
 * const result = renderAnimatedSvgSnake(snakeMovement, config, 12);
 * document.body.appendChild(result.elements[0]);
 * ```
 */
export const renderAnimatedSvgSnake = (
  snakeChain: Snake[],
  config: SvgSnakeConfig,
  dotSize: number
): SvgSnakeResult => {
  const elements: string[] = [];
  const animationStyles: string[] = [];

  if (snakeChain.length === 0) {
    return { elements, styles: "", duration: 0 };
  }

  // Get the length of the snake from the first frame
  const snakeLength = snakeChain[0] ? snakeChain[0].toCells().length : 0;

  // Create arrays to store positions for each snake segment across all frames
  const snakeParts: Array<Array<{ x: number, y: number }>> = Array.from({ length: snakeLength }, () => []);

  // Collect positions for each segment across all frames
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

    // Create rectangle element
    const rectElement = createElement("rect", {
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

    elements.push(rectElement);

    // Create animation if there are multiple positions
    if (positions.length > 1) {
      const animationName = `snake-segment-${i}`;

      // Create positions with time stamps - match SNK's timing exactly
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
          animation: ${animationName} ${config.animationDuration}ms linear infinite;
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
export const renderStaticSvgSnake = (
  snake: Snake,
  config: SvgSnakeConfig,
  dotSize: number
): SvgSnakeResult => {
  return renderAnimatedSvgSnake([snake], config, dotSize);
};