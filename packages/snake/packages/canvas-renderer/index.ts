/**
 * @snake/canvas-renderer - Canvas rendering utilities for grids, snakes, and visual elements
 *
 * This package provides comprehensive rendering utilities for rendering game elements
 * on HTML5 Canvas. It includes renderers for grids, snakes, stacks, and complete
 * world scenes with support for animations and visual effects.
 */

// Core utilities
export * from "./canvas-utils";

// Individual renderers
export * from "./grid-renderer";
export * from "./snake-renderer";
export * from "./circular-stack";

// Complete world rendering
export * from "./world-renderer";

// Re-export types for convenience
export type { GridRenderOptions } from "./grid-renderer";
export type { SnakeRenderOptions } from "./snake-renderer";
export type { CircularStackRenderOptions } from "./circular-stack";
export type { WorldRenderOptions } from "./world-renderer";