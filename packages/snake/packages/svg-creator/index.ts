/**
 * SVG Creator Package
 *
 * Comprehensive SVG generation utilities for rendering animated game elements.
 * Provides modular components for creating SVG graphics with CSS animations,
 * including grid cells, snake movement, and stack visualizations.
 *
 * @module svg-creator
 */

// Core utilities
export * from "./svg-utils";
export * from "./css-utils";

// Rendering components
export * from "./svg-grid-renderer";
export * from "./svg-snake-renderer";
export * from "./svg-stack-renderer";

// Main SVG creation function
export * from "./create-svg";

// Type definitions for convenience
export type {
  SvgGridRenderOptions,
  SvgGridResult,
  AnimatedGridCell,
} from "./svg-grid-renderer";

export type {
  SvgSnakeConfig,
  SvgSnakeResult,
  SnakeColorConfig,
} from "./svg-snake-renderer";

export type {
  SvgStackConfig,
  SvgStackResult,
  StackData,
} from "./svg-stack-renderer";

export type {
  AnimationKeyframe,
} from "./css-utils";

export type {
  DrawOptions,
  AnimationOptions,
} from "./create-svg";