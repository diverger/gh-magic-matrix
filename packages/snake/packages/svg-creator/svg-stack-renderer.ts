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

      // Helper to clamp normalized time to [0, 1] range
      const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

      const keyframes: AnimationKeyframe[] = [
        { t: 0, style: "opacity: 0; transform: scale(0) translateY(10px);" },
        { t: clamp01(startTime / config.animationDuration), style: "opacity: 0; transform: scale(0) translateY(10px);" },
        { t: clamp01((startTime + 300) / config.animationDuration), style: "opacity: 0.7; transform: scale(0.8) translateY(5px);" },
        { t: clamp01((startTime + 600) / config.animationDuration), style: "opacity: 1; transform: scale(1) translateY(0);" },
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
 *
 * Supports multiple modes:
 * 1. Single static image: Just provide `url`
 * 2. Sprite sheet: Provide `url` and `sprite` config
 * 3. Multiple separate images: Provide `urlFolder` with framePattern
 * 4. Contribution-level based images: Use `Lx` placeholder in framePattern
 *    - `Lx.png` - All levels use same image (x will be replaced with level 0-4)
 *    - `Lx-{n}.png` - Each level has animated frames (x=level, n=frame number)
 *    - Example files: L0-0.png, L0-1.png, L1.png, L2-0.png, L2-1.png, L2-2.png
 */
export interface CounterImageConfig {
  /**
   * Single image URL (data URI or external URL)
   * Use this for single image or sprite sheet
   */
  url?: string;

  /**
   * Horizontal spacing between image and adjacent text (in pixels)
   * - Positive value: adds space after the image (pushes text to the right)
   * - Negative value: reduces space (pulls text closer)
   * Default: 0 (no extra spacing)
   */
  spacing?: number;

  /**
   * Folder path containing numbered images for animation frames
   * Images should be named according to framePattern.
   * This path will be resolved relative to the workspace in GitHub Actions.
   *
   * Example: 'images/character' with framePattern 'Lx-{n}.png' will look for:
   *   - images/character/L0-0.png, L0-1.png, L0-2.png (level 0 frames)
   *   - images/character/L1-0.png, L1-1.png (level 1 frames)
   *   - images/character/L2.png (level 2 static)
   *   - ...
   *
   * Note: In GitHub workflows, these files should be committed to the repository
   * or generated before the action runs.
   */
  urlFolder?: string;

  /**
   * Pattern for frame filenames when using urlFolder
   * Default: 'frame-{n}.png' where {n} is the frame number (0-indexed)
   *
   * Placeholders:
   *   - {n} - Frame number (0-indexed)
   *   - Lx - Contribution level (x will be replaced with 0-4)
   *
   * Examples:
   *   - 'frame-{n}.png' -> frame-0.png, frame-1.png, ...
   *   - 'Lx-{n}.png' -> L0-0.png, L0-1.png, L1-0.png, L1-1.png, ...
   *   - 'Lx.png' -> L0.png, L1.png, L2.png, L3.png, L4.png (static per level)
   *   - 'level-x-frame-{n}.gif' -> level-0-frame-0.gif, level-1-frame-0.gif, ...
   */
  framePattern?: string;

  /**
   * Display width in SVG pixels (how wide the image will be rendered)
   * This is the scaled/display size, not the original image dimensions.
   * Example: If actual image is 100x100 but you set width=32, it displays at 32px wide
   */
  width: number;
  /**
   * Display height in SVG pixels (how tall the image will be rendered)
   * This is the scaled/display size, not the original image dimensions.
   * Example: If actual image is 100x100 but you set height=32, it displays at 32px tall
   */
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

  /**
   * Text anchor point for image alignment (0-1 normalized)
   * Specifies which vertical point of the text to use as the alignment reference.
   *
   * - 0.0: Top of text (cap height)
   * - 0.5: Middle of text (default, matches dominant-baseline="middle")
   * - 1.0: Bottom of text (baseline where characters sit)
   * - Custom: Any value between 0-1
   *
   * Combined with `anchorY`, determines how image aligns to text:
   * - textAnchorY=1.0, anchorY=1.0: Image bottom aligns with text baseline
   * - textAnchorY=0.5, anchorY=0.5: Image center aligns with text center
   * - textAnchorY=1.0, anchorY=0.5: Image center aligns with text baseline
   *
   * Default: 0.5 (text center, matching dominant-baseline="middle")
   */
  textAnchorY?: number;

  /** Sprite sheet or multi-image animation configuration */
  sprite?: {
    /**
     * UNIFIED: Number of frames (works for all modes)
     * - For sync/loop modes: total frame count across all cells
     * - For contribution-level mode: frames per level (or array for different counts per level)
     *
     * Examples:
     * - `framesPerLevel: 8` with mode 'sync' → 8 frames cycling (run-0.png ~ run-7.png)
     * - `framesPerLevel: 8` with mode 'contribution-level' → 8 frames per level (L0.png, L1.png, ...)
     * - `framesPerLevel: [1,2,4,6,8]` → level 0 has 1 frame, level 4 has 8 frames
     */
    framesPerLevel?: number | number[];

    /**
     * Frame width (only for sprite sheet mode)
     * If not provided, calculated as: image width / frames (horizontal) or image width (vertical)
     */
    frameWidth?: number;
    /**
     * Frame height (only for sprite sheet mode)
     * If not provided, calculated as: image height (horizontal) or image height / frames (vertical)
     */
    frameHeight?: number;
    /**
     * Layout (only for sprite sheet mode)
     * - 'horizontal': frames arranged left to right
     * - 'vertical': frames arranged top to bottom
     * Default: 'horizontal'
     */
    layout?: 'horizontal' | 'vertical';
    /**
     * Animation mode:
     * - 'sync': Synced with progress bar (frame changes with progress steps)
     * - 'loop': Independent looping animation (CSS-based)
     * - 'contribution-level': Images change based on contribution level (0-4)
     *   When using this mode:
     *   - With urlFolder + Lx pattern: Each level can have static/animated frames
     *     (Lx.png for static, Lx-{n}.png for frames)
     *   - With urlFolder + Lx pattern + sprite sheet: Each level is a separate sprite sheet
     *     (Lx.png where each file is a sprite sheet with frames inside)
     */
    mode?: 'sync' | 'loop' | 'contribution-level';
    /**
     * Number of contribution levels (default: 5, matching GitHub's contribution grid)
     * Used when mode is 'contribution-level'
     */
    contributionLevels?: number;
    /**
     * Use sprite sheet per contribution level instead of separate frame files
     * When true with contribution-level mode:
     *   - Files: L0.png, L1.png, L2.png, L3.png, L4.png (each is a sprite sheet)
     *   - Each sprite sheet contains frames specified by framesPerLevel
     *   - frameWidth and frameHeight define the dimensions of each frame in the sprite
     *
     * Default: false (uses separate files Lx-{n}.png)
     */
    useSpriteSheetPerLevel?: boolean;
    /**
     * Enable dynamic speed in sync mode (contribution-driven frame rate)
     * When true, images animate faster when eating cells with higher contribution values
     * Frame selection: frameIndex = Math.floor((contribution / maxContribution) * (framesPerLevel - 1))
     *
     * Example: If max contribution is 20 and current cell is 15:
     * - With 10 frames: shows frame 7 (15/20 * 9 = 6.75 -> 7)
     * - With 5 frames: shows frame 3 (15/20 * 4 = 3)
     *
     * Default: false (cycles through frames sequentially)
     * Note: Only used when mode is 'sync', not 'contribution-level'
     */
    dynamicSpeed?: boolean;
    /**
     * Animation speed multiplier (for sync mode with cycling animation)
     * Controls how many animation frames advance per step
     * When set, frame index = Math.floor((stepIndex * animationSpeed) % totalFrames)
     * Combined with dynamicSpeed: speedFactor = animationSpeed * (contribution / maxContribution)
     *
     * Example with 8 frames walking cycle:
     * - animationSpeed: 1 -> 8 steps complete one walk cycle
     * - animationSpeed: 2 -> 4 steps complete one walk cycle (faster)
     * - animationSpeed: 0.5 -> 16 steps complete one walk cycle (slower)
     *
     * Default: 1
     */
    animationSpeed?: number;
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
  /**
   * Progress bar growth mode
   * - 'uniform': Each cell occupies equal width (original behavior)
   * - 'contribution': Width allocated based on contribution value (new behavior)
   * Default: 'contribution'
   */
  progressBarMode?: 'uniform' | 'contribution';
  /** Color map for gradient (level -> hex color) */
  colorDots?: Record<number, string>;
  /**
   * Hide the progress bar completely
   * When true, no progress bar will be rendered (useful for minimal layouts)
   * Default: false
   */
  hideProgressBar?: boolean;
  /**
   * Enable debug logging
   * When true, outputs detailed progress bar and animation state information to console
   * Default: false
   */
  debug?: boolean;
}

/**
 * Counter state at a specific point in time during the animation
 */
interface CounterState {
  count: number;
  percentage: string;
  time: number;
  x: number;
  currentContribution: number;
  isRepeatedCell?: boolean; // True if snake is re-visiting a cell (should keep previous level)
}

/**
 * Build counter states by tracking cumulative contributions over time.
 * This generates keyframes showing count/percentage at each snake position.
 *
 * @param sortedCells - Cells sorted by animation time
 * @param counterConfig - Counter configuration with contribution map
 * @param totalContributions - Total contribution count
 * @param width - Progress bar width (for position calculation)
 * @param position - Counter position mode ('top-left', 'top-right', 'follow')
 * @param textOffsetX - Horizontal offset for follow mode
 * @returns Array of counter states and repeated cell count
 */
function buildCounterStates(
  sortedCells: Array<{ x?: number; y?: number; t: number | null }>,
  counterConfig: ContributionCounterConfig,
  totalContributions: number,
  width: number,
  position: 'top-left' | 'top-right' | 'follow',
  textOffsetX: number
): { states: CounterState[]; repeatedCellCount: number } {
  const states: CounterState[] = [];
  let cumulativeCount = 0;
  let cumulativeWidth = 0;

  // Track when each cell is first eaten (by coordinates)
  const firstEatenTime = new Map<string, number>();
  let repeatedCellCount = 0;

  // Initial state
  states.push({
    count: 0,
    percentage: '0.0',
    time: 0,
    x: position === 'top-left' ? 0 : (position === 'top-right' ? width : 0),
    currentContribution: 0
  });

  sortedCells.forEach((cell, index) => {
    // Get contribution count for this cell using its coordinates
    let count = 0; // Default to 0 for empty cells (no contribution)
    let isRepeatedCell = false; // Track if this is a repeated cell visit
    if (counterConfig.contributionMap &&
      typeof cell.x === 'number' && typeof cell.y === 'number') {
      const key = `${cell.x},${cell.y}`;

      // Check if this cell has been eaten before (snake passing through again)
      if (firstEatenTime.has(key)) {
        // Cell was already eaten - treat as empty (contribution=0) on subsequent passes
        count = 0;
        repeatedCellCount++;
        isRepeatedCell = true; // Mark as repeated cell
        if (counterConfig.debug) {
          console.log(`  ⚠️ Cell ${index} at ${key}: REPEATED (2nd+ pass) → count=0, will store currentContribution=0, isRepeatedCell=true`);
        }
      } else {
        // First time eating this cell - use its original contribution value
        count = counterConfig.contributionMap.get(key) || 0;

        // Record the time this cell is first eaten
        firstEatenTime.set(key, cell.t!);

        if (counterConfig.debug && index < 10) {
          console.log(`  Cell ${index} at ${key}: first time → count=${count}`);
        }
      }

      // Debug: log cells with no contribution data
      if (counterConfig.debug && !counterConfig.contributionMap.has(key) && index < 20) {
        console.log(`⚠️  Cell ${index} at (${cell.x}, ${cell.y}) has no contribution data in map`);
      }
    }

    cumulativeCount += count;

    // Calculate cumulative width based on total contribution progress
    cumulativeWidth = width * (cumulativeCount / totalContributions);

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

    states.push({
      count: cumulativeCount,
      percentage,
      time: cell.t!,
      x,
      currentContribution: count, // Store current cell's contribution for dynamic frame selection
      isRepeatedCell // Mark repeated cells so animation logic can handle them correctly
    });
  });

  if (counterConfig.debug) {
    if (repeatedCellCount > 0) {
      console.log(`🔄 Snake re-visited ${repeatedCellCount} cells (these will use L0 animation)`);
    } else {
      console.log(`📍 Snake visited each cell only once (L0 only used for contribution=0 cells)`);
    }
  }

  return { states, repeatedCellCount };
}

/**
 * Pre-load counter images and create SVG definitions.
 * This optimizes file size by defining images once in <defs> and referencing them.
 *
 * @param display - Display configuration with image settings
 * @param displayIndex - Index of this display (for unique IDs)
 * @param counterConfig - Counter configuration (for debug logging)
 * @param maxContribution - Maximum contribution value (for level calculation)
 * @returns Map of image definitions (imageIndex -> level -> frameIndex -> defId) and SVG definition elements
 */
async function preloadCounterImages(
  display: CounterDisplayConfig,
  displayIndex: number,
  counterConfig: ContributionCounterConfig,
  maxContribution: number
): Promise<{
  imageDataMap: Map<number, Map<number, Map<number, string>>>;
  imageDefsElements: string[];
}> {
  const imageDataMap = new Map<number, Map<number, Map<number, string>>>();
  const imageDefsElements: string[] = [];

  if (!display.images || display.images.length === 0) {
    return { imageDataMap, imageDefsElements };
  }

  for (let imgIdx = 0; imgIdx < display.images.length; imgIdx++) {
    const imageConfig = display.images[imgIdx];
    if (!validateImageConfig(imageConfig)) continue;

    const levelMap = new Map<number, Map<number, string>>();
    imageDataMap.set(imgIdx, levelMap);

    const isContributionLevel = imageConfig.sprite?.mode === 'contribution-level';
    const framesPerLevel = imageConfig.sprite?.framesPerLevel;
    const effectiveFrameCount = typeof framesPerLevel === 'number' ? framesPerLevel : 1;

    const isMultiFrame = imageConfig.sprite && effectiveFrameCount > 1;
    const frameCount = effectiveFrameCount;

    if (isContributionLevel && imageConfig.urlFolder) {
      // Contribution-level mode: Lx pattern with multiple levels
      const contributionLevels = imageConfig.sprite?.contributionLevels || 5;
      const framePattern = imageConfig.framePattern || 'Lx.png';
      const framesPerLevel = imageConfig.sprite?.framesPerLevel || 1;
      const useSpriteSheetPerLevel = imageConfig.sprite?.useSpriteSheetPerLevel || false;

      for (let level = 0; level < contributionLevels; level++) {
        const frameMap = new Map<number, string>();
        levelMap.set(level, frameMap);

        const levelFrameCount = Array.isArray(framesPerLevel) ? framesPerLevel[level] : framesPerLevel;

        if (useSpriteSheetPerLevel) {
          // Each level is a sprite sheet file: L0.png, L1.png, etc.
          const spriteUrl = generateLevelFrameUrl(imageConfig.urlFolder, framePattern, level, 0);
          const resolvedUrl = await resolveImageUrl(spriteUrl);

          if (counterConfig.debug) {
            console.log(`🖼️  Loading sprite sheet for level ${level}: ${spriteUrl} → ${resolvedUrl ? 'OK' : 'FAILED'}`);
          }

          if (resolvedUrl) {
            const sprite = imageConfig.sprite!;
            const layout = sprite.layout || 'horizontal';
            const frameWidth = sprite.frameWidth || imageConfig.width;
            const frameHeight = sprite.frameHeight || imageConfig.height;

            // Define the full sprite sheet image for this level
            const spriteImageId = `contrib-sprite-${displayIndex}-${imgIdx}-L${level}`;
            imageDefsElements.push(
              createElement("image", {
                id: spriteImageId,
                href: resolvedUrl,
              })
            );

            // Create a symbol for each frame in this level's sprite sheet
            for (let frameIdx = 0; frameIdx < levelFrameCount; frameIdx++) {
              const symbolId = `contrib-img-${displayIndex}-${imgIdx}-L${level}-f${frameIdx}`;
              frameMap.set(frameIdx, symbolId);

              // Calculate the position of this frame in the sprite sheet
              let viewBoxX = 0;
              let viewBoxY = 0;

              if (layout === 'horizontal') {
                viewBoxX = frameIdx * frameWidth;
                viewBoxY = 0;
              } else {
                // vertical layout
                viewBoxX = 0;
                viewBoxY = frameIdx * frameHeight;
              }

              // Create a symbol that crops to just this frame
              const useElement = `<use href="#${spriteImageId}" />`;
              const symbolElement = createElement("symbol", {
                id: symbolId,
                viewBox: `${viewBoxX} ${viewBoxY} ${frameWidth} ${frameHeight}`
              }).replace("/>", `>${useElement}</symbol>`);

              imageDefsElements.push(symbolElement);
            }

            if (counterConfig.debug) {
              console.log(`  ✓ Created ${levelFrameCount} symbols for level ${level}`);
            }
          }
        } else {
          // Each level uses separate frame files: L0-0.png, L0-1.png, etc.
          for (let frameIdx = 0; frameIdx < levelFrameCount; frameIdx++) {
            const frameUrl = generateLevelFrameUrl(imageConfig.urlFolder, framePattern, level, frameIdx);
            const resolvedUrl = await resolveImageUrl(frameUrl);

            if (resolvedUrl) {
              const defId = `contrib-img-${displayIndex}-${imgIdx}-L${level}-f${frameIdx}`;
              frameMap.set(frameIdx, defId);

              imageDefsElements.push(
                createElement("image", {
                  id: defId,
                  href: resolvedUrl,
                  width: imageConfig.width.toString(),
                  height: imageConfig.height.toString(),
                })
              );
            }
          }
        }
      }
    } else if (isMultiFrame && imageConfig.urlFolder) {
      // Multi-file mode: load separate frame files (no Lx pattern)
      const framePattern = imageConfig.framePattern || 'frame-{n}.png';
      const frameUrls = generateFrameUrls(imageConfig.urlFolder, framePattern, frameCount);

      const frameMap = new Map<number, string>();
      levelMap.set(0, frameMap); // Single level (level 0)

      for (let frameIdx = 0; frameIdx < frameCount; frameIdx++) {
        const resolvedUrl = await resolveImageUrl(frameUrls[frameIdx]);
        if (resolvedUrl) {
          const defId = `contrib-img-${displayIndex}-${imgIdx}-f${frameIdx}`;
          frameMap.set(frameIdx, defId);

          imageDefsElements.push(
            createElement("image", {
              id: defId,
              href: resolvedUrl,
              width: imageConfig.width.toString(),
              height: imageConfig.height.toString(),
            })
          );
        }
      }
    } else if (isMultiFrame && imageConfig.url && imageConfig.sprite) {
      // Single sprite sheet file with multiple frames
      const resolvedUrl = await resolveImageUrl(imageConfig.url);
      if (resolvedUrl) {
        const sprite = imageConfig.sprite;
        const layout = sprite.layout || 'horizontal';
        const frameWidth = sprite.frameWidth || imageConfig.width;
        const frameHeight = sprite.frameHeight || imageConfig.height;

        // Define the sprite sheet image
        const spriteImageId = `contrib-sprite-${displayIndex}-${imgIdx}`;
        imageDefsElements.push(
          createElement("image", {
            id: spriteImageId,
            href: resolvedUrl,
          })
        );

        // Create symbols for each frame
        const frameMap = new Map<number, string>();
        levelMap.set(0, frameMap);

        for (let frameIdx = 0; frameIdx < frameCount; frameIdx++) {
          const symbolId = `contrib-img-${displayIndex}-${imgIdx}-f${frameIdx}`;
          frameMap.set(frameIdx, symbolId);

          let viewBoxX = 0;
          let viewBoxY = 0;

          if (layout === 'horizontal') {
            viewBoxX = frameIdx * frameWidth;
            viewBoxY = 0;
          } else {
            viewBoxX = 0;
            viewBoxY = frameIdx * frameHeight;
          }

          const useElement = `<use href="#${spriteImageId}" />`;
          const symbolElement = createElement("symbol", {
            id: symbolId,
            viewBox: `${viewBoxX} ${viewBoxY} ${frameWidth} ${frameHeight}`
          }).replace("/>", `>${useElement}</symbol>`);

          imageDefsElements.push(symbolElement);
        }
      }
    } else if (imageConfig.url) {
      // Static image (single frame, single level)
      const resolvedUrl = await resolveImageUrl(imageConfig.url);

      if (resolvedUrl) {
        const defId = `contrib-img-${displayIndex}-${imgIdx}`;
        const frameMap = new Map<number, string>();
        levelMap.set(0, frameMap); // Single level (level 0)
        frameMap.set(0, defId);

        imageDefsElements.push(
          createElement("image", {
            id: defId,
            href: resolvedUrl,
            width: imageConfig.width.toString(),
            height: imageConfig.height.toString(),
          })
        );
      }
    }
  }

  return { imageDataMap, imageDefsElements };
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
export const createProgressStack = async (
  cells: AnimatedCellData[],
  dotSize: number,
  width: number,
  y: number,
  duration: number,
  counterConfig?: ContributionCounterConfig,
  gridWidth?: number, // Optional: grid width for filtering outside cells
  gridHeight?: number, // Optional: grid height for filtering outside cells
): Promise<ProgressStackResult> => {
  const svgElements: string[] = [];
  const isHidden = counterConfig?.hideProgressBar ?? false;

  const baseStyle = `.u{
      transform-origin: 0 0;
      animation: none linear ${duration}ms infinite;${isHidden ? '\n      opacity: 0;' : ''}
    }`;

  const styles: string[] = [baseStyle];

  if (isHidden && counterConfig?.debug) {
    console.log(`📊 Progress Bar: Hidden (hideProgressBar = true, bars invisible but counter text visible)`);
  }

  // Filter out cells outside the grid (used for L0 animation only, not for progress calculation)
  const filteredCells = cells.filter((cell) => {
    if (cell.t === null) return false;

    // If grid dimensions provided, filter out outside cells
    if (gridWidth !== undefined && gridHeight !== undefined &&
      cell.x !== undefined && cell.y !== undefined) {
      if (cell.x < 0 || cell.y < 0 || cell.x >= gridWidth || cell.y >= gridHeight) {
        return false; // Outside cell - exclude from progress bar calculation
      }
    }

    return true;
  });

  // Sort remaining cells by animation time
  const sortedCells = filteredCells.sort((a, b) => a.t! - b.t!);

  // CRITICAL FIX: Calculate counter-specific duration
  // Global duration is based on full chain (including outside cells)
  // Counter duration should be based on filtered cells only (inside grid)
  // This ensures each counter frame displays for the correct duration (frameDuration)
  const frameDuration = cells.length > 0 ? duration / cells.length : 100;
  const counterDuration = sortedCells.length * frameDuration;

  // Determine progress bar mode (default to 'contribution')
  const progressBarMode = counterConfig?.progressBarMode ?? 'contribution';

  if (counterConfig?.debug) {
    console.log(`📊 Progress Bar Debug:`);
    console.log(`  - Total cells passed: ${cells.length}`);
    console.log(`  - Cells with animation (t !== null): ${sortedCells.length}`);
    console.log(`  - Global duration: ${duration}ms (${cells.length} frames × ${frameDuration.toFixed(1)}ms)`);
    console.log(`  - Counter duration: ${counterDuration}ms (${sortedCells.length} frames × ${frameDuration.toFixed(1)}ms)`);
    console.log(`  - Outside cells filtered: ${cells.length - sortedCells.length}`);
    console.log(`  - Progress bar mode: ${progressBarMode}`);
    console.log(`  - Counter config enabled: ${counterConfig?.enabled}`);
    console.log(`  - Contribution map size: ${counterConfig?.contributionMap?.size || 0}`);
  }

  if (sortedCells.length === 0) {
    console.warn(`⚠️  No cells to animate in progress bar!`);
    return { svgElements, styles: styles.join('\n') };
  }

  // Calculate total contributions for progress bar scaling
  const totalContributions = counterConfig?.contributionMap
    ? Array.from(counterConfig.contributionMap.values()).reduce((sum, count) => sum + count, 0)
    : sortedCells.length;

  // Build cell data with contributions
  const cellsWithContributions = sortedCells.map(cell => {
    let contribution = 1;
    if (counterConfig?.contributionMap) {
      const key = `${cell.x},${cell.y}`;
      contribution = counterConfig.contributionMap.get(key) ?? 0;
    }
    return {
      time: cell.t!,
      color: cell.color as Color,
      contribution,
    };
  });

  // Group blocks differently based on mode
  interface ProgressBlock {
    color: Color;
    times: number[];
    contributions: number[];
  }

  const blocks: ProgressBlock[] = [];

  if (progressBarMode === 'contribution') {
    // Contribution mode: Single block for entire progress bar
    // Use the most common color or a default
    const colorCounts = new Map<Color, number>();
    cellsWithContributions.forEach(cell => {
      colorCounts.set(cell.color, (colorCounts.get(cell.color) || 0) + 1);
    });

    // Find most frequent color
    let mostFrequentColor: Color = 1 as Color;
    let maxCount = 0;
    colorCounts.forEach((count, color) => {
      if (count > maxCount) {
        maxCount = count;
        mostFrequentColor = color;
      }
    });

    // Create single block with all cells
    blocks.push({
      color: mostFrequentColor,
      times: cellsWithContributions.map(c => c.time),
      contributions: cellsWithContributions.map(c => c.contribution),
    });
  } else {
    // Uniform mode: Group by color as before
    for (const cell of cellsWithContributions) {
      const latestBlock = blocks[blocks.length - 1];

      if (latestBlock && latestBlock.color === cell.color) {
        // Same color - add to existing block
        latestBlock.times.push(cell.time);
        latestBlock.contributions.push(cell.contribution);
      } else {
        // Different color - create new block
        blocks.push({
          color: cell.color,
          times: [cell.time],
          contributions: [cell.contribution],
        });
      }
    }
  }

  // No longer use fixed cellWidth in contribution mode
  // In uniform mode, each cell occupies equal width
  const cellWidth = progressBarMode === 'uniform' ? width / sortedCells.length : 0;

  // REFACTOR: Removed gradient approach, using block colors instead (Goal 3)
  // const gradientDefs: string[] = [];

  let blockIndex = 0;
  let cumulativeContribution = 0;
  let cumulativeCellCount = 0; // For uniform mode

  for (const block of blocks) {
    // Calculate block's total contribution and cell count
    const blockTotalContribution = block.contributions.reduce((sum, c) => sum + c, 0);
    const blockCellCount = block.times.length;

    // Generate unique ID for this block
    const blockId = "u" + blockIndex.toString(36);
    const animationName = blockId;
    // const gradientId = `gradient-${blockId}`; // REMOVED: No longer using gradients

    // REFACTOR (Goal 3): Use solid block color instead of gradients
    // Each block uses its base color (var(--cX))

    // ALL blocks start at x=0 and have full width
    // They will be clipped/scaled to show only their portion
    const fillAttr = `var(--c${block.color})`;  // Always use CSS variable, no gradients

    svgElements.push(
      createElement("rect", {
        class: `u ${blockId}`,
        fill: fillAttr,
        height: dotSize.toString(),
        width: width.toString(),
        x: "0",
        y: y.toString(),
      }),
    );

    // Create animation keyframes based on progress bar mode
    // Each block is clipped to show only its range: [startX, endX]
    let blockStartX: number, blockEndX: number;

    if (progressBarMode === 'contribution') {
      // Contribution mode: allocate space based on contribution value
      blockStartX = cumulativeContribution / totalContributions;
      blockEndX = (cumulativeContribution + blockTotalContribution) / totalContributions;
    } else {
      // Uniform mode: allocate equal space per cell
      blockStartX = cumulativeCellCount / sortedCells.length;
      blockEndX = (cumulativeCellCount + blockCellCount) / sortedCells.length;
    }

    const keyframes: AnimationKeyframe[] = [];
    let blockCumulativeContribution = 0;
    let blockCumulativeCellCount = 0; // For uniform mode

    block.times.forEach((t, i) => {
      const prevContribution = blockCumulativeContribution;
      blockCumulativeContribution += block.contributions[i];

      const prevCellCount = blockCumulativeCellCount;
      blockCumulativeCellCount += 1;

      const t1 = Math.max(0, t - 0.0001);
      const t2 = Math.min(1, t + 0.0001);

      // Calculate current right edge of the visible progress based on mode
      let currentRightEdge: number, prevRightEdge: number;

      if (progressBarMode === 'contribution') {
        // Contribution mode: position based on accumulated contribution
        const currentTotalContribution = cumulativeContribution + blockCumulativeContribution;
        currentRightEdge = currentTotalContribution / totalContributions;

        const prevTotalContribution = cumulativeContribution + prevContribution;
        prevRightEdge = prevTotalContribution / totalContributions;
      } else {
        // Uniform mode: position based on cell count
        const currentTotalCells = cumulativeCellCount + blockCumulativeCellCount;
        currentRightEdge = currentTotalCells / sortedCells.length;

        const prevTotalCells = cumulativeCellCount + prevCellCount;
        prevRightEdge = prevTotalCells / sortedCells.length;
      }

      // Clip path: left edge is where this block starts, right edge grows with progress
      // Format: inset(top right bottom left)
      // right = (1 - rightEdge) * 100% (how much to cut from right)
      // left = startX * 100% (how much to cut from left)
      const prevRight = ((1 - Math.min(prevRightEdge, blockEndX)) * 100).toFixed(1);
      const currRight = ((1 - Math.min(currentRightEdge, blockEndX)) * 100).toFixed(1);
      const left = (blockStartX * 100).toFixed(1);

      keyframes.push(
        { t: t1, style: `clip-path:inset(0 ${prevRight}% 0 ${left}%)` },
        { t: t2, style: `clip-path:inset(0 ${currRight}% 0 ${left}%)` },
      );
    });

    // Add final keyframe - this block is fully visible within its range
    const finalRight = ((1 - blockEndX) * 100).toFixed(1);
    const left = (blockStartX * 100).toFixed(1);
    keyframes.push({
      t: 1,
      style: `clip-path:inset(0 ${finalRight}% 0 ${left}%)`,
    });

    // Generate CSS animation and styles
    // CRITICAL: transform-origin must be 0 for all blocks to grow from left
    const cssStyle = progressBarMode === 'contribution'
      ? `.u.${blockId} { animation-name: ${animationName}; }`  // fill already set on element
      : `.u.${blockId} { fill: var(--c${block.color}); animation-name: ${animationName}; }`;

    styles.push(
      createKeyframeAnimation(animationName, keyframes),
      cssStyle,
    );

    cumulativeContribution += blockTotalContribution;
    cumulativeCellCount += blockCellCount;
    blockIndex++;
  }

  // ============================================================================
  // CONTRIBUTION COUNTER RENDERING
  // ============================================================================
  // This section handles the rendering of contribution counters (text + images)
  // that animate during the snake's movement.
  //
  // Main flow:
  // 1. Calculate total contributions
  // 2. For each display configuration:
  //    a. Set up text styling and positioning
  //    b. Build counter states (count/percentage at each time)
  //    c. Pre-load and define image assets
  //    d. Render text elements with image placeholders
  //    e. Create opacity animations for each frame
  // ============================================================================

  if (counterConfig?.enabled && counterConfig.displays) {
    // Calculate total contributions from map or fall back to cell count
    const totalContributions = counterConfig.contributionMap
      ? Array.from(counterConfig.contributionMap.values()).reduce((sum, count) => sum + count, 0)
      : sortedCells.length;

    // Process each display
    for (let displayIndex = 0; displayIndex < counterConfig.displays.length; displayIndex++) {
      const display = counterConfig.displays[displayIndex];
      const fontSize = display.fontSize || dotSize;

      // Use monospace font for accurate width calculation when using image placeholders
      // This ensures precise alignment between text and images
      const hasImagePlaceholders = display.prefix?.includes('{img:') ||
        display.suffix?.includes('{img:') ||
        display.text?.includes('{img:');
      const fontFamily = hasImagePlaceholders
        ? (display.fontFamily || "'Courier New', 'Consolas', monospace")
        : (display.fontFamily || 'Arial, sans-serif');

      const textColor = display.color || '#666';
      const fontWeight = display.fontWeight || 'normal';
      const fontStyle = display.fontStyle || 'normal';
      const position = display.position;

      // Calculate the actual line height needed (considering images)
      // This is used for layout spacing, not for text baseline positioning
      const lineHeight = calculateLineHeight(fontSize, display.images);

      // follow mode: same line as progress bar; others: above progress bar
      // Text baseline is positioned based on fontSize, not lineHeight
      // (lineHeight is only for calculating required vertical space in svg-builder.ts)
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
        // -----------------------------------------------------------------------
        // DYNAMIC COUNTER MODE - Animated count/percentage
        // -----------------------------------------------------------------------
        const prefix = display.prefix || '';
        const suffix = display.suffix || '';
        const showCount = display.showCount !== false; // Default true
        const showPercentage = display.showPercentage !== false; // Default true

        // --- Build Counter States ---
        // Track cumulative progress and generate keyframes for each snake position
        const { states: textElements, repeatedCellCount } = buildCounterStates(
          sortedCells,
          counterConfig,
          totalContributions,
          width,
          position,
          textOffsetX
        );

        // Track level distribution for debugging (contribution-level mode)
        const levelDistribution = new Map<number, number>();

        // Track animation state for smooth level transitions
        // For each image, track: previous level, cycle start index, absolute start time, and last cycle number
        // lastCycleNumber helps detect cycle completion even when frames are skipped
        const animationStates = new Map<number, {
          prevLevel: number;
          cycleStartIndex: number;
          cycleStartTime?: number;
          lastCycleNumber?: number;
        }>();

        // --- Pre-load Images and Create SVG Definitions ---
        // Calculate max contribution for level/speed calculations
        let maxContribution = 1;
        if (counterConfig.contributionMap) {
          maxContribution = Math.max(...Array.from(counterConfig.contributionMap.values()));
          if (counterConfig.debug) {
            console.log(`🎨 Contribution levels: max=${maxContribution}, map size=${counterConfig.contributionMap.size}`);
          }
        }

        // Pre-load all images and create SVG defs
        const { imageDataMap, imageDefsElements } = await preloadCounterImages(
          display,
          displayIndex,
          counterConfig,
          maxContribution
        );

        // Add image defs to svgElements (without <defs> wrapper - svg-builder will handle that)
        if (imageDefsElements.length > 0) {
          svgElements.push(...imageDefsElements);
        }

        // --- Render Counter Frames ---
        // Create text elements with position and opacity animations
        for (let index = 0; index < textElements.length; index++) {
          const elem = textElements[index];
          const textId = `contrib-text-${displayIndex}-${index}`;

          // Build display text based on showCount and showPercentage flags
          let displayText = prefix;
          if (showCount && showPercentage) {
            displayText += `${elem.count}(${elem.percentage}%)`;
          } else if (showCount) {
            displayText += `${elem.count}`;
          } else if (showPercentage) {
            displayText += `${elem.percentage}%`;
          }
          displayText += suffix;

          // Parse text for image placeholders
          const segments = parseTextWithPlaceholders(displayText);

          // Check if we have any image placeholders
          const hasImages = segments.some(seg => seg.type === 'image');

          if (!hasImages) {
            // Simple text without images - use original logic
            svgElements.push(
              createElement("text", {
                class: `contrib-counter ${textId}`,
                x: elem.x.toFixed(1),
                y: textY.toString(),
                ...textAttrs,
              }).replace("/>", `>${displayText}</text>`)
            );
          } else {
            // Mixed text and images - create group with text spans and image elements
            const groupId = `contrib-group-${displayIndex}-${index}`;

            // Calculate starting X position based on alignment
            let currentX: number;

            if (position === 'top-right') {
              // For right-aligned content, calculate total width first
              // then start from (elem.x - totalWidth) so the rightmost element ends at elem.x
              let totalWidth = 0;
              for (const segment of segments) {
                if (segment.type === 'text') {
                  totalWidth += estimateTextWidth(segment.content, fontSize, fontFamily);
                } else if (segment.type === 'image' && segment.imageIndex !== undefined) {
                  if (display.images && segment.imageIndex < display.images.length) {
                    totalWidth += display.images[segment.imageIndex].width;
                  }
                }
              }
              // Position so that the content ends at elem.x (right edge)
              currentX = elem.x - totalWidth;
            } else {
              // For left-aligned and follow mode, start from elem.x
              currentX = elem.x;
            }

            // Create a g (group) element to contain all segments
            const groupElements: string[] = [];

            // For mixed content, use text-anchor="start" and position manually
            // (We've already calculated the correct starting position above)
            const mixedTextAttrs = {
              ...textAttrs,
              "text-anchor": "start"  // Override to start for manual positioning
            };

            for (const segment of segments) {
              if (segment.type === 'text') {
                // Text segment - create text element
                const textWidth = estimateTextWidth(segment.content, fontSize, fontFamily);

                groupElements.push(
                  createElement("text", {
                    class: `contrib-counter ${textId}`,
                    x: currentX.toFixed(1),
                    y: textY.toString(),
                    ...mixedTextAttrs,
                  }).replace("/>", `>${segment.content}</text>`)
                );

                currentX += textWidth;
              } else if (segment.type === 'image' && segment.imageIndex !== undefined) {
                // Image segment - use <use> to reference predefined image in <defs>
                const imageIndex = segment.imageIndex;

                if (display.images && imageIndex < display.images.length) {
                  const imageConfig = display.images[imageIndex];
                  const levelMap = imageDataMap.get(imageIndex);

                  if (levelMap) {
                    // Determine which level and frame to display
                    let level = 0;
                    let frameIndex = 0;

                    const isContributionLevel = imageConfig.sprite?.mode === 'contribution-level';
                    const framesPerLevelValue = imageConfig.sprite?.framesPerLevel;
                    const totalFrames = (typeof framesPerLevelValue === 'number' ? framesPerLevelValue : 1);
                    const isMultiFrame = imageConfig.sprite && totalFrames > 1;
                    const isDynamicSpeed = isMultiFrame && imageConfig.sprite?.mode === 'sync' && imageConfig.sprite?.dynamicSpeed;

                    if (isContributionLevel) {
                      // Contribution-level mode: select level based on contribution value
                      const contributionLevels = imageConfig.sprite?.contributionLevels || 5;

                      // Calculate current level from contribution (includes repeated cells with contribution=0 → L0)
                      const currentLevel = getContributionLevel(elem.currentContribution, maxContribution, contributionLevels);

                      // DEBUG: Check Frame 100-110 to see why Frame 102 gets L0
                      if (counterConfig.debug && index >= 100 && index <= 110) {
                        console.log(`🔍 Frame ${index}: elem.currentContribution=${elem.currentContribution}, maxContribution=${maxContribution}, calculated currentLevel=L${currentLevel}`);
                      }

                      // Track level distribution
                      levelDistribution.set(currentLevel, (levelDistribution.get(currentLevel) || 0) + 1);

                      // Debug: log level distribution for first few frames and when contribution=0
                      if (counterConfig.debug && (index < 10 || (elem.currentContribution === 0 && index < 100))) {
                        console.log(`📊 Frame ${index}: contribution=${elem.currentContribution}, max=${maxContribution}, currentLevel=L${currentLevel}, time=${elem.time}`);
                        if (elem.currentContribution === 0) {
                          console.log(`   → L0 cell at frame ${index} (${index < 10 ? 'early' : 'later'} in animation)`);
                        }
                      }

                      // For animated levels, cycle through frames
                      const framesPerLevel = imageConfig.sprite?.framesPerLevel || 1;
                      const levelFrameCount = Array.isArray(framesPerLevel) ? framesPerLevel[currentLevel] : framesPerLevel;

                      if (counterConfig.debug && elem.currentContribution === 0 && index < 50) {
                        console.log(`  🔍 Frame ${index}: L0 cell detected - levelFrameCount=${levelFrameCount}, framesPerLevel=${JSON.stringify(framesPerLevel)}`);
                      }

                      if (levelFrameCount > 1) {
                        // Time-based animation using actual animation time
                        // CRITICAL: elem.time is normalized (0-1), duration is total animation time
                        // Sprite frame duration is fixed at 100ms per frame
                        const spriteFrameDuration = 100; // ms per sprite frame
                        const absoluteTime = elem.time * duration; // Current absolute time in ms

                        const imageKey = displayIndex * 1000 + imageIndex; // Unique key per image
                        let state = animationStates.get(imageKey);

                        if (!state) {
                          // Initialize state: start animation cycle at current position
                          // Store the absolute time when animation started
                          // lastCycleNumber set to -1 so first frame (cycle 0) triggers immediate switch
                          state = {
                            prevLevel: currentLevel,
                            cycleStartIndex: index,
                            cycleStartTime: absoluteTime,
                            lastCycleNumber: -1  // -1 allows first frame to switch immediately
                          };
                          animationStates.set(imageKey, state);

                          if (counterConfig.debug && index < 20) {
                            console.log(`  🆕 Frame ${index}: Init state for image ${imageKey}, currentLevel=L${currentLevel}, time=${absoluteTime.toFixed(0)}ms`);
                          }
                        }

                        // Get the frame count for the PREVIOUS level (currently playing)
                        const prevLevelFrameCount = Array.isArray(framesPerLevel)
                          ? framesPerLevel[state.prevLevel]
                          : framesPerLevel;

                        // Defensive: ensure prevLevelFrameCount is a positive finite number
                        const safePrevLevelFrameCount = Number.isFinite(prevLevelFrameCount) && prevLevelFrameCount > 0
                          ? prevLevelFrameCount
                          : 1;
                        if (safePrevLevelFrameCount !== prevLevelFrameCount && counterConfig?.debug) {
                          console.warn(`⚠️ Frame ${index}: invalid prevLevelFrameCount=${prevLevelFrameCount} for prevLevel=${state.prevLevel}, falling back to ${safePrevLevelFrameCount}`);
                        }

                        // Calculate elapsed SPRITE frames based on actual time difference
                        // This ensures each sprite frame plays for exactly 100ms regardless of counter frame intervals
                        // Round to avoid floating point precision issues (e.g., 99.9999 vs 100)
                        let elapsedTime = Math.round(absoluteTime - (state.cycleStartTime || 0));
                        let elapsedFrames = Math.floor(elapsedTime / spriteFrameDuration);

                        // Check if current animation cycle is complete by detecting cycle number change
                        // This handles frame skipping: if we jump from frame 7 to frame 9, we still detect completion
                        const currentCycleNumber = Math.floor(elapsedFrames / safePrevLevelFrameCount);
                        const lastCycleNumber = state.lastCycleNumber ?? -1; // Use -1 as default for first frame
                        const isCycleComplete = currentCycleNumber > lastCycleNumber;

                        if (counterConfig.debug && (index < 15 || (index >= 60 && index <= 62))) {
                          console.log(`  Frame ${index}: time=${elem.time.toFixed(6)}, absTime=${absoluteTime.toFixed(2)}ms, cycleStart=${(state.cycleStartTime || 0).toFixed(2)}ms`);
                          console.log(`    elapsedTime=${elapsedTime.toFixed(2)}ms, elapsedFrames=${elapsedFrames}, cycleNum=${currentCycleNumber}, lastCycleNum=${lastCycleNumber}, isCycleComplete=${isCycleComplete}`);
                          console.log(`    → currentLevel=L${currentLevel}, prevLevel=L${state.prevLevel}, contribution=${elem.currentContribution}`);
                        }

                        // Level selection logic (hybrid approach):
                        // - Transitions TO L0 (empty/repeated cells): immediate switch for quick feedback
                        // - Other level transitions (L1-L4): wait for cycle complete for smooth animation
                        // - Handles frame skipping: detects cycle completion even if frames are skipped

                        // Hybrid switching logic:
                        // - Immediate switch TO L0 for empty cells (quick feedback)
                        // - Wait for cycle completion for other level changes (smooth transitions)

                        // DEBUG: Log state before switching logic for Frame 46-52
                        if (counterConfig.debug && ((index >= 46 && index <= 52) || (index >= 127 && index <= 132))) {
                          console.log(`  🔍 Frame ${index} PRE-SWITCH: currentLevel=${currentLevel}, state.prevLevel=${state.prevLevel}, isCycleComplete=${isCycleComplete}, absoluteTime=${absoluteTime.toFixed(2)}ms, cycleStartTime=${state.cycleStartTime?.toFixed(2)}ms`);
                        }

                        if (currentLevel === 0 && state.prevLevel !== 0) {
                          // Immediate switch TO L0 (empty/repeated cell - needs quick feedback)
                          const oldLevel = state.prevLevel;
                          level = 0;
                          state.prevLevel = 0;
                          state.cycleStartIndex = index;
                          state.cycleStartTime = absoluteTime;
                          state.lastCycleNumber = 0; // Set to 0 (current cycle) to prevent immediate cycle completion

                          // CRITICAL FIX: Recalculate elapsedFrames with NEW cycleStartTime
                          // This ensures frame rendering starts from f0 immediately
                          elapsedTime = 0;
                          elapsedFrames = 0;

                          if (counterConfig.debug && index < 220) {
                            console.log(`  ⚡ Frame ${index}: Immediate switch TO L0 from L${oldLevel} (empty/repeated cell, cycleStartTime NOW=${absoluteTime.toFixed(2)}ms, lastCycleNumber=0, elapsedFrames RESET to 0)`);
                          }
                        } else if (currentLevel === 0 && state.prevLevel === 0 && isCycleComplete) {
                          // L0 cycle completed - reset for next L0 cycle
                          // This ensures repeated cells after moving on grid start fresh animation
                          level = 0;
                          state.cycleStartIndex = index;
                          state.cycleStartTime = absoluteTime;
                          state.lastCycleNumber = 0; // Reset to 0 for fresh cycle

                          // CRITICAL FIX: Recalculate elapsedFrames with NEW cycleStartTime
                          // This ensures animation restarts from f0 for next L0 sequence
                          elapsedTime = 0;
                          elapsedFrames = 0;

                          if (counterConfig.debug && (index < 10 || (index >= 46 && index <= 55) || (index >= 127 && index <= 132) || (index >= 190 && index <= 220))) {
                            console.log(`  🔄 Frame ${index}: L0 cycle complete, resetting (cycleStartTime NOW=${absoluteTime.toFixed(2)}ms, elapsedFrames RESET to 0)`);
                          }
                        } else if (currentLevel === 0 && state.prevLevel === 0) {
                          // Continuing L0 animation mid-cycle
                          level = 0;

                          if (counterConfig.debug && (index < 10 || (index >= 46 && index <= 55) || (index >= 127 && index <= 132) || (index >= 190 && index <= 220))) {
                            const elapsedTime = absoluteTime - (state.cycleStartTime || 0);
                            const elapsedFramesCalc = Math.floor(elapsedTime / spriteFrameDuration);
                            console.log(`  🎬 Frame ${index}: Continuing L0 mid-cycle (absTime=${absoluteTime.toFixed(2)}ms, cycleStart=${state.cycleStartTime?.toFixed(2)}ms, elapsed=${elapsedTime.toFixed(2)}ms, spriteDur=${spriteFrameDuration}, frames=${elapsedFramesCalc}, calc=${elapsedTime}/${spriteFrameDuration}=${elapsedTime/spriteFrameDuration})`);
                          }
                        } else if (isCycleComplete) {
                          // Cycle just completed - sample new level for next cycle
                          const oldLevel = state.prevLevel;
                          level = currentLevel;
                          state.prevLevel = currentLevel;

                          // CRITICAL: Only reset cycleStartTime on LEVEL CHANGE
                          // Same level should continue animation without restart!
                          if (oldLevel !== currentLevel) {
                            // Level changed - reset cycle start time and index
                            state.cycleStartIndex = index;
                            state.cycleStartTime = absoluteTime;
                            state.lastCycleNumber = 0; // Reset to 0 for new level's first cycle

                            // CRITICAL FIX: Reset elapsedFrames for new level
                            // This ensures animation starts from f0 when switching levels
                            elapsedTime = 0;
                            elapsedFrames = 0;
                          } else {
                            // Same level - just update cycle number, keep cycleStartTime!
                            state.lastCycleNumber = currentCycleNumber;
                          }

                          if (counterConfig.debug && ((index < 20 || currentLevel === 0 || oldLevel === 0 || oldLevel !== currentLevel) || (index >= 127 && index <= 132))) {
                            console.log(`  ⚡ Frame ${index}: Cycle complete (cycle ${currentCycleNumber}), ${oldLevel === currentLevel ? 'continuing' : 'switching from'} L${oldLevel} ${oldLevel === currentLevel ? '' : `to L${level}`} (contribution=${elem.currentContribution}, elapsedFrames=${elapsedFrames})`);
                            if (oldLevel !== currentLevel) {
                              console.log(`     → Level changed! cycleStartTime=${absoluteTime.toFixed(0)}ms, elapsedFrames RESET to 0`);
                            } else {
                              console.log(`     → Same level continuing! cycleStartTime kept at ${state.cycleStartTime?.toFixed(0)}ms`);
                            }
                          }
                        } else {
                          // Mid-cycle - use previous level (don't interrupt animation)
                          level = state.prevLevel;

                          if (counterConfig.debug && (((currentLevel === 0 || state.prevLevel === 0) && index < 50) || (index >= 127 && index <= 132))) {
                            console.log(`  🎯 Frame ${index}: Mid-cycle, using prevLevel=L${level} (currentLevel=L${currentLevel}, elapsedFrames=${elapsedFrames}/${safePrevLevelFrameCount})`);
                          }
                        }

                        // Calculate current frame within the animation cycle
                        // Use elapsed sprite frames (based on actual time) to determine frame index
                        const selectedLevelFrameCount = Array.isArray(framesPerLevel)
                          ? framesPerLevel[level]
                          : framesPerLevel;

                        // Defensive check: ensure selectedLevelFrameCount is a valid positive integer
                        if (!Number.isFinite(selectedLevelFrameCount) || selectedLevelFrameCount <= 0) {
                          // Invalid frame count - default to frame 0 and warn
                          frameIndex = 0;
                          if (counterConfig.debug) {
                            console.warn(`⚠️ Frame ${index}: Invalid selectedLevelFrameCount=${selectedLevelFrameCount} for level=${level}, defaulting to frameIndex=0`);
                          }
                        } else {
                          // Simply use elapsed time to determine frame
                          // ceil ensures consecutive frames always advance (even if < 100ms apart)
                          frameIndex = elapsedFrames % selectedLevelFrameCount;
                        }

                        if (counterConfig.debug && (elapsedFrames === 0 || (currentLevel === 0 && index < 50))) {
                          console.log(`    ✅ Frame ${index}: level=L${level}, elapsedFrames=${elapsedFrames}, frameIndex=${frameIndex}, contribution=${elem.currentContribution}`);
                        }
                      } else {
                        // Static image (1 frame) - use current level directly
                        level = currentLevel;
                        frameIndex = 0; // Static image always uses frame 0
                      }
                    } else if (isDynamicSpeed) {
                      // Dynamic speed mode: animation speed based on contribution level
                      // Level 0: speed = 1 (normal animation, same as L1)
                      // Level 1: speed = 1 (normal, 8 steps for 8 frames)
                      // Level 2: speed = 2 (2x, 4 steps for 8 frames)
                      // Level 3: speed = 4 (4x, 2 steps for 8 frames)
                      // Level N: speed = 2^(N-1)
                      const contributionLevels = imageConfig.sprite?.contributionLevels || 5;
                      const currentLevel = getContributionLevel(elem.currentContribution, maxContribution, contributionLevels);

                      // L0 also animates! Use speed factor based on level
                      const speedFactor = currentLevel === 0 ? 1 : Math.pow(2, currentLevel - 1);
                      frameIndex = Math.floor((index * speedFactor) % totalFrames);
                    } else if (isMultiFrame && imageConfig.sprite?.mode === 'sync') {
                      // Sequential sync mode: cycle through frames with fixed speed
                      const animSpeed = imageConfig.sprite?.animationSpeed ?? 1;
                      frameIndex = Math.floor((index * animSpeed) % totalFrames);
                    }
                    // For static images or loop mode, level=0, frameIndex=0

                    const frameMap = levelMap.get(level);
                    let defId = frameMap?.get(frameIndex);

                    // Fallback: if frameIndex doesn't exist for this level, try frame 0
                    if (!defId && frameIndex !== 0) {
                      defId = frameMap?.get(0);
                      if (counterConfig.debug && defId) {
                        console.warn(`⚠️ Frame ${index}: frameIndex=${frameIndex} not found for level=${level}, falling back to frame 0`);
                      }
                    }

                    // Debug: log symbol ID for first few frames
                    if (counterConfig.debug && index < 10 && isContributionLevel) {
                      console.log(`  → Using symbol: ${defId} (level=${level}, frameIndex=${frameIndex})`);
                    }

                    if (defId) {
                      // Calculate image position based on anchor
                      const anchorX = imageConfig.anchorX || 0;
                      const anchorY = imageConfig.anchorY || 0.5; // default middle
                      const textAnchorY = imageConfig.textAnchorY ?? 0.5; // default text center

                      // Text uses dominant-baseline="middle", so textY is at text's vertical center
                      // textAnchorY determines which point of the text to use as reference:
                      // - 0.0: top of text (textY - fontSize*0.5)
                      // - 0.5: center of text (textY) - default
                      // - 1.0: baseline/bottom of text (textY + fontSize*0.5)
                      const textReferenceY = textY + (textAnchorY - 0.5) * fontSize;

                      // Calculate image Y position: reference point - (image height * anchor ratio)
                      // Example: textAnchorY=1.0, anchorY=1.0 → image bottom aligns with text baseline
                      const imgX = currentX - (imageConfig.width * anchorX);
                      const imgY = textReferenceY - (imageConfig.height * anchorY);

                      // Calculate image's actual right edge
                      const imgRightEdge = imgX + imageConfig.width;

                      // Use <use> element to reference the image definition
                      // This avoids duplicating the large data URI in every frame
                      // width/height control the final display size (may differ from sprite frame size)
                      groupElements.push(
                        createElement("use", {
                          class: `contrib-image ${textId}`,
                          href: `#${defId}`,
                          x: imgX.toFixed(1),
                          y: imgY.toFixed(1),
                          width: imageConfig.width.toString(),
                          height: imageConfig.height.toString(),
                        })
                      );

                      // Update currentX to image's right edge plus spacing
                      // This makes spacing represent the actual visual gap between image and next element
                      const spacing = imageConfig.spacing ?? 0;
                      currentX = imgRightEdge + spacing;
                    } else {
                      // Symbol not found - log error to help debug missing sprite frames
                      if (counterConfig.debug) {
                        console.error(`❌ Frame ${index}: Symbol not found for level=${level}, frameIndex=${frameIndex}. Check if L${level} frames are properly loaded.`);
                      }
                    }
                  }
                }
              }
            }

            // Add all group elements with shared animation class
            groupElements.forEach(elem => {
              svgElements.push(elem);
            });
          }

          // Log level distribution for contribution-level mode
          if (counterConfig.debug && levelDistribution.size > 0) {
            console.log(`📊 Level distribution across ${textElements.length} frames:`);
            for (let i = 0; i < 5; i++) {
              const count = levelDistribution.get(i) || 0;
              const percentage = ((count / textElements.length) * 100).toFixed(1);
              console.log(`  Level ${i}: ${count} frames (${percentage}%)`);
            }
          }

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

          // Calculate total number of discrete steps for step-based animation
          // This prevents CSS from interpolating opacity between keyframes
          const totalSteps = textElements.length;

          styles.push(
            createKeyframeAnimation(animName, keyframes),
            `.${textId} {
              animation: ${animName} steps(${totalSteps}, jump-none) ${duration}ms infinite;
              opacity: 0;
            }`
          );
        } // End for loop
      } // End if (display.text) else
    } // End displays loop
  } // End if (counterConfig?.enabled)

  // REFACTOR: Removed gradient prepending - no longer needed (Goal 3)
  // if (progressBarMode === 'contribution' && gradientDefs.length > 0) {
  //   svgElements.unshift(...gradientDefs);
  // }

  return { svgElements, styles: styles.join('\n') };
};

/**
 * Helper function to generate frame URLs from folder path and pattern.
 * This is used when the user provides multiple separate image files instead of a sprite sheet.
 *
 * @param urlFolder - Folder path containing the frame images
 * @param framePattern - Pattern for frame filenames (default: 'frame-{n}.png')
 * @param frameCount - Number of frames to generate URLs for
 * @returns Array of URLs for each frame
 *
 * @example
 * ```typescript
 * // Default pattern
 * const urls = generateFrameUrls('images/character', undefined, 5);
 * // Returns: ['images/character/frame-0.png', 'images/character/frame-1.png', ...]
 *
 * // Custom pattern
 * const urls = generateFrameUrls('assets/sprite', 'img_{n}.gif', 3);
 * // Returns: ['assets/sprite/img_0.gif', 'assets/sprite/img_1.gif', 'assets/sprite/img_2.gif']
 * ```
 */
export const generateFrameUrls = (
  urlFolder: string,
  framePattern: string = 'frame-{n}.png',
  frameCount: number
): string[] => {
  const urls: string[] = [];

  // Normalize folder path (remove trailing slash if present)
  const normalizedFolder = urlFolder.replace(/\/$/, '');

  for (let i = 0; i < frameCount; i++) {
    // Replace {n} placeholder with frame number
    const filename = framePattern.replace('{n}', i.toString());
    const url = `${normalizedFolder}/${filename}`;
    urls.push(url);
  }

  return urls;
};

/**
 * Calculate contribution level (0-4) based on contribution value.
 * Maps contribution values to 5 sprite levels (L0-L4).
 *
 * Level distribution:
 * - L0: Empty cells only (contribution = 0)
 * - L1: Lowest non-zero contributions (1 to ~25% of max)
 * - L2: Low contributions (~25% to ~50% of max)
 * - L3: Medium contributions (~50% to ~75% of max)
 * - L4: High contributions (~75% to 100% of max)
 *
 * Note: Snake only eats cells with contributions ≥ 0. Cells with contribution=0
 * (empty cells) are included in the animation path but use L0 sprite.
 *
 * @param contribution - Contribution count for a cell
 * @param maxContribution - Maximum contribution value in the dataset
 * @param levels - Number of levels (default: 5)
 * @returns Level index (0 = empty, 1-4 = low to high contributions)
 */
export const getContributionLevel = (
  contribution: number,
  maxContribution: number,
  levels: number = 5
): number => {
  // Edge case: no contribution → L0 (empty cell sprite)
  if (contribution === 0 || maxContribution === 0) return 0;

  // Map all positive contributions (1 to max) to levels 1-4
  // Use Math.ceil to ensure contribution=1 maps to L1 (not L0)
  // This distributes non-zero contributions across L1-L4 evenly
  const normalizedValue = contribution / maxContribution;
  const level = Math.ceil(normalizedValue * (levels - 1));

  // Clamp to valid range [0, levels-1]
  return Math.max(0, Math.min(levels - 1, level));
};

/**
 * Generate frame URL with Lx placeholder replacement.
 *
 * @param urlFolder - Base folder path
 * @param framePattern - Pattern with {n} and/or Lx placeholders
 * @param level - Contribution level (0-4)
 * @param frameIndex - Frame number within the level
 * @returns Full URL path
 */
export const generateLevelFrameUrl = (
  urlFolder: string,
  framePattern: string,
  level: number,
  frameIndex: number
): string => {
  const normalizedFolder = urlFolder.replace(/\/$/, '');

  // Replace Lx with actual level number
  let filename = framePattern.replace(/Lx/g, `L${level}`);

  // Replace {n} with frame number
  filename = filename.replace('{n}', frameIndex.toString());

  return `${normalizedFolder}/${filename}`;
};

/**
 * Validates that a CounterImageConfig has either url or urlFolder set.
 *
 * @param config - Image configuration to validate
 * @returns True if valid, false otherwise
 */
export const validateImageConfig = (config: CounterImageConfig): boolean => {
  // Must have either url or urlFolder
  if (!config.url && !config.urlFolder) {
    console.error('CounterImageConfig must have either "url" or "urlFolder" set');
    return false;
  }

  // Cannot have both url and urlFolder
  if (config.url && config.urlFolder) {
    console.error('CounterImageConfig cannot have both "url" and "urlFolder" set');
    return false;
  }

  // Note: framesPerLevel defaults to 1 (static image) if omitted, so no validation needed
  // The code at line 747 handles: framesPerLevel = imageConfig.sprite?.framesPerLevel || 1

  return true;
};

/**
 * Resolves the image configuration to determine what mode is being used
 * and returns the appropriate rendering information.
 *
 * @param config - Image configuration
 * @returns Object containing mode and relevant data
 */
export const resolveImageMode = (config: CounterImageConfig): {
  mode: 'single' | 'sprite-sheet' | 'multi-file';
  frameUrls?: string[];
  spriteUrl?: string;
} => {
  if (!validateImageConfig(config)) {
    throw new Error('Invalid CounterImageConfig');
  }

  // Multi-file mode: separate images in a folder
  if (config.urlFolder) {
    const framesPerLevelValue = config.sprite?.framesPerLevel;
    const frameCount = (typeof framesPerLevelValue === 'number' ? framesPerLevelValue : 1);
    const framePattern = config.framePattern || 'frame-{n}.png';
    const frameUrls = generateFrameUrls(config.urlFolder, framePattern, frameCount);

    return {
      mode: 'multi-file',
      frameUrls,
    };
  }

  // Sprite sheet or single image mode
  const framesPerLevelValue = config.sprite?.framesPerLevel;
  const totalFrames = (typeof framesPerLevelValue === 'number' ? framesPerLevelValue : 1);

  if (config.sprite && totalFrames > 1) {
    return {
      mode: 'sprite-sheet',
      spriteUrl: config.url!,
    };
  }

  // Single static image
  return {
    mode: 'single',
    spriteUrl: config.url!,
  };
};

/**
 * Checks if a URL is an external HTTP/HTTPS URL
 *
 * @param url - URL to check
 * @returns True if it's an external URL, false if it's a local file path
 */
export const isExternalUrl = (url: string): boolean => {
  return url.startsWith('http://') || url.startsWith('https://');
};

/**
 * Text segment type for placeholder parsing
 */
interface TextSegment {
  type: 'text' | 'image';
  content: string;      // Text content or image index as string
  imageIndex?: number;  // Parsed image index for type='image'
}

/**
 * Parse text containing {img:N} placeholders into segments
 *
 * @param text - Text with optional {img:0}, {img:1}, etc. placeholders
 * @returns Array of text and image segments in order
 *
 * @example
 * ```typescript
 * parseTextWithPlaceholders("Total: {img:0} 123 {img:1}")
 * // Returns: [
 * //   { type: 'text', content: 'Total: ' },
 * //   { type: 'image', content: '{img:0}', imageIndex: 0 },
 * //   { type: 'text', content: ' 123 ' },
 * //   { type: 'image', content: '{img:1}', imageIndex: 1 }
 * // ]
 * ```
 */
const parseTextWithPlaceholders = (text: string): TextSegment[] => {
  const segments: TextSegment[] = [];
  const placeholderRegex = /\{img:(\d+)\}/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = placeholderRegex.exec(text)) !== null) {
    // Add text before placeholder
    if (match.index > lastIndex) {
      const textContent = text.substring(lastIndex, match.index);
      if (textContent) {
        segments.push({ type: 'text', content: textContent });
      }
    }

    // Add image placeholder
    const imageIndex = parseInt(match[1], 10);
    segments.push({
      type: 'image',
      content: match[0],
      imageIndex
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last placeholder
  if (lastIndex < text.length) {
    const textContent = text.substring(lastIndex);
    if (textContent) {
      segments.push({ type: 'text', content: textContent });
    }
  }

  // If no placeholders found, return text as single segment
  if (segments.length === 0 && text) {
    segments.push({ type: 'text', content: text });
  }

  return segments;
};

/**
 * Known monospace font families for accurate width estimation
 */
const MONOSPACE_FONTS = [
  'courier',
  'courier new',
  'consolas',
  'monospace',
  'monaco',
  'menlo',
  'source code pro',
  'lucida console',
  'andale mono',
  'bitstream vera sans mono',
  'dejavu sans mono',
  'liberation mono',
  'inconsolata',
  'fira code',
  'fira mono',
  'roboto mono',
  'ubuntu mono',
  'jetbrains mono',
  'cascadia code',
  'cascadia mono',
  'sf mono',
  'ibm plex mono'
];

/**
 * Check if a font family string contains monospace fonts
 *
 * @param fontFamily - Font family string (may contain multiple fonts separated by commas)
 * @returns true if any font in the family is monospace
 */
const isMonospaceFont = (fontFamily: string): boolean => {
  // Normalize the font family string
  const normalized = fontFamily.toLowerCase().trim();

  // Split by comma to handle fallback fonts
  const fonts = normalized.split(',').map(f => f.trim().replace(/['"]/g, ''));

  // Check if any font matches our known monospace list
  return fonts.some(font =>
    MONOSPACE_FONTS.some(mono => font.includes(mono) || mono.includes(font))
  );
};

/**
 * Estimate text width based on character count and font size
 * This is a rough estimation for layout purposes
 *
 * @param text - Text to measure
 * @param fontSize - Font size in pixels
 * @param fontFamily - Font family string to detect monospace fonts
 * @returns Estimated width in pixels
 */
const estimateTextWidth = (text: string, fontSize: number, fontFamily: string): number => {
  // Check if monospace font is being used
  const isMonospace = isMonospaceFont(fontFamily);

  // Monospace fonts: ~0.6x fontSize per character (accurate)
  // Proportional fonts: ~0.5x fontSize average (less accurate)
  const charWidthRatio = isMonospace ? 0.6 : 0.5;
  return text.length * fontSize * charWidthRatio;
};

/**
 * Calculate the required line height for a display with text and images
 *
 * @param fontSize - Font size in pixels
 * @param images - Array of image configurations (optional)
 * @returns Maximum height needed for this line in pixels
 */
const calculateLineHeight = (fontSize: number, images?: CounterImageConfig[]): number => {
  // Start with font size as base height
  let maxHeight = fontSize;

  // Check if any images would be taller
  if (images && images.length > 0) {
    for (const img of images) {
      // Calculate how much vertical space the image needs
      // considering its anchor point
      const anchorY = img.anchorY || 0.5;

      // Image extends from (textY - height * anchorY) to (textY + height * (1 - anchorY))
      // So the total height impact is the max of these two components
      const heightAboveBaseline = img.height * anchorY;
      const heightBelowBaseline = img.height * (1 - anchorY);

      maxHeight = Math.max(maxHeight, heightAboveBaseline + heightBelowBaseline);
    }
  }

  return maxHeight;
};

/**
 * Converts a local image file to a data URI for embedding in SVG
 * This function is used in GitHub Actions to read image files from the user's repository
 * and embed them directly into the SVG output.
 *
 * @param filePath - Path to the local image file (relative to workspace root)
 * @returns Data URI string (e.g., 'data:image/png;base64,...') or null if file not found
 *
 * @example
 * ```typescript
 * const dataUri = await loadImageAsDataUri('.github/assets/tree.png');
 * // Returns: 'data:image/png;base64,iVBORw0KGgoAAAA...'
 * ```
 */
export const loadImageAsDataUri = async (filePath: string): Promise<string | null> => {
  try {
    // Dynamic import to avoid bundling issues
    const fs = await import('fs');
    const path = await import('path');

    // Get workspace root (GitHub Actions sets GITHUB_WORKSPACE, fallback to cwd)
    const workspaceRoot = process.env.GITHUB_WORKSPACE || process.cwd();
    const resolvedWorkspaceRoot = path.resolve(workspaceRoot);

    // Resolve absolute path
    const absolutePath = path.resolve(filePath);

    // Security: Validate path is within workspace (prevent path traversal attacks)
    // This prevents malicious configurations from reading files outside the workspace
    // (e.g., "../../etc/passwd" or "../../.env")
    if (!absolutePath.startsWith(resolvedWorkspaceRoot + path.sep) && absolutePath !== resolvedWorkspaceRoot) {
      console.error(`⚠️  Security: Path traversal detected!`);
      console.error(`   Requested: ${filePath}`);
      console.error(`   Resolved:  ${absolutePath}`);
      console.error(`   Workspace: ${resolvedWorkspaceRoot}`);
      console.error(`   Access denied - path is outside workspace directory`);
      return null;
    }

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      console.error(`Image file not found: ${filePath}`);
      return null;
    }

    // Read file as buffer
    const imageBuffer = fs.readFileSync(absolutePath);

    // Detect MIME type from file extension
    const ext = path.extname(filePath).toLowerCase();
    let mimeType = 'image/png'; // default

    switch (ext) {
      case '.png':
        mimeType = 'image/png';
        break;
      case '.jpg':
      case '.jpeg':
        mimeType = 'image/jpeg';
        break;
      case '.gif':
        mimeType = 'image/gif';
        break;
      case '.webp':
        mimeType = 'image/webp';
        break;
      case '.svg':
        mimeType = 'image/svg+xml';
        break;
      default:
        mimeType = 'image/png';
    }

    // Convert to base64
    const base64 = imageBuffer.toString('base64');

    // Return data URI
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error(`Error loading image ${filePath}:`, error);
    return null;
  }
};

/**
 * Resolves an image URL to either use as-is (external URL) or convert to data URI (local file)
 *
 * @param url - Image URL or local file path
 * @returns Resolved URL (original if external, data URI if local file)
 *
 * @example
 * ```typescript
 * // External URL - returns as-is
 * const url1 = await resolveImageUrl('https://example.com/image.png');
 * // Returns: 'https://example.com/image.png'
 *
 * // Local file - converts to data URI
 * const url2 = await resolveImageUrl('.github/assets/tree.png');
 * // Returns: 'data:image/png;base64,iVBORw0KGgoAAAA...'
 * ```
 */
export const resolveImageUrl = async (url: string): Promise<string> => {
  // If it's an external URL, use it directly
  if (isExternalUrl(url)) {
    return url;
  }

  // Otherwise, load local file and convert to data URI
  const dataUri = await loadImageAsDataUri(url);

  // If conversion failed, return original URL (will likely fail to load, but that's expected)
  return dataUri || url;
};

