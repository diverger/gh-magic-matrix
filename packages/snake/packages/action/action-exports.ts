/**
 * Action Package
 *
 * GitHub Action package for generating snake contribution animations.
 * Provides the main entry point and all supporting utilities for creating
 * animated SVG visualizations of GitHub contribution data.
 *
 * @module action
 */

// Main generation function
export * from "./generate-contribution-snake";

// Configuration and options
export * from "./outputs-options";
export * from "./palettes";

// Utility functions
export * from "./user-contribution-to-grid";

// Type definitions for convenience
export type {
  OutputConfig,
  SvgDrawOptions,
  AnimationOptions,
} from "./outputs-options";

export type {
  ColorPalette,
} from "./palettes";

export type {
  GenerationOptions,
} from "./generate-contribution-snake";