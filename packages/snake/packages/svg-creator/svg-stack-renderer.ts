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
 * Get a better random number (0-1) using crypto if available, falls back to Math.random()
 * Bun has built-in crypto support, providing better randomness than Math.random()
 */
function getSecureRandom(): number {
  try {
    // Try to use crypto.getRandomValues if available (Bun, Node.js 15+)
    if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
      const uint32 = new Uint32Array(1);
      globalThis.crypto.getRandomValues(uint32);
      return uint32[0] / 0x100000000; // 32-bit random to [0,1)
    }
  } catch (e) {
    // Fall through to Math.random()
  }

  // Fallback to Math.random() if crypto not available
  return Math.random();
}

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
 * Validates that a path is within the workspace using path.relative.
 * This is more robust across platforms than string prefix checks.
 *
 * @param pathModule - Path module (from import('path'))
 * @param resolvedWorkspaceRoot - Absolute path to workspace root (already resolved)
 * @param absolutePath - Absolute path to validate
 * @returns true if path is within workspace, false if outside (potential traversal)
 *
 * @example
 * ```typescript
 * const path = await import('path');
 * const isValid = isPathWithinWorkspace(path, '/home/user/workspace', '/home/user/workspace/assets/image.png');
 * // Returns: true
 *
 * const isInvalid = isPathWithinWorkspace(path, '/home/user/workspace', '/etc/passwd');
 * // Returns: false
 * ```
 */
const isPathWithinWorkspace = (
  pathModule: any,
  resolvedWorkspaceRoot: string,
  absolutePath: string
): boolean => {
  // Compute relative path from workspace root to the given path
  const relativePath = pathModule.relative(resolvedWorkspaceRoot, absolutePath);

  // Path is outside workspace if:
  // 1. Relative path starts with '..' (goes up directories)
  // 2. Relative path is absolute (Windows: starts with drive letter, Unix: starts with /)
  if (relativePath.startsWith('..') || pathModule.isAbsolute(relativePath)) {
    return false;
  }

  return true;
};

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
 * Type guard: returns true when a cell has numeric x and y coordinates.
 * Use this to centralize coordinate validation and avoid repeating the
 * "typeof cell.x === 'number' && typeof cell.y === 'number'" check.
 */
export const hasValidCoordinates = (cell: { x?: number; y?: number }): cell is { x: number; y: number } => {
  return typeof cell.x === 'number' && typeof cell.y === 'number' && !isNaN(cell.x) && !isNaN(cell.y);
};

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
 *
 * Position modes:
 * - top-left: Counter at top-left corner of progress bar (fixed position)
 * - top-right: Counter at top-right corner, follows progress bar growth
 * - bottom-left: Counter at bottom-left corner of progress bar (fixed position)
 * - bottom-right: Counter at bottom-right corner, follows progress bar growth
 * - follow: Counter follows the progress bar head (right side of filled portion)
 * - free: Counter moves uniformly from left to right, independent of progress bar
 */
export type CounterPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'follow' | 'free';

/**
 * Image configuration for counter display.
 *
 * Supports multiple modes:
 * 1. Single static image: Just provide `url`
 * 2. Sprite sheet: Provide `url` and `sprite` config
 * 3. Multiple separate images: Provide `urlFolder` with framePattern
 * 4. Level-based images: Use `L{n}` placeholder in framePattern
 *    - `L{n}.png` - Each level uses separate image (n will be replaced with level 0-4)
 *    - `L{n}-{n}.png` - Each level has animated frames (first {n}=level, second {n}=frame number)
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
   * Example: 'images/character' with framePattern 'L{n}-{n}.png' will look for:
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
   *   - L{n} - Contribution level (n will be replaced with 0-4)
   *
   * Examples:
   *   - 'frame-{n}.png' -> frame-0.png, frame-1.png, ...
   *   - 'L{n}-{n}.png' -> L0-0.png, L0-1.png, L1-0.png, L1-1.png, ...
   *   - 'L{n}.png' -> L0.png, L1.png, L2.png, L3.png, L4.png (static per level)
   *   - 'level-{n}-frame-{n}.gif' -> level-0-frame-0.gif, level-1-frame-0.gif, ...
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
     * - For level mode: frames per level (or array for different counts per level)
     *
     * Examples:
     * - `framesPerLevel: 8` with mode 'sync' → 8 frames cycling (run-0.png ~ run-7.png)
     * - `framesPerLevel: 8` with mode 'level' → 8 frames per level (L0.png, L1.png, ...)
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
     * Number of contribution levels (default: 5, matching GitHub's contribution grid)
     * Used when display mode is 'level'
     */
    contributionLevels?: number;
    /**
     * Use sprite sheet per contribution level instead of separate frame files
     * When true with level mode:
     *   - Files: L0.png, L1.png, L2.png, L3.png, L4.png (each is a sprite sheet)
     *   - Each sprite sheet contains frames specified by framesPerLevel
     *   - frameWidth and frameHeight define the dimensions of each frame in the sprite
     *
     * Default: false (uses separate files L{n}-{n}.png)
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
     * Note: Only used when display mode is 'sync', not 'level'
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
     * Loop speed multiplier (for loop mode only)
     * Controls how many frames advance per animation step
     *
     * When true or > 0: Index-based cycling (no frame skipping, smooth playback)
     * - loopSpeed: 1.0 -> 1 frame per step (smooth, all frames shown)
     * - loopSpeed: 2.0 -> 2 frames per step (faster)
     * - loopSpeed: 0.5 -> 1 frame per 2 steps (slower)
     *
     * When false or undefined: Time-based cycling (uses fps, may skip frames)
     *
     * Default: undefined (uses time-based fps)
     */
    loopSpeed?: number | boolean;
    /**
     * Animation duration in milliseconds (for loop mode only, time-based)
     * Only used when loopSpeed is not set
     * Default: same as progress bar duration
     */
    duration?: number;
    /**
     * Frames per second (for loop mode only, time-based)
     * Only used when loopSpeed is not set
     * If both fps and duration are set, fps takes precedence
     * Default: 8
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
   * Animation mode for all images in this display:
   * - 'sync': Frame changes synchronized with progress bar steps
   * - 'loop': Independent looping animation (continuous)
   * - 'level': Frame changes based on contribution level (0-4)
   * Default: 'sync'
   */
  mode?: 'sync' | 'loop' | 'level';
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
  /**
   * Force animations to play regardless of user's prefers-reduced-motion setting
   *
   * ⚠️ ACCESSIBILITY WARNING:
   * When true, animations will play even for users who have enabled "reduce motion"
   * in their OS/browser settings. This overrides an important accessibility preference.
   *
   * Use cases for enabling:
   * - Static images (e.g., GitHub README badges) where animation is the core feature
   * - Decorative content where motion reduction doesn't apply
   *
   * Recommendation: Keep this false (default) to respect user preferences.
   * Only enable if you have a specific, justified reason.
   *
   * Default: false
   */
  forceAnimations?: boolean;
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
 * @param sortedCells - Cells sorted by animation time (for sprite frames, includes L0)
 * @param counterConfig - Counter configuration with contribution map
 * @param totalContributions - Total contribution count
 * @param width - Progress bar width (for position calculation)
 * @param position - Counter position mode ('top-left', 'top-right', 'bottom-left', 'bottom-right', 'follow', 'free')
 * @param textOffsetX - Horizontal offset for follow mode
 * @param progressBarCells - Optional: cells used for progress bar (for X position calculation)
 * @returns Array of counter states and repeated cell count
 */
