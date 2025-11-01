/**
 * Output Options Parser
 *
 * Parses and validates GitHub Action output configurations.
 * Supports both URL query parameters and JSON object notation for flexible configuration.
 *
 * @module outputs-options
 */

import type { ColorPalette } from "./palettes";
import { palettes } from "./palettes";

/**
 * SVG rendering options configuration.
 */
export interface SvgDrawOptions {
  /** Size of each grid cell in pixels */
  sizeCell: number;
  /** Size of contribution dots in pixels */
  sizeDot: number;
  /** Border radius for dots */
  sizeDotBorderRadius: number;
  /** Border color for contribution dots */
  colorDotBorder: string;
  /** Color for empty cells */
  colorEmpty: string;
  /** Snake path color */
  colorSnake: string;
  /** Array of colors for contribution levels */
  colorDots: string[];
  /** Optional dark theme colors */
  dark?: {
    colorDotBorder: string;
    colorEmpty: string;
    colorSnake: string;
    colorDots: string[];
  };
  /** Use custom snake (emoji/image/text) instead of rectangles */
  useCustomSnake?: boolean;
  /** Custom snake configuration (supports emoji, images, and text) */
  customSnakeConfig?: {
    /**
     * Array of content for each segment
     * Supports: emoji ('🐍'), text ('A'), or image URLs ('https://...')
     * Example: ['🐍', '🟢', '🟡']
     *
     * Note: Function variant ((index, total) => content) is only available programmatically
     * and cannot be configured via query parameters or JSON config.
     */
    segments?: string[] | ((segmentIndex: number, totalLength: number) => string);
    /** Default content for unspecified segments (default: 🟢) */
    defaultContent?: string;
  };
}

/**
 * Animation timing and behavior options.
 */
export interface AnimationOptions {
  /** Animation step size (frames to skip) */
  step: number;
  /** Duration per frame in milliseconds */
  frameDuration: number;
  /** Optional contribution counter configuration */
  contributionCounter?: {
    enabled: boolean;
    /** Array of counter displays (for showing multiple counters) */
    displays?: Array<{
      position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'follow' | 'free';
      text?: string; // Fixed text mode (if set, only this text is shown)
      prefix?: string;
      suffix?: string;
      showCount?: boolean;
      showPercentage?: boolean;
      fontSize?: number;
      fontFamily?: string;
      color?: string;
      fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | number;
      fontStyle?: 'normal' | 'italic';
      image?: {
        url: string;
        width: number;
        height: number;
        offsetY?: number;
        anchor?: 'top-left' | 'top-center' | 'top-right'
               | 'center-left' | 'center' | 'center-right'
               | 'bottom-left' | 'bottom-center' | 'bottom-right';
        anchorX?: number;
        anchorY?: number;
        sprite?: {
          frames: number;
          frameWidth?: number;
          frameHeight?: number;
          frameDuration?: number;
          layout?: 'horizontal' | 'vertical';
          mode?: 'sync' | 'loop';
          duration?: number;
          fps?: number;
        };
      };
    }>;
    contributionMap?: Map<string, number>; // Map from "x,y" coordinates to contribution count
    /** Color map for gradient (level -> hex color) */
    colorDots?: Record<number, string>;
    /** Hide the progress bar (opacity: 0, but still in DOM for follow mode positioning) */
    hideProgressBar?: boolean;
    /** Enable debug logging for counter rendering */
    debug?: boolean;
  };
}

/**
 * Parsed output configuration for a single file.
 */
export interface OutputConfig {
  /** Output file path */
  filename: string;
  /** Output format (svg only) */
  format: "svg";
  /** Drawing/styling options */
  drawOptions: SvgDrawOptions;
  /** Animation timing options */
  animationOptions: AnimationOptions;
}

/**
 * Parses multiple output option strings into configurations.
 *
 * @param lines - Array of output configuration strings.
 * @returns Array of parsed output configurations (null for invalid entries).
 *
 * @example
 * ```typescript
 * const outputs = parseOutputsOption([
 *   "dist/snake.svg?palette=github-dark",
 *   "dist/snake-light.svg?step=2&frameDuration=200"
 * ]);
 * ```
 */
export const parseOutputsOption = (lines: string[]): (OutputConfig | null)[] => {
  return lines.map(parseEntry);
};

/**
 * Parses a single output option string into a configuration object.
 *
 * Supports both URL query parameter syntax and JSON object syntax:
 * - Query params: `file.svg?palette=github-dark&step=2`
 * - JSON object: `file.svg {"palette": "github-dark", "step": 2}`
 *
 * @param entry - The output configuration string to parse.
 * @returns Parsed output configuration or null if invalid.
 */
