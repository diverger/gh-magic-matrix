/**
 * SVG Snake Renderer
 *
 * Provides functionality for rendering animated snake SVG elements with smooth path animations.
 * Generates SVG paths that follow the snake's movement with configurable styling and timing.
 *
 * @module svg-snake-renderer
 */

import type { Snake } from "../types/snake";
import type { Point } from "../types/point";
import { createKeyframeAnimation, type AnimationKeyframe } from "./css-utils";
import { createElement } from "./svg-utils";

/**
 * Snake visual styling configuration.
 */
export interface SnakeColorConfig {
  /** Snake body color */
  body: string;
  /** Snake head color */
  head: string;
  /** Optional body border color */
  bodyBorder?: string;
  /** Optional head border color */
  headBorder?: string;
}

/**
 * Configuration options for SVG snake rendering.
 */
export interface SvgSnakeConfig {
  /** Snake visual styling options */
  styling: SnakeColorConfig;
  /** Size of each grid cell in pixels */
  cellSize: number;
  /** Snake body thickness as percentage of cell size (0-1) */
  thickness: number;
  /** Corner radius for snake segments */
  borderRadius: number;
  /** Animation duration in seconds */
  animationDuration: number;
}

/**
 * Result of SVG snake rendering containing path elements and animations.
 */
export interface SvgSnakeResult {
  /** SVG path element strings representing the snake */
  elements: string[];
  /** CSS animation styles */
  styles: string;
  /** Total animation duration in seconds */
  duration: number;
}

/**
 * Creates an SVG path string for a snake segment between two points.
 *
 * @param from - Starting point of the segment.
 * @param to - Ending point of the segment.
 * @param config - Snake rendering configuration.
 * @returns SVG path string for the segment.
 */
export const createSnakeSegmentPath = (
  from: Point,
  to: Point,
  config: SvgSnakeConfig
): string => {
  const { cellSize, thickness, borderRadius } = config;
  const segmentWidth = cellSize * thickness;
  const halfWidth = segmentWidth / 2;

  // Calculate segment center points
  const fromCenter = {
    x: from.x * cellSize + cellSize / 2,
    y: from.y * cellSize + cellSize / 2,
  };
  const toCenter = {
    x: to.x * cellSize + cellSize / 2,
    y: to.y * cellSize + cellSize / 2,
  };

  // Determine direction and create appropriate path
  if (from.x === to.x) {
    // Vertical movement
    const minY = Math.min(fromCenter.y, toCenter.y) - halfWidth;
    const maxY = Math.max(fromCenter.y, toCenter.y) + halfWidth;
    const x = fromCenter.x;

    return `M ${x - halfWidth} ${minY + borderRadius}
            A ${borderRadius} ${borderRadius} 0 0 1 ${x - halfWidth + borderRadius} ${minY}
            L ${x + halfWidth - borderRadius} ${minY}
            A ${borderRadius} ${borderRadius} 0 0 1 ${x + halfWidth} ${minY + borderRadius}
            L ${x + halfWidth} ${maxY - borderRadius}
            A ${borderRadius} ${borderRadius} 0 0 1 ${x + halfWidth - borderRadius} ${maxY}
            L ${x - halfWidth + borderRadius} ${maxY}
            A ${borderRadius} ${borderRadius} 0 0 1 ${x - halfWidth} ${maxY - borderRadius}
            Z`;
  } else {
    // Horizontal movement
    const minX = Math.min(fromCenter.x, toCenter.x) - halfWidth;
    const maxX = Math.max(fromCenter.x, toCenter.x) + halfWidth;
    const y = fromCenter.y;

    return `M ${minX + borderRadius} ${y - halfWidth}
            A ${borderRadius} ${borderRadius} 0 0 1 ${minX} ${y - halfWidth + borderRadius}
            L ${minX} ${y + halfWidth - borderRadius}
            A ${borderRadius} ${borderRadius} 0 0 1 ${minX + borderRadius} ${y + halfWidth}
            L ${maxX - borderRadius} ${y + halfWidth}
            A ${borderRadius} ${borderRadius} 0 0 1 ${maxX} ${y + halfWidth - borderRadius}
            L ${maxX} ${y - halfWidth + borderRadius}
            A ${borderRadius} ${borderRadius} 0 0 1 ${maxX - borderRadius} ${y - halfWidth}
            Z`;
  }
};

/**
 * Creates an SVG circle element for the snake head.
 *
 * @param position - Head position.
 * @param config - Snake rendering configuration.
 * @returns SVG circle element string.
 */
