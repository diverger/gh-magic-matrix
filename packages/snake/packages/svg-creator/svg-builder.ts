/**
 * Complete SVG Creation
 *
 * Main SVG creation function that combines all components into a complete SVG document.
 * This mirrors the functionality from SNK's createSvg function with proper structure.
 *
 * @module create-svg
 */

import { Grid, Color, Empty } from "../types/grid";
import { Point } from "../types/point";
import { Snake } from "../types/snake";
import { renderAnimatedSvgGrid, createAnimatedGridCells } from "./svg-grid-renderer";
import { renderAnimatedSvgSnake } from "./svg-snake-renderer";
import { createProgressStack, ContributionCounterConfig } from "./svg-stack-renderer";
import { createElement, isOutsideGrid } from "./svg-utils";

/**
 * Text padding multiplier for counter displays.
 * Scales the total vertical space reserved for text to fontSize * 1.5 (i.e., fontSize plus 0.5×fontSize extra clearance).
 * The extra 0.5×fontSize is reserved as additional vertical clearance to ensure adequate spacing
 * when Math.ceil is applied, but is not necessarily split equally above and below.
 */
const TEXT_PADDING_MULTIPLIER = 1.5;

/**
 * SVG rendering configuration options.
 */
export interface SvgRenderOptions {
  /** Color for each contribution level */
  colorDots: Record<number, string>;
  /** Color for empty cells */
  colorEmpty: string;
  /** Border color for cells */
  colorDotBorder: string;
  /** Color for the snake */
  colorSnake: string;
  /** Cell size in pixels */
  sizeCell: number;
  /** Dot size in pixels */
  sizeDot: number;
  /** Border radius for dots */
  sizeDotBorderRadius: number;
  /** Dark mode colors (optional) */
  dark?: {
    colorDots: Record<number, string>;
    colorEmpty: string;
    colorDotBorder?: string;
    colorSnake?: string;
  };
  /** Use custom content (emoji/image/text) for snake segments instead of rectangles */
  useCustomSnake?: boolean;
  /** Custom content configuration for snake (only used when useCustomSnake is true) */
  customSnakeConfig?: {
    /**
     * Array of content (emoji/image/text) for each segment or a function to generate them
     * Example: ['🐍', '🟢', '🟡'] or (index, total) => content
     */
    segments?: string[] | ((segmentIndex: number, totalLength: number) => string);
    /** Default content for unspecified segments (default: 🟢) */
    defaultEmoji?: string;
  };
}

/**
 * Animation options for SVG generation.
 */
export interface AnimationOptions {
  /** Duration per frame in milliseconds */
  frameDuration: number;
  /** Optional contribution counter configuration */
  contributionCounter?: ContributionCounterConfig;
}

/**
 * Creates a complete SVG document with snake animation.
 *
 * @param grid - The contribution grid.
 * @param cells - Optional array of specific cells to render (null for all).
 * @param chain - Array of snake states representing the movement.
 * @param drawOptions - Visual styling options.
 * @param animationOptions - Animation timing options.
 * @returns Complete SVG string.
 */