export const parseEntry = (entry: string): OutputConfig | null => {
  const trimmedEntry = entry.trim();
  if (!trimmedEntry) return null;

  // Match filename.svg with optional query params or JSON config
  // Use non-greedy match for JSON to avoid consuming embedded braces
  const match = trimmedEntry.match(/^(.+\.svg)(\?(.*)|\s+({.*?}))?$/);
  if (!match) return null;

  const [, filename, , queryString, jsonString] = match;

  let searchParams = new URLSearchParams();

  // Try to parse as JSON first, then fall back to query parameters
  if (jsonString) {
    try {
      const jsonConfig = JSON.parse(jsonString);

      // Ensure all values are strings for URLSearchParams
      // Convert arrays to comma-separated strings
      // Convert objects and other non-string values to strings
      const flatConfig = Object.fromEntries(
        Object.entries(jsonConfig).map(([key, value]) => {
          if (Array.isArray(value)) {
            return [key, value.join(",")];
          }
          return [key, String(value)];
        })
      );

      searchParams = new URLSearchParams(flatConfig as Record<string, string>);
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      console.warn(`Failed to parse JSON config for ${filename}: ${error.message}`);
      return null;
    }
  } else if (queryString) {
    searchParams = new URLSearchParams(queryString);
  }

  // Create default options
  const defaultPalette = getDefaultPaletteOptions("default");
  const drawOptions: SvgDrawOptions = {
    sizeDotBorderRadius: 2,
    sizeCell: 16,
    sizeDot: 12,
    colorDotBorder: defaultPalette.colorDotBorder!,
    colorEmpty: defaultPalette.colorEmpty!,
    colorSnake: defaultPalette.colorSnake!,
    colorDots: defaultPalette.colorDots!,
    dark: defaultPalette.dark,
  };

  const animationOptions: AnimationOptions = {
    step: 1,
    frameDuration: 100, // SNK default: 100ms per frame for proper speed
  };

  // Apply palette configuration
  applyPaletteOptions(drawOptions, searchParams);

  // Apply individual color overrides
  applyColorOverrides(drawOptions, searchParams);

  // Apply animation options
  applyAnimationOptions(animationOptions, searchParams);

  // Apply custom snake options
  applyCustomSnakeOptions(drawOptions, searchParams);

  // Snake action only supports SVG format
  return {
    filename,
    format: "svg" as const,
    drawOptions,
    animationOptions,
  };
};

/**
 * Gets default palette options for the specified palette name.
 *
 * @param paletteName - Name of the palette to use.
 * @returns Default drawing options for the palette.
 */
const getDefaultPaletteOptions = (paletteName: string): Partial<SvgDrawOptions> => {
  const palette = palettes[paletteName] || palettes["default"];
  return {
    colorDotBorder: palette.colorDotBorder,
    colorEmpty: palette.colorEmpty,
    colorSnake: palette.colorSnake,
    colorDots: [...palette.colorDots],
  };
};

/**
 * Applies palette configuration from search parameters.
 *
 * @param drawOptions - The drawing options to modify.
 * @param searchParams - URL search parameters containing palette config.
 */
const applyPaletteOptions = (drawOptions: SvgDrawOptions, searchParams: URLSearchParams): void => {
  // Apply main palette
  const paletteParam = searchParams.get("palette");
  if (paletteParam && palettes[paletteParam]) {
    const palette = palettes[paletteParam];
    Object.assign(drawOptions, getDefaultPaletteOptions(paletteParam));
  }

  // Apply dark palette override
  const darkPaletteParam = searchParams.get("dark_palette");
  if (darkPaletteParam && palettes[darkPaletteParam]) {
    const darkPalette = palettes[darkPaletteParam];
    drawOptions.dark = {
      colorDotBorder: darkPalette.colorDotBorder,
      colorEmpty: darkPalette.colorEmpty,
      colorSnake: darkPalette.colorSnake,
      colorDots: [...darkPalette.colorDots],
    };
  }
};

/**
 * Applies individual color overrides from search parameters.
 *
 * @param drawOptions - The drawing options to modify.
 * @param searchParams - URL search parameters containing color overrides.
 *
 * @remarks
 * Light theme overrides do not clear dark theme settings.
 * Dark theme must be explicitly overridden with dark_* parameters or will inherit from palette.
 */