export const createSnakeHead = (
  position: Point,
  config: SvgSnakeConfig
): string => {
  const { cellSize, thickness, styling } = config;
  const radius = (cellSize * thickness) / 2;
  const centerX = position.x * cellSize + cellSize / 2;
  const centerY = position.y * cellSize + cellSize / 2;

  return createElement("circle", {
    cx: centerX,
    cy: centerY,
    r: radius,
    fill: styling.head,
    stroke: styling.headBorder || "none",
    "stroke-width": styling.headBorder ? "1" : "0",
  });
};

/**
 * Generates animated snake path elements for a sequence of snake states.
 *
 * @param snakeChain - Array of snake states representing movement sequence.
 * @param config - Snake rendering configuration.
 * @returns SVG snake rendering result with animated elements.
 *
 * @example
 * ```typescript
 * const config: SvgSnakeConfig = {
 *   styling: { body: "#4ade80", head: "#22c55e" },
 *   cellSize: 16,
 *   thickness: 0.8,
 *   borderRadius: 2,
 *   animationDuration: 3.0
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

  const finalSnake = snakeChain[snakeChain.length - 1];
  const bodyChain = finalSnake.toCells();

  // Create body segments
  for (let i = 0; i < bodyChain.length - 1; i++) {
    const from = bodyChain[i];
    const to = bodyChain[i + 1];

    const pathData = createSnakeSegmentPath(from, to, config);
    const pathElement = createElement("path", {
      d: pathData,
      fill: config.styling.body,
      stroke: config.styling.bodyBorder || "none",
      "stroke-width": config.styling.bodyBorder ? "1" : "0",
      class: `snake-segment-${i}`,
    });

    // Add appear animation
    const animationId = `snake-segment-${i}`;
    const appearTime = (i / bodyChain.length) * config.animationDuration;

    const keyframes: AnimationKeyframe[] = [
      { t: 0, style: "opacity: 0; transform: scale(0.5);" },
      { t: appearTime / config.animationDuration, style: "opacity: 0; transform: scale(0.5);" },
      { t: (appearTime + 0.2) / config.animationDuration, style: "opacity: 1; transform: scale(1);" },
      { t: 1, style: "opacity: 1; transform: scale(1);" },
    ];

    const css = createKeyframeAnimation(`${animationId}-appear`, keyframes);
    animationStyles.push(`
      .${animationId} {
        animation: ${animationId}-appear ${config.animationDuration}s ease-out forwards;
      }
      ${css}
    `);

    elements.push(pathElement);
  }

  // Create animated head
  const head = finalSnake.getHead();
  const headElement = createSnakeHead(head, config);

  if (snakeChain.length > 1) {
    const headAnimationId = "snake-head";

    // Create head movement animation
    const headPositions = snakeChain.map(snake => snake.getHead());
    const headKeyframes: AnimationKeyframe[] = headPositions.map((pos, index) => ({
      t: index / (headPositions.length - 1),
      style: `transform: translate(${(pos.x - head.x) * config.cellSize}px, ${(pos.y - head.y) * config.cellSize}px);`,
    }));

    const headCss = createKeyframeAnimation(`${headAnimationId}-move`, headKeyframes);
    animationStyles.push(`
      .${headAnimationId} {
        animation: ${headAnimationId}-move ${config.animationDuration}s ease-in-out forwards;
        transform-origin: center;
      }
      ${headCss}
    `);
  }

  elements.push(headElement);

  return {
    elements,
    styles: animationStyles.join("\n"),
    duration: config.animationDuration,
  };
};

/**
 * Creates a static SVG representation of a snake without animations.
 *
 * @param snake - Snake instance to render.
 * @param config - Snake rendering configuration.
 * @returns Array of SVG elements representing the snake.
 */
export const renderStaticSvgSnake = (
  snake: Snake,
  config: SvgSnakeConfig
): string[] => {
  const elements: string[] = [];
  const bodyChain = snake.toCells();

  // Create body segments
  for (let i = 0; i < bodyChain.length - 1; i++) {
    const from = bodyChain[i];
    const to = bodyChain[i + 1];

    const pathData = createSnakeSegmentPath(from, to, config);
    const pathElement = createElement("path", {
      d: pathData,
      fill: config.styling.body,
      stroke: config.styling.bodyBorder || "none",
      "stroke-width": config.styling.bodyBorder ? "1" : "0",
    });

    elements.push(pathElement);
  }

  // Create head
  const head = snake.getHead();
  elements.push(createSnakeHead(head, config));

  return elements;
};