export const createSvg = async (
  grid: Grid,
  cells: Point[] | null,
  chain: Snake[],
  drawOptions: SvgRenderOptions,
  animationOptions: AnimationOptions,
): Promise<string> => {
  // Calculate required space for counter text
  // Find the maximum font size from displays above and below the progress bar
  let maxCounterFontSizeTop = 0;
  let maxCounterFontSizeBottom = 0;
  if (animationOptions.contributionCounter?.enabled && animationOptions.contributionCounter.displays) {
    for (const display of animationOptions.contributionCounter.displays) {
      const fontSize = display.fontSize || drawOptions.sizeDot;
      if (display.position === 'top-left' || display.position === 'top-right') {
        maxCounterFontSizeTop = Math.max(maxCounterFontSizeTop, fontSize);
      } else if (display.position === 'bottom-left' || display.position === 'bottom-right') {
        maxCounterFontSizeBottom = Math.max(maxCounterFontSizeBottom, fontSize);
      }
      // follow mode doesn't need extra space
    }
  }

  // Layout breakdown:
  // - viewBox y offset: -2 cells (top margin)
  // - Grid: grid.height cells
  // - Gap between grid and progress bar: need to fit counter text above
  // - Progress bar: 1 cell (dotSize)
  // - Bottom margin: need to fit counter text below + at least 1 cell
  //
  // Original layout: grid.height + 5 cells total
  //   = grid.height + 2 (gap) + 1 (progress bar) + 2 (bottom margin, adjusted for viewBox)
  //
  // For counter text above progress bar:
  // textY = progressBarY - fontSize * 0.5
  // For counter text below progress bar:
  // textY = progressBarY + dotSize + fontSize * 0.5
  // Text extends from progressBarY to (progressBarY + dotSize + fontSize)
  // Need: progressBarY to bottom distance >= dotSize + fontSize + small padding

  const textSpaceInCellsTop = maxCounterFontSizeTop > 0
    ? Math.ceil((maxCounterFontSizeTop * TEXT_PADDING_MULTIPLIER) / drawOptions.sizeCell)
    : 0;

  const textSpaceInCellsBottom = maxCounterFontSizeBottom > 0
    ? Math.ceil((maxCounterFontSizeBottom * TEXT_PADDING_MULTIPLIER) / drawOptions.sizeCell)
    : 0;

  // Check if progress bar is hidden (only affects visibility, not layout)
  // Support both top-level and counter-level hideProgressBar
  const hideProgressBar = animationOptions.contributionCounter?.hideProgressBar ?? false;

  // Gap between grid and progress bar: max of 2 cells (original) or text space requirement (for top text)
  const gapCells = Math.max(2, textSpaceInCellsTop);

  // Bottom margin: minBottomMarginCells guarantees enough space for bottom counter text and progress bar
  const minBottomMarginPx = maxCounterFontSizeBottom * TEXT_PADDING_MULTIPLIER;
  const minBottomMarginCells = Math.ceil(minBottomMarginPx / drawOptions.sizeCell);
  const bottomMarginCells = Math.max(1, minBottomMarginCells);
  const topMarginCells = 2; // 1 for snake, 1 for margin

  // Total extra space after grid: gap + progress bar (1) + top margin + bottom margin
  // Note: hideProgressBar only sets opacity:0, doesn't change layout
  const extraCells = gapCells + 1 + topMarginCells + bottomMarginCells;

  const width = (grid.width + 2) * drawOptions.sizeCell;
  const height = (grid.height + extraCells) * drawOptions.sizeCell;
  const duration = animationOptions.frameDuration * chain.length;

  // Create animated grid cells
  const animatedCells = createAnimatedGridCells(grid, chain, cells);

  if (animationOptions.contributionCounter?.debug) {
    console.log(`📊 SVG Builder Debug:`);
    console.log(`  - Grid: ${grid.width}x${grid.height} cells`);
    console.log(`  - Total animated cells: ${animatedCells.length}`);
    console.log(`  - Cells with animation: ${animatedCells.filter(c => c.animationTime !== null).length}`);
    console.log(`  - Cells with color: ${animatedCells.filter(c => c.color > 0).length}`);
    console.log(`  - Snake chain length: ${chain.length}`);
  }

  // Grid render mode: uniform (only show colored cells, L1-L4)
  const showEmptyCells = false;
  if (animationOptions.contributionCounter?.debug) {
    console.log(`  - Grid render mode: uniform (showEmptyCells: ${showEmptyCells})`);
  }

  // Render the animated grid
  const gridResult = renderAnimatedSvgGrid(animatedCells, {
    colorDots: drawOptions.colorDots,
    colorEmpty: drawOptions.colorEmpty,
    colorDotBorder: drawOptions.colorDotBorder,
    cellSize: drawOptions.sizeCell,
    dotSize: drawOptions.sizeDot,
    dotBorderRadius: drawOptions.sizeDotBorderRadius,
    gridWidth: grid.width,
    gridHeight: grid.height,
    showEmptyCells, // Pass the flag to control L0 rendering
  }, duration);

  // Render the animated snake (auto-converts external URLs to Base64)
  const snakeResult = await renderAnimatedSvgSnake(chain, {
    styling: {
      body: drawOptions.colorSnake,
      head: drawOptions.colorSnake,
    },
    cellSize: drawOptions.sizeCell,
    animationDuration: duration, // Keep in milliseconds
    useEmoji: drawOptions.useCustomSnake,
    emojiConfig: drawOptions.customSnakeConfig,
  }, drawOptions.sizeDot); // Pass dotSize as separate parameter following SNK pattern

  // Calculate progress bar Y position (leaving space for counter text above if needed)
  const progressBarY = (grid.height + gapCells) * drawOptions.sizeCell;

  // Create progress stack (timeline bar showing cell consumption)
  // Uniform mode: Use animatedCells for progress bar (unique grid cells, no L0, no repeats)
  // Sprite animation: Use chain (all steps including L0) for sprite frame generation
  let progressBarCells;
  let spriteAnimationCells; // Separate data source for sprite animation

  // Uniform mode: use animatedCells for progress bar (unique cells, L0 already filtered by grid renderer)
  progressBarCells = animatedCells.map(cell => ({
    t: cell.animationTime,
    color: cell.color,
    x: cell.x,
    y: cell.y,
  }));

  // CRITICAL FIX: Sprite animation should use full chain (includes L0 for empty cells)
  // This ensures sprite shows L0 animation when snake passes through empty cells
  spriteAnimationCells = chain.map((snake, index) => {
    const headPos = snake.getHead();
    let cellColor: Color | Empty;
    if (isOutsideGrid(headPos.x, headPos.y, grid.width, grid.height)) {
      cellColor = 0 as Empty; // Outside grid = empty
    } else {
      cellColor = grid.getColor(headPos.x, headPos.y);
    }
    return {
      t: index / chain.length, // Normalized time (0-1)
      color: cellColor,
      x: headPos.x,
      y: headPos.y,
    };
  });

  const stackResult = await createProgressStack(
    progressBarCells,
    drawOptions.sizeDot,
    grid.width * drawOptions.sizeCell,
    progressBarY,
    duration,
    animationOptions.contributionCounter
      ? {
          ...animationOptions.contributionCounter,
          colorDots: drawOptions.colorDots, // Pass color map for gradients
        }
      : undefined,
    grid.width, // Pass grid dimensions to filter outside cells
    grid.height,
    spriteAnimationCells, // Pass separate data source for sprite animation (includes L0)
  );

  // Create viewBox
  const viewBox = [
    -drawOptions.sizeCell,
    -drawOptions.sizeCell * 2,
    width,
    height,
  ].join(" ");

  // Generate CSS variables and styles
  const style = generateColorVar(drawOptions) +
    gridResult.styles.join("\n") + "\n" +
    snakeResult.styles + "\n" +
    stackResult.styles;

  // Create complete SVG structure
  const svg = [
    createElement("svg", {
      viewBox,
      width,
      height,
      xmlns: "http://www.w3.org/2000/svg",
      "xmlns:xlink": "http://www.w3.org/1999/xlink",
    }).replace("/>", ">"),

    "<desc>",
    "Generated with https://github.com/diverger/gh-magic-matrix",
    "</desc>",

    // Combine all defs and style into a single <defs> block
    "<defs>",
    // Include common def elements
    ...stackResult.svgElements.filter(e =>
      /^(<linearGradient|<image|<symbol|<pattern|<clipPath|<mask|<filter)\b/.test(e)
    ),
    "<style>",
    optimizeCss(style),
    "</style>",
    "</defs>",

    // Grid cells and other elements (everything else)
    ...gridResult.svgElements,
    ...stackResult.svgElements.filter(e =>
      !e.startsWith('<linearGradient') &&
      !e.startsWith('<image') &&
      !e.startsWith('<symbol') &&
      !e.startsWith('<!--')
    ),
    ...snakeResult.elements,

    "</svg>",
  ].join("");

  return optimizeSvg(svg);
};

