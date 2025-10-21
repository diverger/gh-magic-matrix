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
  /** Optional dark theme variant */
  dark?: {
    colorDotBorder: string;
    colorEmpty: string;
    colorSnake: string;
    colorDots: string[];
  };
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
    colorDots: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
    colorEmpty: "#ebedf0",
    colorSnake: "#7c3aed", // Purple snake for better visibility
  },

  "github-dark": {
    colorDotBorder: "#1b1f230a",
    colorEmpty: "#0d1117", // Darker background for better contrast
    colorDots: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"], // Updated to match GitHub's actual dark theme
    colorSnake: "#f85149", // GitHub red for better visibility against dark background
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