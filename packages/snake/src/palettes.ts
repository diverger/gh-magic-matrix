/**
 * Color Palettes Configuration
 *
 * Defines color schemes for GitHub contribution visualizations.
 * Supports both light and dark themes with GitHub's official color schemes.
 *
 * @module palettes
 */

/**
 * Base color palette configuration for contribution visualization.
 */
export interface ColorPalette {
  /** Border color for contribution dots */
  colorDotBorder: string;
  /** Color for empty/no-contribution cells */
  colorEmpty: string;
  /** Snake path color */
  colorSnake: string;
  /** Array of colors for different contribution levels (0-4) */
  colorDots: string[];
  /**
   * Optional array of colors for individual snake segments or function to generate colors
   * - Array: ['#ff0000', '#00ff00', '#0000ff'] - specific color for each segment (index 0 = head)
   * - Function: (index, total) => color - dynamically generate color for each segment
   * If provided, overrides colorSnake
   * If array is shorter than snake length, remaining segments use the last color
   */
  colorSnakeSegments?: string[] | ((segmentIndex: number, totalLength: number) => string);
}

/**
 * Base color palettes matching GitHub's contribution graph styling.
 *
 * Provides accurate color schemes that match the GitHub contribution graph
 * for both light and dark themes.
 */
export const basePalettes: Record<string, ColorPalette> = {
  "github-light": {
    colorDotBorder: "#1b1f230a",
    colorEmpty: "#ebedf0",
    colorDots: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
    colorSnake: "#a855f7",
  },

  "github-dark": {
    colorDotBorder: "#1b1f230a",
    colorEmpty: "#161b22",
    colorDots: ["#161b22", "#01311f", "#034525", "#0f6d31", "#00c647"],
    colorSnake: "#a855f7",
  },

  "ocean": {
    colorDotBorder: "#0f172a",
    colorEmpty: "#0f172a",
    colorDots: ["#0f172a", "#164e63", "#0891b2", "#06b6d4", "#67e8f9"],
    colorSnake: "#f59e0b",
  },

  "forest": {
    colorDotBorder: "#14532d",
    colorEmpty: "#14532d",
    colorDots: ["#14532d", "#166534", "#15803d", "#16a34a", "#22c55e"],
    colorSnake: "#dc2626",
  },

  // Example with rainbow gradient snake segments
  "rainbow": {
    colorDotBorder: "#1b1f230a",
    colorEmpty: "#ebedf0",
    colorDots: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
    colorSnake: "#a855f7",
    colorSnakeSegments: ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"],
  },

  // Example with gradient function (purple to pink)
  "gradient": {
    colorDotBorder: "#1b1f230a",
    colorEmpty: "#161b22",
    colorDots: ["#161b22", "#01311f", "#034525", "#0f6d31", "#00c647"],
    colorSnake: "#a855f7",
    colorSnakeSegments: (index: number, total: number) => {
      // Gradient from purple to pink
      const ratio = index / Math.max(total - 1, 1);
      const r = Math.round(168 + (236 - 168) * ratio);
      const g = Math.round(85 + (72 - 85) * ratio);
      const b = Math.round(247 + (153 - 247) * ratio);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    },
  },
};

/**
 * Extended palette collection with aliases for convenience.
 *
 * Includes base palettes plus convenient aliases for common use cases.
 */
export const palettes: Record<string, ColorPalette> = {
  ...basePalettes,
  // Convenient aliases
  "github": basePalettes["github-light"],
  "default": basePalettes["github-light"],
};

/**
 * Get a color palette by name with fallback to default.
 *
 * @param paletteName - The name of the palette to retrieve.
 * @returns The color palette configuration.
 *
 * @example
 * ```typescript
 * const palette = getPalette("github-dark");
 * const colors = palette.colorDots;
 * ```
 */
export const getPalette = (paletteName: string): ColorPalette => {
  return palettes[paletteName] || palettes["default"];
};

/**
 * Get available palette names.
 *
 * @returns Array of available palette names.
 */
export const getAvailablePalettes = (): string[] => {
  return Object.keys(palettes);
};