/**
 * Generates CSS variables for theming.
 */
const generateColorVar = (drawOptions: SvgRenderOptions): string => {
  let css = `
    :root {
      --cb: ${drawOptions.colorDotBorder};
      --cs: ${drawOptions.colorSnake};
      --ce: ${drawOptions.colorEmpty};
      ${Object.entries(drawOptions.colorDots)
        .map(([i, color]) => `--c${i}: ${color};`)
        .join(" ")}
    }
  `;

  if (drawOptions.dark) {
    css += `
    @media (prefers-color-scheme: dark) {
      :root {
        --cb: ${drawOptions.dark.colorDotBorder || drawOptions.colorDotBorder};
        --cs: ${drawOptions.dark.colorSnake || drawOptions.colorSnake};
        --ce: ${drawOptions.dark.colorEmpty};
        ${Object.entries(drawOptions.dark.colorDots)
          .map(([i, color]) => `--c${i}: ${color};`)
          .join(" ")}
      }
    }
    `;
  }

  return css;
};

/**
 * Optimizes CSS by removing unnecessary whitespace.
 */
const optimizeCss = (css: string): string => {
  return css
    .replace(/\s+/g, " ")
    .replace(/;\s*}/g, "}")
    .replace(/{\s*/g, "{")
    .trim();
};

/**
 * Optimizes SVG content (placeholder for future optimizations).
 */
const optimizeSvg = (svg: string): string => {
  return svg;
};