const applyColorOverrides = (drawOptions: SvgDrawOptions, searchParams: URLSearchParams): void => {
  // Light theme color overrides
  if (searchParams.has("color_snake")) {
    drawOptions.colorSnake = searchParams.get("color_snake")!;
  }

  if (searchParams.has("color_dots")) {
    const colors = searchParams.get("color_dots")!.split(/[,;]/);
    drawOptions.colorDots = colors;
    drawOptions.colorEmpty = colors[0];
    // Note: Dark theme is preserved; override separately with dark_color_dots if needed
  }

  if (searchParams.has("color_dot_border")) {
    drawOptions.colorDotBorder = searchParams.get("color_dot_border")!;
  }

  // Dark theme color overrides
  // Initialize dark theme if any dark_* parameter is provided
  const hasDarkOverrides = searchParams.has("dark_color_dots") ||
                           searchParams.has("dark_color_dot_border") ||
                           searchParams.has("dark_color_snake");

  if (hasDarkOverrides && !drawOptions.dark) {
    // Initialize dark theme with light theme defaults if not already set
    drawOptions.dark = {
      colorDotBorder: drawOptions.colorDotBorder,
      colorEmpty: drawOptions.colorEmpty,
      colorSnake: drawOptions.colorSnake,
      colorDots: [...drawOptions.colorDots],
    };
  }

  if (searchParams.has("dark_color_dots")) {
    const colors = searchParams.get("dark_color_dots")!.split(/[,;]/);
    if (drawOptions.dark) {
      drawOptions.dark.colorDots = colors;
      drawOptions.dark.colorEmpty = colors[0];
    }
  }

  if (searchParams.has("dark_color_dot_border") && drawOptions.dark) {
    drawOptions.dark.colorDotBorder = searchParams.get("dark_color_dot_border")!;
  }

  if (searchParams.has("dark_color_snake") && drawOptions.dark) {
    drawOptions.dark.colorSnake = searchParams.get("dark_color_snake")!;
  }
};

/**
 * Applies animation options from search parameters.
 *
 * @param animationOptions - The animation options to modify.
 * @param searchParams - URL search parameters containing animation config.
 */
const applyAnimationOptions = (animationOptions: AnimationOptions, searchParams: URLSearchParams): void => {
  if (searchParams.has("step")) {
    const step = parseInt(searchParams.get("step")!, 10);
    if (!isNaN(step) && step > 0) {
      animationOptions.step = step;
    }
  }

  if (searchParams.has("frame_duration")) {
    const frameDuration = parseInt(searchParams.get("frame_duration")!, 10);
    if (!isNaN(frameDuration) && frameDuration > 0) {
      animationOptions.frameDuration = frameDuration;
    }
  }

  if (searchParams.has("hide_progress_bar")) {
    const hide_progress_bar = searchParams.get("hide_progress_bar")!;
    // Treat empty string, "true", or "1" as true; otherwise false
    // Empty string handles: ?hide_progress_bar or ?hide_progress_bar=
    const hideValue = hide_progress_bar === "" || hide_progress_bar === "true" || hide_progress_bar === "1";

    // Ensure contributionCounter exists
    if (!animationOptions.contributionCounter) {
      animationOptions.contributionCounter = { enabled: true };
    }

    // Set hideProgressBar in contributionCounter where rendering code expects it
    animationOptions.contributionCounter.hideProgressBar = hideValue;
  }
};
/**
 * Applies custom snake options from search parameters.
 *
 * Supported parameters:
 * - `use_custom_snake`: Enable custom snake mode (true/false or 1/0)
 * - `custom_snake_segments`: Comma-separated list of content (emoji/text/URLs)
 * - `custom_snake_default`: Default content for unspecified segments
 *
 * @param drawOptions - The drawing options to modify.
 * @param searchParams - URL search parameters containing custom snake config.
 *
 * @example
 * ```
 * ?use_custom_snake=true&custom_snake_segments=,,,
 * ?use_custom_snake=1&custom_snake_segments=A,B,C&custom_snake_default=X
 * ```
 */
const applyCustomSnakeOptions = (drawOptions: SvgDrawOptions, searchParams: URLSearchParams): void => {
  // Check if custom snake mode is enabled
  if (searchParams.has("use_custom_snake")) {
    const useCustomSnake = searchParams.get("use_custom_snake")!;
    // Treat empty string, "true", or "1" as true; otherwise false
    const isEnabled = useCustomSnake === "" || useCustomSnake === "true" || useCustomSnake === "1";

    if (isEnabled) {
      drawOptions.useCustomSnake = true;

      // Initialize customSnakeConfig if not already set
      if (!drawOptions.customSnakeConfig) {
        drawOptions.customSnakeConfig = {};
      }

      // Parse segments from comma-separated string
      if (searchParams.has("custom_snake_segments")) {
        const segmentsParam = searchParams.get("custom_snake_segments")!;
        // Split by comma and trim whitespace from each segment
        const segments = segmentsParam.split(',').map(s => s.trim()).filter(s => s.length > 0);
        if (segments.length > 0) {
          drawOptions.customSnakeConfig.segments = segments;
        }
      }

      // Set default content
      if (searchParams.has("custom_snake_default")) {
        drawOptions.customSnakeConfig.defaultContent = searchParams.get("custom_snake_default")!;
      } else if (!drawOptions.customSnakeConfig.defaultContent) {
        // Default to green circle if not specified
        drawOptions.customSnakeConfig.defaultContent = "🟢";
      }
    }
  }
};