function buildCounterStates(
  sortedCells: Array<{ x?: number; y?: number; t: number }>,
  counterConfig: ContributionCounterConfig,
  totalContributions: number,
  width: number,
  position: CounterPosition,
  textOffsetX: number,
  progressBarCells?: Array<{ x?: number; y?: number; t: number | null }>
): { states: CounterState[]; repeatedCellCount: number } {
  const states: CounterState[] = [];
  let cumulativeCount = 0;
  let cumulativeWidth = 0;

  // Track when each cell is first eaten (by coordinates)
  const firstEatenTime = new Map<string, number>();
  let repeatedCellCount = 0;

  // Use progressBarCells for X position if provided, otherwise use sortedCells
  // This allows sprite animation to use full chain (with L0) while X position follows progress bar
  const cellsForXPosition = progressBarCells || sortedCells;

  // Build a map of time -> index for quick lookup in cellsForXPosition
  const timeToProgressIndex = new Map<number, number>();
  cellsForXPosition.forEach((cell, index) => {
    if (cell.t !== null) {
      // Use rounded time as key to avoid float precision issues
      const roundedT = Math.round(cell.t * 10000) / 10000;
      timeToProgressIndex.set(roundedT, index);
    }
  });

  // Initial state
  states.push({
    count: 0,
    percentage: '0.0',
    time: 0,
    x: (position === 'top-left' || position === 'bottom-left') ? 0 :
       (position === 'top-right' || position === 'bottom-right') ? width :
       (position === 'free') ? 0 : 0, // free mode starts at left
    currentContribution: 0
  });

  sortedCells.forEach((cell, index) => {
    // Get contribution count for this cell using its coordinates
    let count = 0; // Default to 0 for empty cells (no contribution)
    let isRepeatedCell = false; // Track if this is a repeated cell visit
    if (counterConfig.contributionMap && hasValidCoordinates(cell)) {
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

    // Calculate cumulative width using uniform mode (each cell contributes equally)
    // CRITICAL: Use cellsForXPosition (progress bar cells) for X calculation
    // This ensures sprite X position matches progress bar position even when sprite uses full chain
  const progressIndex = timeToProgressIndex.get(Math.round(cell.t * 10000) / 10000);

    // Uniform mode: each cell in progress bar contributes equally to width
    // If cell is not in progress bar (e.g., L0 in uniform mode), keep last known position
    if (progressIndex !== undefined) {
      cumulativeWidth = width * ((progressIndex + 1) / cellsForXPosition.length);
    }

    const percentage = ((cumulativeCount / totalContributions) * 100).toFixed(1);

    let x: number;
    if (position === 'top-left' || position === 'bottom-left') {
      x = 0;
    } else if (position === 'top-right' || position === 'bottom-right') {
      // Clamp x to width to prevent text overflow when using text-anchor="end"
      x = Math.min(cumulativeWidth, width);
    } else if (position === 'free') {
      // Free mode: move uniformly from left (0) to right (width) based on time
      // time is normalized (0-1), so x = time * width
      x = cell.t * width;
    } else {
      // follow mode
      x = cumulativeWidth + textOffsetX;
    }

    states.push({
      count: cumulativeCount,
      percentage,
      time: cell.t,
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
 * Renders the progress bar with colored blocks.
 * Each block represents a sequence of cells with the same color.
 *
 * @param sortedCells - Array of cells sorted by animation time
 * @param dotSize - Height of the progress bar
 * @param width - Total width of the progress bar
 * @param y - Y position of the progress bar
 * @param duration - Animation duration in milliseconds
 * @param counterConfig - Optional counter configuration (for contribution map)
 * @param isHidden - Whether the progress bar should be hidden (opacity: 0)
 * @returns SVG elements and CSS styles for the progress bar
 */
function renderProgressBar(
  sortedCells: Array<{ t: number; color: Color; x?: number; y?: number }>,
  dotSize: number,
  width: number,
  y: number,
  duration: number,
  counterConfig?: ContributionCounterConfig,
  isHidden: boolean = false
): { svgElements: string[]; styles: string[] } {
  const svgElements: string[] = [];
  const styles: string[] = [];

  if (sortedCells.length === 0) {
    return { svgElements, styles };
  }

  // Build cell data with contributions
  const cellsWithContributions = sortedCells.map(cell => {
    let contribution = 1;
    if (counterConfig?.contributionMap && hasValidCoordinates(cell)) {
      const key = `${cell.x},${cell.y}`;
      contribution = counterConfig.contributionMap.get(key) ?? 0;
    }

    return {
      time: cell.t,
      color: cell.color,
      contribution,
    };
  });

  // Group blocks by color
  interface ProgressBlock {
    color: Color;
    times: number[];
    contributions: number[];
  }

  const blocks: ProgressBlock[] = [];
  const cellsToShow = cellsWithContributions;

  for (const cell of cellsToShow) {
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

  // Render each block
  let blockIndex = 0;
  let cumulativeCellCount = 0;

  for (const block of blocks) {
    const blockCellCount = block.times.length;

    // Generate unique ID for this block
    const blockId = "u" + blockIndex.toString(36);
    const animationName = blockId;

    // Use solid block color (CSS variable)
    const fillAttr = `var(--c${block.color})`;

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

    // Create animation keyframes
    const blockStartX = cumulativeCellCount / sortedCells.length;
    const blockEndX = (cumulativeCellCount + blockCellCount) / sortedCells.length;

    const keyframes: AnimationKeyframe[] = [];
    let blockCumulativeCellCount = 0;

    // Initial state - block starts completely hidden
    const leftClip = (blockStartX * 100).toFixed(1);
    keyframes.push({
      t: 0,
      style: `clip-path:inset(0 100% 0 ${leftClip}%)`,
    });

    block.times.forEach((t, i) => {
      const prevCellCount = blockCumulativeCellCount;
      blockCumulativeCellCount += 1;

      const t1 = Math.max(0, t - 0.0001);
      const t2 = Math.min(1, t + 0.0001);

      // Calculate current right edge of the visible progress
      const currentTotalCells = cumulativeCellCount + blockCumulativeCellCount;
      const currentRightEdge = currentTotalCells / sortedCells.length;

      const prevTotalCells = cumulativeCellCount + prevCellCount;
      const prevRightEdge = prevTotalCells / sortedCells.length;

      // Clip path: left edge is where this block starts, right edge grows with progress
      const prevRight = ((1 - Math.min(prevRightEdge, blockEndX)) * 100).toFixed(1);
      const currRight = ((1 - Math.min(currentRightEdge, blockEndX)) * 100).toFixed(1);

      keyframes.push(
        { t: t1, style: `clip-path:inset(0 ${prevRight}% 0 ${leftClip}%)` },
        { t: t2, style: `clip-path:inset(0 ${currRight}% 0 ${leftClip}%)` },
      );
    });

    // Add final keyframe - this block is fully visible within its range
    const finalRight = ((1 - blockEndX) * 100).toFixed(1);
    keyframes.push({
      t: 1,
      style: `clip-path:inset(0 ${finalRight}% 0 ${leftClip}%)`,
    });

    // Generate CSS animation and styles
    const cssStyle = `.u.${blockId} { fill: var(--c${block.color}); animation-name: ${animationName}; }`;

    styles.push(
      createKeyframeAnimation(animationName, keyframes),
      cssStyle,
    );

    cumulativeCellCount += blockCellCount;
    blockIndex++;
  }

  return { svgElements, styles };
}

/**
 * Pre-load counter images and create SVG definitions.
 * This optimizes file size by defining images once in <defs> and referencing them.
 *
 * @param display - Display configuration with image settings
 * @param displayIndex - Index of this display (for unique IDs)
 * @param counterConfig - Counter configuration (for debug logging)
 * @param maxContribution - Maximum contribution value (for level calculation)
 * @returns Returns a nested Map structure: Map<imageIndex, Map<level, Map<frameIndex, defId>>> where defId is the SVG element ID, and an array of SVG definition elements.
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

    const displayMode = display.mode || 'sync'; // Default to sync mode
    const isContributionLevel = displayMode === 'level';
    const framesPerLevel = imageConfig.sprite?.framesPerLevel;
    const effectiveFrameCount = typeof framesPerLevel === 'number' ? framesPerLevel : 1;

    const isMultiFrame = imageConfig.sprite && effectiveFrameCount > 1;
    const frameCount = effectiveFrameCount;

    if (isContributionLevel && imageConfig.urlFolder) {
      // Level mode: multiple formats supported
      // 1. Individual frames per level: prefix_{level}-{frame}.ext (e.g., sprite_0-0.png)
      // 2. Sprite sheet per level: prefix_{level}.ext (e.g., sprite_0.png)
      const contributionLevels = imageConfig.sprite?.contributionLevels || 5;
      const useSpriteSheetPerLevel = imageConfig.sprite?.useSpriteSheetPerLevel || false;
      const framesPerLevel = imageConfig.sprite?.framesPerLevel || 1;

      // Choose appropriate default pattern based on mode
      const defaultPattern = useSpriteSheetPerLevel ? 'sprite_{n}.png' : 'sprite_{n}-{n}.png';
      const framePattern = imageConfig.framePattern || defaultPattern;

      // Validate frame pattern format
      if (!validateFramePattern(framePattern, true, useSpriteSheetPerLevel)) {
        if (useSpriteSheetPerLevel) {
          throw new Error(
            `Invalid framePattern for sprite sheet per level mode: "${framePattern}". ` +
            `Pattern MUST end with _{n}.ext (e.g., "sprite_{n}.png"). ` +
            `Format: prefix_{level}.ext`
          );
        } else {
          throw new Error(
            `Invalid framePattern for level mode: "${framePattern}". ` +
            `Pattern MUST end with _{n}-{n}.ext (e.g., "sprite_{n}-{n}.png"). ` +
            `Format: prefix_{level}-{frame}.ext`
          );
        }
      }

      // Try wildcard scanning if pattern contains '*'
      let wildcardFiles: Map<number, Map<number, string>> | null = null;
      let wildcardSpriteSheets: Map<number, string> | null = null;

      if (framePattern.includes('*')) {
        if (useSpriteSheetPerLevel) {
          // Scan for sprite sheet files: *_{n}.png
          wildcardSpriteSheets = await scanWildcardSpriteSheetPerLevel(
            imageConfig.urlFolder,
            framePattern,
            contributionLevels
          );

          if (wildcardSpriteSheets && counterConfig.debug) {
            console.log(`🎲 Wildcard sprite sheet scan completed: found ${wildcardSpriteSheets.size} levels`);
          }
        } else {
          // Scan for individual frame files: *_{n}-{n}.png
          wildcardFiles = await scanWildcardLevelFrames(
            imageConfig.urlFolder,
            framePattern,
            contributionLevels,
            framesPerLevel
          );

          if (wildcardFiles && counterConfig.debug) {
            console.log(`🎲 Wildcard level scan completed: found frames for ${wildcardFiles.size} levels`);
          }
        }
      }

      for (let level = 0; level < contributionLevels; level++) {
        const frameMap = new Map<number, string>();
        levelMap.set(level, frameMap);

        const levelFrameCount = Array.isArray(framesPerLevel) ? framesPerLevel[level] : framesPerLevel;

        if (useSpriteSheetPerLevel) {
          // Each level is a sprite sheet file
          let spriteUrl: string;

          if (wildcardSpriteSheets) {
            // Wildcard mode: use randomly selected file
            const selectedFilename = wildcardSpriteSheets.get(level);
            if (selectedFilename) {
              const normalizedFolder = imageConfig.urlFolder.replace(/\/$/, '');
              spriteUrl = `${normalizedFolder}/${selectedFilename}`;
            } else {
              // File not found in wildcard scan, skip this level
              console.warn(`⚠️  Wildcard: No sprite sheet file found for level ${level}`);
              continue;
            }
          } else {
            // Exact match mode: generate URL from pattern
            spriteUrl = generateLevelFrameUrl(imageConfig.urlFolder, framePattern, level, 0);
          }

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
          // Each level uses separate frame files
          // Use wildcard-selected files if available, otherwise use exact pattern
          for (let frameIdx = 0; frameIdx < levelFrameCount; frameIdx++) {
            let frameUrl: string;

            if (wildcardFiles) {
              // Wildcard mode: use randomly selected file
              const selectedFilename = wildcardFiles.get(level)?.get(frameIdx);
              if (selectedFilename) {
                const normalizedFolder = imageConfig.urlFolder.replace(/\/$/, '');
                frameUrl = `${normalizedFolder}/${selectedFilename}`;
              } else {
                // File not found in wildcard scan, skip
                console.warn(`⚠️  Wildcard: No file found for level ${level}, frame ${frameIdx}`);
                continue;
              }
            } else {
              // Exact match mode: generate URL from pattern
              frameUrl = generateLevelFrameUrl(imageConfig.urlFolder, framePattern, level, frameIdx);
            }

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
      // Multi-file mode: load separate frame files (non-level pattern)
      // Format: prefix-{frame}.ext (hyphen separates prefix from frame number)
      const framePattern = imageConfig.framePattern || 'frame-{n}.png';

      // Validate frame pattern format
      if (!validateFramePattern(framePattern, false)) {
        throw new Error(
          `Invalid framePattern for multi-file mode: "${framePattern}". ` +
          `Non-level mode patterns MUST end with -{n}.ext (e.g., "frame-{n}.png"). ` +
          `Format: prefix-{frame}.ext`
        );
      }

      const frameUrls = await generateFrameUrls(imageConfig.urlFolder, framePattern, frameCount);

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
  spriteAnimationCells?: AnimatedCellData[], // Optional: separate data source for sprite animation (includes L0)
): Promise<ProgressStackResult> => {
  // Default frame duration when cells.length is 0 (fallback value)
  const DEFAULT_FRAME_DURATION_MS = 100;

  const svgElements: string[] = [];
  const isHidden = counterConfig?.hideProgressBar ?? false;

  const baseStyle = `.u{
      transform-origin: 0 0;
      animation: none linear ${duration}ms infinite;${isHidden ? '\n      opacity: 0;' : ''}
    }`;

  const styles: string[] = [baseStyle];

  // Handle prefers-reduced-motion accessibility setting
  // This applies to ALL animated elements: progress bar (.u), snake (.snake-segment),
  // grid cells (.grid-cell), and contribution counters (.contrib-counter, .contrib-image)
  if (counterConfig?.forceAnimations) {
    // When forceAnimations is true: override user's motion preference and keep animations running
    // ⚠️ This should only be used for justified reasons (e.g., static README images)
    styles.push(
      `@media (prefers-reduced-motion: reduce){` +
      `\n  .u, .snake-segment, .grid-cell, .contrib-counter, .contrib-image { animation: revert !important; }` +
      `\n}`
    );
  } else {
    // Default behavior: respect user's motion preference and disable animations when requested
    // This is the accessible default that respects user settings
    styles.push(
      `@media (prefers-reduced-motion: reduce){` +
      `\n  .u, .snake-segment, .grid-cell, .contrib-counter, .contrib-image { animation: none !important; }` +
      `\n}`
    );
  }

  if (isHidden && counterConfig?.debug) {
    console.log(`📊 Progress Bar: Hidden (hideProgressBar = true, bars invisible but counter text visible)`);
  }

  // CRITICAL: Separate data sources for progress bar and sprite animation
  // - Progress bar: uses filtered cells (excludes L0 and outside cells)
  // - Sprite animation: should always include L0 to show animation when passing empty cells
  // Use spriteAnimationCells if provided, otherwise fall back to cells
  const spriteDataSource = spriteAnimationCells ?? cells;

  // Filter cells for progress bar (uniform mode: exclude L0 and outside cells)
  const filteredCells = cells.filter((cell) => {
    if (cell.t === null) return false;

    // Filter out outside cells
    if (gridWidth !== undefined && gridHeight !== undefined && hasValidCoordinates(cell)) {
      if (cell.x < 0 || cell.y < 0 || cell.x >= gridWidth || cell.y >= gridHeight) {
        return false; // Outside cell - exclude from progress bar
      }
    }

    // Filter out L0 (empty cells, color=0)
    // Progress bar should only scroll for colored cells (L1-L4)
    if (cell.color === 0) {
      return false; // Empty cell (L0) - exclude from progress bar
    }

    return true;
  });

  // Sort remaining cells by animation time
  const sortedCells = filteredCells.sort((a, b) => a.t! - b.t!);

  // CRITICAL FIX: Calculate counter-specific duration
  // Global duration is based on full chain (including outside cells)
  // Counter duration should be based on filtered cells only
  // This ensures each counter frame displays for the correct duration (frameDuration)
  const frameDuration = cells.length > 0 ? duration / cells.length : DEFAULT_FRAME_DURATION_MS;
  const counterDuration = sortedCells.length * frameDuration;

  if (counterConfig?.debug) {
    const cellsWithTime = cells.filter(c => c.t !== null).length;
    const outsideFiltered = cells.length - cellsWithTime;
    const l0Filtered = cells.filter(c => c.t !== null && c.color === 0).length;

    console.log(`📊 Progress Bar Debug:`);
    console.log(`  - Total cells in chain: ${cells.length}`);
    console.log(`  - Progress bar mode: uniform (only colored cells)`);
    console.log(`  - Outside cells filtered: ${outsideFiltered}`);
    console.log(`  - L0 (empty) cells filtered: ${l0Filtered}`);
    console.log(`  - Cells shown in progress bar: ${sortedCells.length}`);
    console.log(`  - Global duration: ${duration}ms (${cells.length} frames × ${frameDuration.toFixed(1)}ms)`);
    console.log(`  - Counter duration: ${counterDuration}ms (${sortedCells.length} frames × ${frameDuration.toFixed(1)}ms)`);
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

  // Render progress bar using extracted function
  const progressBarResult = renderProgressBar(
    sortedCells.map(cell => ({ t: cell.t!, color: cell.color as Color, x: cell.x, y: cell.y })),
    dotSize,
    width,
    y,
    duration,
    counterConfig,
    isHidden
  );

  svgElements.push(...progressBarResult.svgElements);
  styles.push(...progressBarResult.styles);

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

      // Positioning logic:
      // - follow/free modes: same line as progress bar
      // - top-left/top-right: above progress bar
      // - bottom-left/bottom-right: below progress bar
      // Text baseline is positioned based on fontSize, not lineHeight
      // (lineHeight is only for calculating required vertical space in svg-builder.ts)
      const textY = (position === 'follow' || position === 'free') ? (y + dotSize / 2) :
                    (position === 'bottom-left' || position === 'bottom-right') ? (y + dotSize + fontSize * 0.5) :
                    (y - fontSize * 0.5);
      const textOffsetX = fontSize * 0.5; // Small offset

      // Build common text attributes
      const textAttrs: Record<string, string> = {
        "font-size": fontSize.toString(),
        "font-family": fontFamily,
        fill: textColor,
        "text-anchor": (position === 'top-right' || position === 'bottom-right') ? 'end' : 'start',
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
            x: (position === 'top-right' || position === 'bottom-right') ? width.toFixed(1) : '0',
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
        // CRITICAL: Use sprite data source (includes L0) for sprite animation
        // This is separate from progress bar data (sortedCells) which excludes L0 in uniform mode
        const spriteCells = spriteDataSource
          .filter((cell): cell is typeof cell & { t: number } => cell.t !== null)
          .sort((a, b) => a.t - b.t);

        const { states: textElements, repeatedCellCount } = buildCounterStates(
          spriteCells,  // Use sprite data source (includes L0) for frame generation
          counterConfig,
          totalContributions,
          width,
          position,
          textOffsetX,
          sortedCells  // Pass progress bar cells for X position calculation
        );

        // Track level distribution for debugging (level mode)
        const levelDistribution = new Map<number, number>();

        // Track animation state for smooth level transitions
        // For each image, track: previous level, cycle start index, absolute start time, and last cycle number
        // lastCycleNumber helps detect cycle completion even when frames are skipped
        // prevLevel is undefined on first frame to trigger initialization
        const animationStates = new Map<string, {
          prevLevel: number | undefined;
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
        // Track contribution cells eaten (for sync mode frame counting)
        let contributionCellsEaten = 0;

        for (let index = 0; index < textElements.length; index++) {
          const elem = textElements[index];
          const textId = `contrib-text-${displayIndex}-${index}`;

          // Count cells with contribution (for sync mode)
          // Only count when currentContribution > 0 (eating a colored cell)
          if (elem.currentContribution > 0) {
            contributionCellsEaten++;
          }

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
              }).replace("/>", `>${escapeXml(displayText)}</text>`)
            );
          } else {
            // Mixed text and images - create group with text spans and image elements
            const groupId = `contrib-group-${displayIndex}-${index}`;

            // Calculate starting X position based on alignment
            let currentX: number;

            if (position === 'top-right' || position === 'bottom-right') {
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
                  }).replace("/>", `>${escapeXml(segment.content)}</text>`)
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

                    const displayMode = display.mode || 'sync'; // Default to sync mode
                    const isContributionLevel = displayMode === 'level';
                    const framesPerLevelValue = imageConfig.sprite?.framesPerLevel;
                    const totalFrames = (typeof framesPerLevelValue === 'number' ? framesPerLevelValue : 1);
                    const isMultiFrame = imageConfig.sprite && totalFrames > 1;
                    const isDynamicSpeed = isMultiFrame && displayMode === 'sync' && imageConfig.sprite?.dynamicSpeed;

                    if (isContributionLevel) {
                      // Level mode: select level based on contribution value
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
                        // Sprite frame duration uses the same frameDuration as snake movement for perfect sync
                        const spriteFrameDuration = frameDuration; // Synced with snake's movement speed
                        const absoluteTime = elem.time * duration; // Current absolute time in ms

                        const imageKey = `${displayIndex}-${imageIndex}`; // Unique key per image
                        let state = animationStates.get(imageKey);

                        if (!state) {
                          // Initialize state: start animation cycle at current position
                          // Store the absolute time when animation started
                          // prevLevel left undefined to trigger first frame initialization
                          state = {
                            prevLevel: undefined,  // Will be set during first frame initialization
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
                        // Use currentLevel as fallback if prevLevel is undefined (first frame)
                        const prevLevelFrameCount = Array.isArray(framesPerLevel)
                          ? framesPerLevel[state.prevLevel ?? currentLevel]
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

                        // Level selection logic:
                        // ALL level transitions (L0↔L1↔L2↔L3↔L4): wait for cycle complete
                        // No special cases - smooth animation for all level changes

                        // DEBUG: Log state before switching logic
                        if (counterConfig.debug && ((index >= 46 && index <= 52) || (index >= 127 && index <= 132))) {
                          console.log(`  🔍 Frame ${index} PRE-SWITCH: currentLevel=${currentLevel}, state.prevLevel=${state.prevLevel}, isCycleComplete=${isCycleComplete}, absoluteTime=${absoluteTime.toFixed(2)}ms, cycleStartTime=${state.cycleStartTime?.toFixed(2)}ms`);
                        }

                        // Initialize state for first frame
                        const isFirstFrame = state.prevLevel === undefined;

                        if (isFirstFrame) {
                          // First frame - initialize with current level
                          // Start at cycle 0, animation will play through all 8 frames before switching
                          state.prevLevel = currentLevel;
                          state.cycleStartIndex = index;
                          state.cycleStartTime = absoluteTime;
                          state.lastCycleNumber = 0;  // Start at cycle 0, wait for full cycle before switching
                          level = currentLevel;
                          elapsedTime = 0;
                          elapsedFrames = 0;

                          if (counterConfig.debug && index < 20) {
                            console.log(`  🎬 Frame ${index}: First frame initialization, level=L${level}, cycleStartTime=${absoluteTime.toFixed(2)}ms, lastCycleNum=0 (will play full cycle)`);
                          }
                          // Don't check isCycleComplete on first frame - just initialize and continue
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

                          if (counterConfig.debug && ((index < 20 || oldLevel === 0 || currentLevel === 0 || oldLevel !== currentLevel) || (index >= 127 && index <= 132))) {
                            console.log(`  ⚡ Frame ${index}: Cycle complete (cycle ${currentCycleNumber}), ${oldLevel === currentLevel ? 'continuing' : 'switching from'} L${oldLevel} ${oldLevel === currentLevel ? '' : `to L${level}`} (contribution=${elem.currentContribution}, elapsedFrames=${elapsedFrames})`);
                            if (oldLevel !== currentLevel) {
                              console.log(`     → Level changed! cycleStartTime=${absoluteTime.toFixed(0)}ms, elapsedFrames RESET to 0`);
                            } else {
                              console.log(`     → Same level continuing! cycleStartTime kept at ${state.cycleStartTime?.toFixed(0)}ms`);
                            }
                          }
                        } else {
                          // Mid-cycle - use previous level (don't interrupt animation)
                          // Use currentLevel as fallback if prevLevel is undefined (shouldn't happen in mid-cycle)
                          level = state.prevLevel ?? currentLevel;

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
                    } else if (isMultiFrame && displayMode === 'sync') {
                      // Sequential sync mode: cycle through frames with fixed speed
                      // FREE MODE: Use index (all steps) to avoid sliding when position moves but frame doesn't
                      // FOLLOW MODE: Use contributionCellsEaten (colored cells only) so sprite pauses on empty cells
                      const animSpeed = imageConfig.sprite?.animationSpeed ?? 1;
                      const stepCounter = position === 'free' ? index : contributionCellsEaten;
                      frameIndex = Math.floor((stepCounter * animSpeed) % totalFrames);

                      if (counterConfig.debug && index < 20) {
                        console.log(`🔄 Sync mode frame ${index}: position=${position}, stepCounter=${stepCounter} (index=${index}, contrib=${contributionCellsEaten}), animSpeed=${animSpeed}, frameIdx=${frameIndex}/${totalFrames}`);
                      }
                    } else if (isMultiFrame && displayMode === 'loop') {
                      // Loop mode: independent animation cycling
                      const loopSpeed = imageConfig.sprite?.loopSpeed;

                      if (loopSpeed !== undefined && loopSpeed !== false) {
                        // Index-based loop (no frame skipping, smooth)
                        // loopSpeed controls how many frames advance per step
                        const speed = typeof loopSpeed === 'boolean' ? 1.0 : loopSpeed;
                        frameIndex = Math.floor((index * speed) % totalFrames);

                        if (counterConfig.debug && index < 10) {
                          console.log(`🔁 Loop mode (index-based) frame ${index}: loopSpeed=${speed}, frameIdx=${frameIndex}/${totalFrames}`);
                        }
                      } else {
                        // Time-based loop (may skip frames based on fps)
                        // Calculate frame index based on absolute time and fps
                        const fps = imageConfig.sprite?.fps || 8; // Default 8 fps
                        const absoluteTime = elem.time * duration; // Convert normalized time to milliseconds
                        const frameDuration = 1000 / fps; // Duration per frame in ms
                        frameIndex = Math.floor(absoluteTime / frameDuration) % totalFrames;

                        if (counterConfig.debug && index < 10) {
                          console.log(`🔁 Loop mode (time-based) frame ${index}: time=${elem.time.toFixed(4)}, absTime=${absoluteTime.toFixed(2)}ms, fps=${fps}, frameIdx=${frameIndex}/${totalFrames}`);
                        }
                      }
                    }
                    // For static images, level=0, frameIndex=0

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

          // Log level distribution for level mode
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

  return { svgElements, styles: styles.join('\n') };
};

/**
 * Validates that a framePattern follows the required naming convention.
 *
 * Rules:
 * - Non-level mode: MUST end with -{n} (hyphen separates prefix from frame number)
 * - Level mode with individual frames: MUST end with _{n}-{n} (underscore before level, hyphen between level and frame)
 * - Level mode with sprite sheets per level: MUST end with _{n} (underscore before level number)
 *
 * Separator usage:
 * - `_` (underscore): Separates prefix from level number (used in level mode only)
 * - `-` (hyphen): Separates prefix from frame number (non-level mode) or level from frame number (level mode)
 *
 * @param framePattern - Pattern to validate
 * @param isLevelMode - Whether this is for level mode (default: false)
 * @param isSpriteSheetPerLevel - Whether using sprite sheet per level (only relevant for level mode)
 * @returns True if valid, false otherwise
 *
 * @example
 * ```typescript
 * // Non-level mode (hyphen before frame)
 * validateFramePattern('sprite-{n}.png', false);          // true - sprite-0.png
 * validateFramePattern('*-{n}.gif', false);               // true - wildcard match
 *
 * // Level mode with individual frames (underscore before level, hyphen before frame)
 * validateFramePattern('char_{n}-{n}.png', true, false);  // true - char_0-0.png, char_1-5.png
 * validateFramePattern('*_{n}-{n}.png', true, false);     // true - wildcard with level
 *
 * // Level mode with sprite sheet per level (underscore before level only)
 * validateFramePattern('sprite_{n}.png', true, true);     // true - sprite_0.png, sprite_1.png
 * validateFramePattern('*_{n}.png', true, true);          // true - wildcard sprite sheets
 *
 * // Invalid examples
 * validateFramePattern('frame_{n}.png', false);           // false - non-level mode requires hyphen, not underscore
 * validateFramePattern('sprite-{n}.png', true, false);    // false - level mode requires underscore before level number
 * validateFramePattern('sprite{n}.png', true, true);      // false - missing underscore separator before level
 * validateFramePattern('char_{n}.png', true, false);      // false - individual frames mode requires _{n}-{n} format
 * ```
 */
export const validateFramePattern = (
  framePattern: string,
  isLevelMode: boolean = false,
  isSpriteSheetPerLevel: boolean = false
): boolean => {
  if (isLevelMode) {
    if (isSpriteSheetPerLevel) {
      // Level mode with sprite sheet per level: must end with _{n}.ext
      // Underscore separates prefix from level number
      const pattern = /_{n}\.[^.]+$/;
      return pattern.test(framePattern);
    } else {
      // Level mode with individual frames: must end with _{n}-{n}.ext
      // Underscore before level, hyphen between level and frame
      const pattern = /_{n}-{n}\.[^.]+$/;
      return pattern.test(framePattern);
    }
  } else {
    // Non-level mode: must end with -{n}.ext
    // Hyphen before frame number
    const pattern = /-{n}\.[^.]+$/;
    return pattern.test(framePattern);
  }
};

/**
 * Scans a directory for files matching the wildcard pattern *-{n}.ext
 * and randomly selects one file for each frame number.
 *
 * Pattern format: prefix-{frame}.ext
 * - Hyphen separates prefix from frame number
 *
 * **Reuse Feature (Windows-friendly):**
 * To reduce file size by reusing images, use the `@` syntax:
 * - Create a 0-byte placeholder file: `prefix-{frame}@{ref_frame}.ext`
 * - Example: `walk-5@0.png` means "Frame 5 reuses the image from Frame 0"
 * - The reference frame MUST be scanned before the reusing frame (lower frame number)
 *
 * @param urlFolder - Folder path to scan
 * @param framePattern - Pattern ending with -{n} (e.g., "*-{n}.png")
 * @param frameCount - Number of frames expected
 * @returns Map of frame index to selected filename, or null if scanning is not possible
 *
 * @example
 * ```typescript
 * // Files in folder: "red-0.png", "blue-0.png", "green-0.png", "red-1.png", "blue-1.png"
 * const fileMap = await scanWildcardFrames('./assets', '*-{n}.png', 2);
 * // Returns: Map { 0 => 'blue-0.png', 1 => 'red-1.png' } (random selection)
 *
 * // With reuse (files: "walk-0.png", "walk-1.png", "walk-2@0.png", "walk-3@1.png")
 * const fileMap = await scanWildcardFrames('./assets', '*-{n}.png', 4);
 * // Frame 2 reuses walk-0.png, Frame 3 reuses walk-1.png
 * // Returns: Map { 0 => 'walk-0.png', 1 => 'walk-1.png', 2 => 'walk-0.png', 3 => 'walk-1.png' }
 * ```
 */
export const scanWildcardFrames = async (
  urlFolder: string,
  framePattern: string,
  frameCount: number
): Promise<Map<number, string> | null> => {
  try {
    // Validate pattern format
    if (!validateFramePattern(framePattern, false)) {
      console.error(`❌ Invalid framePattern: "${framePattern}"`);
      console.error(`   Frame patterns MUST end with -{n}.ext (e.g., "sprite-{n}.png")`);
      return null;
    }

    // Check if this is a wildcard pattern
    if (!framePattern.includes('*')) {
      return null; // Not a wildcard pattern, use exact match mode
    }

    // Validate that framePattern contains at most one wildcard
    const wildcardCount = (framePattern.match(/\*/g) || []).length;
    if (wildcardCount > 1) {
      console.error(
        `❌ Invalid framePattern: "${framePattern}" contains ${wildcardCount} wildcards. ` +
        `Only ONE wildcard (*) is supported per pattern. ` +
        `Examples: "*-{n}.png", "*_{n}-{n}.png"`
      );
      return null;
    }

    // Dynamic import to work in both Node.js and browser environments
    const fs = await import('fs');
    const path = await import('path');

    // Resolve absolute path
    const workspaceRoot = process.env.GITHUB_WORKSPACE || process.cwd();
    const resolvedWorkspaceRoot = path.resolve(workspaceRoot);
    const absoluteFolder = path.resolve(urlFolder);

    // Security: Validate path is within workspace using path.relative-based check
    if (!isPathWithinWorkspace(path, resolvedWorkspaceRoot, absoluteFolder)) {
      console.error(`⚠️  Security: Path traversal detected in wildcard scan!`);
      console.error(`   Folder: ${urlFolder}`);
      console.error(`   Resolved: ${absoluteFolder}`);
      console.error(`   Workspace: ${resolvedWorkspaceRoot}`);
      return null;
    }

    // Check if directory exists
    if (!fs.existsSync(absoluteFolder)) {
      console.error(`Folder not found for wildcard scan: ${urlFolder}`);
      return null;
    }

    // Read directory contents
    const files = fs.readdirSync(absoluteFolder);

    // Extract the pattern parts: prefix wildcard and suffix
    // Example: "*-{n}.png" -> suffix = "-{n}.png"
    const wildcardIndex = framePattern.indexOf('*');
    const patternAfterWildcard = framePattern.substring(wildcardIndex + 1);

    // Extract file extension from pattern
    const extMatch = patternAfterWildcard.match(/\.[^.]+$/);
    const extension = extMatch ? extMatch[0] : '';

    // Build regex to match files: anything + -{frameNum} + extension
    // Example: /^.*-(\d+)\.png$/ for pattern "*-{n}.png"
    const frameNumberPattern = patternAfterWildcard
      .replace('-{n}', '-(?<frameNum>\\d+)')
      .replace(/\./g, '\\.');
    const regex = new RegExp(`^.*${frameNumberPattern}$`);

    // Regex to detect reuse syntax: prefix-{frame}@{ref_frame}.ext
    const reuseRegex = /^.*-(?<frame>\d+)@(?<refFrame>\d+)\./;

    // Group files by frame number
    const frameGroups: Map<number, string[]> = new Map();

    // Track reuse mappings: {frame} -> {ref_frame}
    const reuseMap = new Map<number, number>();

    for (const file of files) {
      // Check if this is a reuse directive
      const reuseMatch = file.match(reuseRegex);
      if (reuseMatch && reuseMatch.groups) {
        const frame = parseInt(reuseMatch.groups.frame, 10);
        const refFrame = parseInt(reuseMatch.groups.refFrame, 10);

        reuseMap.set(frame, refFrame);
        console.log(`🔗 Reuse: Frame ${frame} -> Frame ${refFrame}`);
        continue; // Don't add to frameGroups
      }

      const match = file.match(regex);
      if (match && match.groups?.frameNum) {
        const frameNum = parseInt(match.groups.frameNum, 10);

        if (!frameGroups.has(frameNum)) {
          frameGroups.set(frameNum, []);
        }
        frameGroups.get(frameNum)!.push(file);
      }
    }

    // Randomly select one file for each frame
    const selectedFiles = new Map<number, string>();

    for (let i = 0; i < frameCount; i++) {
      // Check if this frame should reuse another frame
      if (reuseMap.has(i)) {
        const refFrame = reuseMap.get(i)!;

        // Get the already-selected file from the reference frame
        const refFile = selectedFiles.get(refFrame);

        if (refFile) {
          selectedFiles.set(i, refFile);
          console.log(`♻️  Frame ${i}: Reusing "${refFile}" from Frame ${refFrame}`);
          continue;
        } else {
          console.warn(`⚠️  Reuse failed: Frame ${refFrame} not yet selected for Frame ${i}`);
          console.warn(`⚠️  Make sure reference frames come before frames that reuse them`);
          // Fall through to normal selection
        }
      }

      const candidates = frameGroups.get(i);

      if (!candidates || candidates.length === 0) {
        console.warn(`⚠️  No files found matching pattern for frame ${i}`);
        continue;
      }

      // Random selection using secure random
      const randomIndex = Math.floor(getSecureRandom() * candidates.length);
      const selectedFile = candidates[randomIndex];
      selectedFiles.set(i, selectedFile);

      if (candidates.length > 1) {
        console.log(`🎲 Frame ${i}: Selected "${selectedFile}" from ${candidates.length} candidates: [${candidates.join(', ')}]`);
      }
    }

    return selectedFiles;
  } catch (error) {
    console.error(`Error scanning wildcard frames:`, error);
    return null;
  }
};

/**
 * Helper function to generate frame URLs from folder path and pattern.
 * This is used when the user provides multiple separate image files instead of a sprite sheet.
 *
 * Supports two modes:
 * 1. **Exact match**: Pattern like "frame-{n}.png" generates exact filenames
 * 2. **Wildcard match**: Pattern like "*-{n}.png" scans folder and randomly selects matching files
 *    - Files MUST end with -{n} (hyphen separates prefix from frame number)
 *    - When multiple files match the same -{n}, one is randomly selected
 *
 * @param urlFolder - Folder path containing the frame images
 * @param framePattern - Pattern for frame filenames (default: 'frame-{n}.png')
 * @param frameCount - Number of frames to generate URLs for
 * @returns Array of URLs for each frame
 *
 * @example
 * ```typescript
 * // Exact match mode
 * const urls = generateFrameUrls('images/character', 'frame-{n}.png', 5);
 * // Returns: ['images/character/frame-0.png', 'images/character/frame-1.png', ...]
 *
 * // Wildcard mode with random selection
 * const urls = await generateFrameUrls('assets/sprite', '*-{n}.gif', 3);
 * // Scans folder for files ending with -0.gif, -1.gif, -2.gif
 * // If found: red-0.gif, blue-0.gif -> randomly picks one for frame 0
 * // Returns: ['assets/sprite/blue-0.gif', 'assets/sprite/red-1.gif', 'assets/sprite/green-2.gif']
 * ```
 */
export const generateFrameUrls = async (
  urlFolder: string,
  framePattern: string = 'frame-{n}.png',
  frameCount: number
): Promise<string[]> => {
  const urls: string[] = [];

  // Normalize folder path (remove trailing slash if present)
  const normalizedFolder = urlFolder.replace(/\/$/, '');

  // Check if this is a wildcard pattern
  if (framePattern.includes('*') && framePattern.includes('-{n}')) {
    // Wildcard mode: scan folder and randomly select files
    const selectedFiles = await scanWildcardFrames(urlFolder, framePattern, frameCount);

    if (selectedFiles) {
      // Use the randomly selected files
      for (let i = 0; i < frameCount; i++) {
        const filename = selectedFiles.get(i);
        if (filename) {
          urls.push(`${normalizedFolder}/${filename}`);
        } else {
          // Fallback: generate expected filename (may not exist)
          const fallbackFilename = framePattern.replace('*', 'missing').replace('{n}', i.toString());
          console.warn(`⚠️  Frame ${i} not found, using fallback: ${fallbackFilename}`);
          urls.push(`${normalizedFolder}/${fallbackFilename}`);
        }
      }
      return urls;
    }

    // If scanning failed, fall through to exact match mode
    console.warn(`⚠️  Wildcard scanning failed, falling back to exact match mode`);
  }

  // Exact match mode: generate filenames from pattern
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
 * Scans a directory for files matching the wildcard pattern with _{n}-{n} format
 * and randomly selects files for each level and frame combination.
 *
 * Pattern format: prefix_{level}-{frame}.ext
 * - Underscore separates prefix from level number
 * - Hyphen separates level number from frame number
 *
 * **Reuse Feature (Windows-friendly):**
 * To reduce file size by reusing images across levels/frames, use the `@` syntax:
 * - Create a 0-byte placeholder file: `prefix_{level}-{frame}@{ref_level}-{ref_frame}.ext`
 * - Example: `sprite_2-3@0-1.png` means "Level 2, Frame 3 reuses the image from Level 0, Frame 1"
 * - The reference level/frame MUST be scanned before the reusing one (lower level/frame number)
 *
 * @param urlFolder - Folder path to scan
 * @param framePattern - Pattern with _{n}-{n} (e.g., "*_{n}-{n}.png")
 * @param contributionLevels - Number of contribution levels (typically 5)
 * @param framesPerLevel - Number of frames per level (can be number or array)
 * @returns Nested map: level -> frameIndex -> filename, or null if scanning failed
 *
 * @example
 * ```typescript
 * // Basic usage - random selection from multiple files
 * // Files: "red_0-0.png", "blue_0-0.png", "red_1-0.png", "green_1-5.png"
 * const levelMap = await scanWildcardLevelFrames('./assets', '*_{n}-{n}.png', 2, 6);
 * // Returns: Map {
 * //   0 => Map { 0 => 'blue_0-0.png' },
 * //   1 => Map { 0 => 'red_1-0.png', 5 => 'green_1-5.png' }
 * // }
 *
 * // With reuse - reducing file count
 * // Files: "char_0-0.png", "char_0-1.png", "char_1-0@0-0.png", "char_1-1@0-1.png"
 * const levelMap = await scanWildcardLevelFrames('./assets', '*_{n}-{n}.png', 2, 2);
 * // Level 1 frames reuse Level 0 frames
 * // Returns: Map {
 * //   0 => Map { 0 => 'char_0-0.png', 1 => 'char_0-1.png' },
 * //   1 => Map { 0 => 'char_0-0.png', 1 => 'char_0-1.png' }
 * // }
 * ```
 */
export const scanWildcardLevelFrames = async (
  urlFolder: string,
  framePattern: string,
  contributionLevels: number,
  framesPerLevel: number | number[]
): Promise<Map<number, Map<number, string>> | null> => {
  try {
    // Validate pattern format (individual frames only, not sprite sheet per level)
    if (!validateFramePattern(framePattern, true, false)) {
      console.error(`❌ Invalid framePattern for level mode: "${framePattern}"`);
      console.error(`   Level mode patterns MUST end with _{n}-{n}.ext (e.g., "sprite_{n}-{n}.png")`);
      console.error(`   Format: prefix_{level}-{frame}.ext`);
      return null;
    }

    // Check if this is a wildcard pattern
    if (!framePattern.includes('*')) {
      return null; // Not a wildcard pattern, use exact match mode
    }

    // Validate that framePattern contains at most one wildcard
    const wildcardCount = (framePattern.match(/\*/g) || []).length;
    if (wildcardCount > 1) {
      console.error(
        `❌ Invalid framePattern: "${framePattern}" contains ${wildcardCount} wildcards. ` +
        `Only ONE wildcard (*) is supported per pattern. ` +
        `Examples: "*_{n}-{n}.png"`
      );
      return null;
    }

    // Dynamic import
    const fs = await import('fs');
    const path = await import('path');

    // Resolve and validate path
    const workspaceRoot = process.env.GITHUB_WORKSPACE || process.cwd();
    const resolvedWorkspaceRoot = path.resolve(workspaceRoot);
    const absoluteFolder = path.resolve(urlFolder);

    if (!isPathWithinWorkspace(path, resolvedWorkspaceRoot, absoluteFolder)) {
      console.error(`⚠️  Security: Path traversal detected in wildcard level scan!`);
      return null;
    }

    if (!fs.existsSync(absoluteFolder)) {
      console.error(`Folder not found for wildcard level scan: ${urlFolder}`);
      return null;
    }

    // Read directory
    const files = fs.readdirSync(absoluteFolder);

    // Build regex: *_{level}-{frame}.ext -> ^.*_(\d+)-(\d+)\.ext$
    // Also support reuse syntax: *_{level}-{frame}@{ref_level}-{ref_frame}.ext
    const patternAfterWildcard = framePattern.substring(framePattern.indexOf('*') + 1);
    const regexPattern = patternAfterWildcard
      .replace(/_{n}-{n}/g, '_(?<level>\\d+)-(?<frame>\\d+)')
      .replace(/\./g, '\\.');
    const regex = new RegExp(`^.*${regexPattern}$`);

    // Regex to detect reuse syntax: prefix_{level}-{frame}@{ref_level}-{ref_frame}.ext
    const reuseRegex = new RegExp(`^.*_(?<level>\\d+)-(?<frame>\\d+)@(?<refLevel>\\d+)-(?<refFrame>\\d+)\\.`);

    // Group files by level and frame
    const levelGroups: Map<number, Map<number, string[]>> = new Map();

    // Track reuse mappings: {level}-{frame} -> {ref_level}-{ref_frame}
    const reuseMap = new Map<string, string>();

    for (const file of files) {
      // Check if this is a reuse directive
      const reuseMatch = file.match(reuseRegex);
      if (reuseMatch && reuseMatch.groups) {
        const level = parseInt(reuseMatch.groups.level, 10);
        const frame = parseInt(reuseMatch.groups.frame, 10);
        const refLevel = parseInt(reuseMatch.groups.refLevel, 10);
        const refFrame = parseInt(reuseMatch.groups.refFrame, 10);

        const key = `${level}-${frame}`;
        const refKey = `${refLevel}-${refFrame}`;
        reuseMap.set(key, refKey);

        console.log(`🔗 Reuse: Level ${level}, Frame ${frame} -> Level ${refLevel}, Frame ${refFrame}`);
        continue; // Don't add to levelGroups, it's just a directive
      }

      // Regular file matching
      const match = file.match(regex);
      if (match && match.groups?.level && match.groups?.frame) {
        const level = parseInt(match.groups.level, 10);
        const frame = parseInt(match.groups.frame, 10);

        if (!levelGroups.has(level)) {
          levelGroups.set(level, new Map());
        }
        const frameMap = levelGroups.get(level)!;

        if (!frameMap.has(frame)) {
          frameMap.set(frame, []);
        }
        frameMap.get(frame)!.push(file);
      }
    }

    // Randomly select files for each level and frame
    const selectedFiles: Map<number, Map<number, string>> = new Map();

    for (let level = 0; level < contributionLevels; level++) {
      const levelFrameCount = Array.isArray(framesPerLevel) ? framesPerLevel[level] : framesPerLevel;
      const levelFrameMap = new Map<number, string>();
      selectedFiles.set(level, levelFrameMap);

      for (let frameIdx = 0; frameIdx < levelFrameCount; frameIdx++) {
        const key = `${level}-${frameIdx}`;

        // Check if this frame should reuse another frame
        if (reuseMap.has(key)) {
          const refKey = reuseMap.get(key)!;
          const [refLevelStr, refFrameStr] = refKey.split('-');
          const refLevel = parseInt(refLevelStr, 10);
          const refFrame = parseInt(refFrameStr, 10);

          // Get the already-selected file from the reference frame
          const refFile = selectedFiles.get(refLevel)?.get(refFrame);

          if (refFile) {
            levelFrameMap.set(frameIdx, refFile);
            console.log(`♻️  Level ${level}, Frame ${frameIdx}: Reusing "${refFile}" from Level ${refLevel}, Frame ${refFrame}`);
            continue;
          } else {
            console.warn(`⚠️  Reuse failed: Level ${refLevel}, Frame ${refFrame} not yet selected for Level ${level}, Frame ${frameIdx}`);
            console.warn(`⚠️  Make sure reference frames come before frames that reuse them (lower level/frame number)`);
            // Fall through to normal selection
          }
        }

        const candidates = levelGroups.get(level)?.get(frameIdx);

        if (!candidates || candidates.length === 0) {
          console.warn(`⚠️  No files found for level ${level}, frame ${frameIdx}`);
          continue;
        }

        // Random selection using secure random
        const randomIndex = Math.floor(getSecureRandom() * candidates.length);
        const selectedFile = candidates[randomIndex];
        levelFrameMap.set(frameIdx, selectedFile);

        if (candidates.length > 1) {
          console.log(`🎲 Level ${level}, Frame ${frameIdx}: Selected "${selectedFile}" from ${candidates.length} candidates`);
        }
      }
    }

    return selectedFiles;
  } catch (error) {
    console.error(`Error scanning wildcard level frames:`, error);
    return null;
  }
};

/**
 * Scan folder for wildcard sprite sheet files in sprite-sheet-per-level mode.
 * Supports multiple files with the same level suffix for random selection.
 *
 * @param urlFolder - Folder path to scan
 * @param framePattern - Pattern with wildcard (e.g., "*_{n}.png")
 * @param contributionLevels - Number of contribution levels
 * @returns Map of level -> selected filename, or null if error/not wildcard
 *
 * @example
 * ```typescript
 * // Files: warrior_0.png, mage_0.png, warrior_1.png
 * const levelMap = await scanWildcardSpriteSheetPerLevel('./assets', '*_{n}.png', 5);
 * // Returns: Map { 0 => 'warrior_0.png' or 'mage_0.png', 1 => 'warrior_1.png', ... }
 * ```
 */
export const scanWildcardSpriteSheetPerLevel = async (
  urlFolder: string,
  framePattern: string,
  contributionLevels: number
): Promise<Map<number, string> | null> => {
  try {
    // Validate pattern format (sprite sheet per level only)
    if (!validateFramePattern(framePattern, true, true)) {
      console.error(`❌ Invalid framePattern for sprite sheet per level mode: "${framePattern}"`);
      console.error(`   Sprite sheet per level patterns MUST end with _{n}.ext (e.g., "sprite_{n}.png")`);
      console.error(`   Format: prefix_{level}.ext`);
      return null;
    }

    // Check if this is a wildcard pattern
    if (!framePattern.includes('*')) {
      return null; // Not a wildcard pattern, use exact match mode
    }

    // Validate that framePattern contains at most one wildcard
    const wildcardCount = (framePattern.match(/\*/g) || []).length;
    if (wildcardCount > 1) {
      console.error(
        `❌ Invalid framePattern: "${framePattern}" contains ${wildcardCount} wildcards. ` +
        `Only ONE wildcard (*) is supported per pattern. ` +
        `Examples: "*_{n}.png"`
      );
      return null;
    }

    // Dynamic import
    const fs = await import('fs');
    const path = await import('path');

    // Resolve and validate path
    const workspaceRoot = process.env.GITHUB_WORKSPACE || process.cwd();
    const resolvedWorkspaceRoot = path.resolve(workspaceRoot);
    const absoluteFolder = path.resolve(urlFolder);

    if (!isPathWithinWorkspace(path, resolvedWorkspaceRoot, absoluteFolder)) {
      console.error(`⚠️  Security: Path traversal detected in wildcard sprite sheet scan!`);
      return null;
    }

    if (!fs.existsSync(absoluteFolder)) {
      console.error(`Folder not found for wildcard sprite sheet scan: ${urlFolder}`);
      return null;
    }

    // Read directory
    const files = fs.readdirSync(absoluteFolder);

    // Build regex: *_{level}.ext -> ^.*_(\d+)\.ext$
    // Also support reuse syntax: *_{level}@{ref_level}.ext
    const patternAfterWildcard = framePattern.substring(framePattern.indexOf('*') + 1);
    const regexPattern = patternAfterWildcard
      .replace(/_{n}/g, '_(?<level>\\d+)')
      .replace(/\./g, '\\.');
    const regex = new RegExp(`^.*${regexPattern}$`);

    // Regex to detect reuse syntax: prefix_{level}@{ref_level}.ext
    const reuseRegex = new RegExp(`^.*_(?<level>\\d+)@(?<refLevel>\\d+)\\.`);

    // Group files by level
    const levelGroups: Map<number, string[]> = new Map();

    // Track reuse mappings: {level} -> {ref_level}
    const reuseMap = new Map<number, number>();

    for (const file of files) {
      // Check if this is a reuse directive
      const reuseMatch = file.match(reuseRegex);
      if (reuseMatch && reuseMatch.groups) {
        const level = parseInt(reuseMatch.groups.level, 10);
        const refLevel = parseInt(reuseMatch.groups.refLevel, 10);

        reuseMap.set(level, refLevel);
        console.log(`🔗 Reuse: Level ${level} -> Level ${refLevel}`);
        continue; // Don't add to levelGroups, it's just a directive
      }

      // Regular file matching
      const match = file.match(regex);
      if (match && match.groups?.level) {
        const level = parseInt(match.groups.level, 10);

        if (!levelGroups.has(level)) {
          levelGroups.set(level, []);
        }
        levelGroups.get(level)!.push(file);
      }
    }

    // Randomly select one file for each level
    const selectedFiles = new Map<number, string>();

    for (let level = 0; level < contributionLevels; level++) {
      // Check if this level should reuse another level
      if (reuseMap.has(level)) {
        const refLevel = reuseMap.get(level)!;
        const refFile = selectedFiles.get(refLevel);

        if (refFile) {
          selectedFiles.set(level, refFile);
          console.log(`♻️  Level ${level}: Reusing "${refFile}" from Level ${refLevel}`);
          continue;
        } else {
          console.warn(`⚠️  Reuse failed: Level ${refLevel} not yet selected for Level ${level}`);
          console.warn(`⚠️  Make sure reference levels come before levels that reuse them (lower level number)`);
          // Fall through to normal selection
        }
      }

      const candidates = levelGroups.get(level);

      if (!candidates || candidates.length === 0) {
        console.warn(`⚠️  No sprite sheet file found for level ${level}`);
        continue;
      }

      // Random selection using secure random
      const randomIndex = Math.floor(getSecureRandom() * candidates.length);
      const selectedFile = candidates[randomIndex];
      selectedFiles.set(level, selectedFile);

      if (candidates.length > 1) {
        console.log(`🎲 Level ${level}: Selected "${selectedFile}" from ${candidates.length} candidates: [${candidates.join(', ')}]`);
      }
    }

    return selectedFiles;
  } catch (error) {
    console.error(`Error scanning wildcard sprite sheet files:`, error);
    return null;
  }
};

/**
 * Generate frame URL with level and frame number replacement.
 * Supports both exact match and wildcard modes.
 *
 * Handles two formats:
 * 1. Individual frames: prefix_{level}-{frame}.ext
 * 2. Sprite sheet per level: prefix_{level}.ext
 *
 * Separator usage:
 * - Underscore before level number
 * - Hyphen between level and frame (only for individual frames)
 *
 * @param urlFolder - Base folder path
 * @param framePattern - Pattern with _{n}-{n} or _{n} placeholders
 *                       Can include wildcard: *_{n}.png, *_{n}-{n}.png
 *                       IMPORTANT: Only ONE wildcard (*) is supported per pattern
 * @param level - Contribution level (0-4)
 * @param frameIndex - Frame number within the level (ignored for sprite sheet per level)
 * @returns Full URL path
 * @throws Error if framePattern contains more than one wildcard
 *
 * @example
 * ```typescript
 * // Individual frames - exact match
 * generateLevelFrameUrl('./assets', 'sprite_{n}-{n}.png', 1, 5)
 * // Returns: './assets/sprite_1-5.png'
 *
 * // Individual frames - wildcard (used with scanWildcardLevelFrames)
 * generateLevelFrameUrl('./assets', '*_{n}-{n}.png', 1, 5)
 * // Returns: './assets/_{n}-{n}.png' (for fallback only, wildcard mode should use scanWildcardLevelFrames)
 *
 * // Sprite sheet per level - exact match
 * generateLevelFrameUrl('./assets', 'sprite_{n}.png', 2, 0)
 * // Returns: './assets/sprite_2.png'
 *
 * // Sprite sheet per level - wildcard (used with scanWildcardSpriteSheetPerLevel)
 * generateLevelFrameUrl('./assets', '*_{n}.png', 2, 0)
 * // Returns: './assets/_{n}.png' (for fallback only, wildcard mode should use scanWildcardSpriteSheetPerLevel)
 * ```
 */
export const generateLevelFrameUrl = (
  urlFolder: string,
  framePattern: string,
  level: number,
  frameIndex: number
): string => {
  // Validate that framePattern contains at most one wildcard
  const wildcardCount = (framePattern.match(/\*/g) || []).length;
  if (wildcardCount > 1) {
    throw new Error(
      `Invalid framePattern: "${framePattern}" contains ${wildcardCount} wildcards. ` +
      `Only ONE wildcard (*) is supported per pattern. ` +
      `Examples: "*_{n}.png", "*_{n}-{n}.png"`
    );
  }

  const normalizedFolder = urlFolder.replace(/\/$/, '');

  // Remove wildcard if present (for exact match mode fallback)
  // Using replaceAll to ensure consistent handling of any wildcard
  let filename = framePattern.replaceAll('*', '');

  // Check if this is sprite sheet per level mode (only one {n})
  const isSpriteSheetPerLevel = !filename.includes('-{n}');

  if (isSpriteSheetPerLevel) {
    // Sprite sheet per level: prefix_{level}.ext
    // Only replace single {n} with level number
    filename = filename.replace('{n}', level.toString());
  } else {
    // Individual frames: prefix_{level}-{frame}.ext
    // Replace first {n} with level number
    filename = filename.replace('{n}', level.toString());
    // Replace second {n} with frame number
    filename = filename.replace('{n}', frameIndex.toString());
  }

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
export const resolveImageMode = async (config: CounterImageConfig): Promise<{
  mode: 'single' | 'sprite-sheet' | 'multi-file';
  frameUrls?: string[];
  spriteUrl?: string;
}> => {
  if (!validateImageConfig(config)) {
    throw new Error('Invalid CounterImageConfig');
  }

  // Multi-file mode: separate images in a folder
  if (config.urlFolder) {
    const framesPerLevelValue = config.sprite?.framesPerLevel;
    const frameCount = (typeof framesPerLevelValue === 'number' ? framesPerLevelValue : 1);
    const framePattern = config.framePattern || 'frame-{n}.png';

    // Validate frame pattern (non-level mode)
    if (!validateFramePattern(framePattern, false)) {
      throw new Error(
        `Invalid framePattern: "${framePattern}". ` +
        `Frame patterns MUST end with -{n}.ext (e.g., "sprite-{n}.png")`
      );
    }

    const frameUrls = await generateFrameUrls(config.urlFolder, framePattern, frameCount);

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

// Escape text for safe insertion into SVG/XML
const escapeXml = (s: string): string =>
  s.replace(/[&<>"']/g, ch =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" } as const)[ch]!
  );

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
    if (!isPathWithinWorkspace(path, resolvedWorkspaceRoot, absolutePath)) {
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

