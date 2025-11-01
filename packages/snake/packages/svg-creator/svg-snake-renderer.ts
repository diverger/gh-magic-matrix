import type { Snake } from "../types/snake";
import { createKeyframeAnimation, type AnimationKeyframe } from "./css-utils";
import { createElement, createTextElement } from "./svg-utils";
import { processImageContent } from "./image-utils";

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
  /** Use emoji characters instead of rectangles */
  useEmoji?: boolean;
  /** Emoji configuration (only used when useEmoji is true) */
  emojiConfig?: {
    /**
     * Array of emojis for each segment (index 0 = head, 1 = second segment, etc.)
     * If array is shorter than snake length, remaining segments use the last emoji
     * Example: ['🐍', '🟢', '🟡', '🔵'] or a function: (index, length) => emoji
     */
    segments?: string[] | ((segmentIndex: number, totalLength: number) => string);
    /** Default emoji for segments not specified (default: 🟢) */
    defaultEmoji?: string;
    /**
     * Animation timing function for smoother movement
     * Options: 'linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'
     * Default: 'ease-out' for smoother emoji movement
     */
    animationTiming?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
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

  // Helper function to get emoji for a segment
  const getEmojiForSegment = (segmentIndex: number): string => {
    if (!config.emojiConfig) {
      return segmentIndex === 0 ? '🐍' : '🟢';
    }

    const { segments, defaultEmoji = '🟢' } = config.emojiConfig;

    if (!segments) {
      return segmentIndex === 0 ? '🐍' : defaultEmoji;
    }

    if (typeof segments === 'function') {
      return segments(segmentIndex, snakeLength);
    }

    // Array of emojis: use emoji at index, or last emoji, or default
    if (segmentIndex < segments.length) {
      return segments[segmentIndex];
    }
    return segments[segments.length - 1] || defaultEmoji;
  };

  // Pre-process all image URLs to Base64 for GitHub compatibility
  const imageContentsToProcess: string[] = [];
  if (config.useEmoji) {
    for (let i = 0; i < snakeLength; i++) {
      const content = getEmojiForSegment(i);
      if (content.startsWith('http://') || content.startsWith('https://')) {
        imageContentsToProcess.push(content);
      }
    }
  }

  // Convert all external URLs to Base64 in parallel
  const convertedImages = new Map<string, string>();
  if (imageContentsToProcess.length > 0) {
    console.log(`🔄 Converting ${imageContentsToProcess.length} external image URLs to Base64...`);
    const converted = await Promise.all(
      imageContentsToProcess.map(url => processImageContent(url))
    );
    imageContentsToProcess.forEach((url, index) => {
      convertedImages.set(url, converted[index]);
    });
    console.log(`✅ All images converted to Base64`);
  }

  // Helper to get processed content (with URL -> Base64 conversion)
  const getProcessedContent = (segmentIndex: number): string => {
    const original = getEmojiForSegment(segmentIndex);
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

    if (config.useEmoji) {
      const content = getProcessedContent(i); // Use processed content (URLs converted to Base64)

      // Check if content is an image (data URI or remaining external URL)
      const isImage = content.startsWith('http://') ||
                     content.startsWith('https://') ||
                     content.startsWith('data:');

      if (isImage) {
        // Create image element for images
        const imageSize = s * 0.9; // Slightly smaller than cell
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
        const fontSize = s * 0.85; // Slightly smaller than the cell to fit nicely

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

      // Get animation timing function (smoother for emoji)
      const timingFunction = config.useEmoji && config.emojiConfig?.animationTiming
        ? config.emojiConfig.animationTiming
        : (config.useEmoji ? 'ease-out' : 'linear'); // Default to ease-out for emoji

      // Create keyframes for movement - match SNK's timing exactly
      // SNK uses i / length (not i / (length - 1)), so keyframes end before 100%
      const keyframes = positions.map((pos, frameIndex) => ({
        t: frameIndex / positions.length,  // Match SNK: last frame at (length-1)/length
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