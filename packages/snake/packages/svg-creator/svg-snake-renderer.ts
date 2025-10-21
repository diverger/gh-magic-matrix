import type { Snake } from "../types/snake";

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
  /** Total animation duration */
  duration: number;
}

interface AnimationKeyframe {
  t: number; // Time from 0 to 1
  style: string;
}

/**
 * Creates a CSS keyframe animation from an array of keyframes
 */
const createKeyframeAnimation = (name: string, keyframes: AnimationKeyframe[]): string => {
  const keyframeRules = keyframes
    .map(({ t, style }) => `${(t * 100).toFixed(2)}% { ${style} }`)
    .join('\n    ');
  
  return `@keyframes ${name} {\n    ${keyframeRules}\n  }`;
};

/**
 * Creates an SVG element with attributes
 */
const createElement = (tag: string, attributes: Record<string, string>): string => {
  const attrs = Object.entries(attributes)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
  return `<${tag} ${attrs}/>`;
};

/**
 * Renders an animated SVG snake that follows a path through the grid.
 * Creates rectangle elements positioned with CSS transforms, similar to SNK.
 *
 * @param snakeChain - Array of snake positions over time
 * @param config - Configuration for rendering (colors, timing, etc.)
 * @returns SVG elements and CSS styles for the animated snake
 *
 * @example
 * ```typescript
 * const snakeChain = [snake1, snake2, snake3]; // Snake positions over time
 * const config = {
 *   cellSize: 10,
 *   animationDuration: 3000,
 *   styling: { head: '#4CAF50', body: '#8BC34A' }
 * };
 *
 * const result = renderAnimatedSvgSnake(snakeMovement, config);
 * document.body.appendChild(result.elements[0]);
 * ```
 */
export const renderAnimatedSvgSnake = (
  snakeChain: Snake[],
  config: SvgSnakeConfig
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

  // Create SVG elements for each snake segment
  snakeParts.forEach((positions, i) => {
    if (positions.length === 0) return;

    // Compute segment size - head is largest, tail segments get smaller
    const dMin = config.cellSize * 0.3; // Minimum size for tail
    const dMax = config.cellSize * 0.9; // Maximum size for head
    const iMax = Math.min(4, snakeLength);
    const u = (1 - Math.min(i, iMax) / iMax) ** 2;
    const size = dMin + (dMax - dMin) * u;
    
    const margin = (config.cellSize - size) / 2;
    const radius = Math.min(4.5, (4 * size) / config.cellSize);

    // Create rectangle element
    const rectElement = createElement("rect", {
      class: `snake-segment snake-segment-${i}`,
      x: margin.toFixed(1),
      y: margin.toFixed(1),
      width: size.toFixed(1),
      height: size.toFixed(1),
      rx: radius.toFixed(1),
      ry: radius.toFixed(1),
      fill: i === 0 ? config.styling.head : config.styling.body,
    });

    elements.push(rectElement);

    // Create animation if there are multiple positions
    if (positions.length > 1) {
      const animationName = `snake-segment-${i}`;
      
      // Create keyframes for movement
      const keyframes = positions.map((pos, frameIndex) => ({
        t: frameIndex / (positions.length - 1),
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
  config: SvgSnakeConfig
): SvgSnakeResult => {
  return renderAnimatedSvgSnake([snake], config);
};