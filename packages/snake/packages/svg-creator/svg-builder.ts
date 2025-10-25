/**
 * Complete SVG Creation
 *
 * Main SVG creation function that combines all components into a complete SVG document.
 * This mirrors the functionality from SNK's createSvg function with proper structure.
 *
 * @module create-svg
 */

import { Grid } from "../types/grid";
import { Point } from "../types/point";
import { Snake } from "../types/snake";
import { renderAnimatedSvgGrid, createAnimatedGridCells } from "./svg-grid-renderer";
import { renderAnimatedSvgSnake } from "./svg-snake-renderer";
import { createProgressStack, ContributionCounterConfig } from "./svg-stack-renderer";
import { createElement } from "./svg-utils";

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
  // Find the maximum font size from all displays (top-left/top-right need space above progress bar)
  let maxCounterFontSize = 0;
  if (animationOptions.contributionCounter?.enabled && animationOptions.contributionCounter.displays) {
    for (const display of animationOptions.contributionCounter.displays) {
      if (display.position !== 'follow') { // follow mode doesn't need extra space
        const fontSize = display.fontSize || drawOptions.sizeDot;
        maxCounterFontSize = Math.max(maxCounterFontSize, fontSize);
      }
    }
  }

  // Layout breakdown:
  // - viewBox y offset: -2 cells (top margin)
  // - Grid: grid.height cells
  // - Gap between grid and progress bar: need to fit counter text
  // - Progress bar: 1 cell (dotSize)
  // - Bottom margin: at least 1 cell
  //
  // Original layout: grid.height + 5 cells total
  //   = grid.height + 2 (gap) + 1 (progress bar) + 2 (bottom margin, adjusted for viewBox)
  //
  // For counter text above progress bar:
  // textY = progressBarY - fontSize * 0.5
  // Text extends from (progressBarY - fontSize) to progressBarY
  // Need: gridBottom to progressBarY distance >= fontSize + small padding

  const textSpaceInCells = maxCounterFontSize > 0
    ? Math.ceil((maxCounterFontSize * 1.5) / drawOptions.sizeCell) // 1.5x for padding above and below text
    : 0;

  // Gap between grid and progress bar: max of 2 cells (original) or text space requirement
  const gapCells = Math.max(2, textSpaceInCells);

  // Total extra space after grid: gap + progress bar (1) + bottom margin (2)
  const extraCells = gapCells + 3;

  const width = (grid.width + 2) * drawOptions.sizeCell;
  const height = (grid.height + extraCells) * drawOptions.sizeCell;
  const duration = animationOptions.frameDuration * chain.length;

  // Create animated grid cells
  const animatedCells = createAnimatedGridCells(grid, chain, cells);

  console.log(`📊 SVG Builder Debug:`);
  console.log(`  - Grid: ${grid.width}x${grid.height} cells`);
  console.log(`  - Total animated cells: ${animatedCells.length}`);
  console.log(`  - Cells with animation: ${animatedCells.filter(c => c.animationTime !== null).length}`);
  console.log(`  - Cells with color: ${animatedCells.filter(c => c.color > 0).length}`);
  console.log(`  - Snake chain length: ${chain.length}`);

  // Render the animated grid
  const gridResult = renderAnimatedSvgGrid(animatedCells, {
    colorDots: drawOptions.colorDots,
    colorEmpty: drawOptions.colorEmpty,
    colorDotBorder: drawOptions.colorDotBorder,
    cellSize: drawOptions.sizeCell,
    dotSize: drawOptions.sizeDot,
    dotBorderRadius: drawOptions.sizeDotBorderRadius,
  }, duration);

  // Render the animated snake
  const snakeResult = renderAnimatedSvgSnake(chain, {
    styling: {
      body: drawOptions.colorSnake,
      head: drawOptions.colorSnake,
    },
    cellSize: drawOptions.sizeCell,
    animationDuration: duration, // Keep in milliseconds
  }, drawOptions.sizeDot); // Pass dotSize as separate parameter following SNK pattern

  // Calculate progress bar Y position (leaving space for counter text above if needed)
  const progressBarY = (grid.height + gapCells) * drawOptions.sizeCell;

  // Create progress stack (timeline bar showing cell consumption)
  // Convert AnimatedGridCell to the format expected by createProgressStack
  const stackResult = await createProgressStack(
    animatedCells.map(cell => ({
      t: cell.animationTime,
      color: cell.color,
      x: cell.x,
      y: cell.y,
    })),
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

    // Defs must come before elements that use them
    ...stackResult.svgElements.filter(e => e.startsWith('<defs>')),

    "<style>",
    optimizeCss(style),
    "</style>",

    // Grid cells and other elements
    ...gridResult.svgElements,
    ...stackResult.svgElements.filter(e => !e.startsWith('<defs>') && !e.startsWith('<!--')),
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
        .map(([i, color]) => `--c${i}:${color};`)
        .join("")}
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
          .map(([i, color]) => `--c${i}:${color};`)
          .join("")}
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