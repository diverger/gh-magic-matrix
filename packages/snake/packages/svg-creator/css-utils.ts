/**
 * CSS animation and styling utilities for SVG elements.
 */

/**
 * Converts a decimal number to a percentage string with optimized precision.
 *
 * @param value - A decimal value between 0 and 1.
 * @returns A percentage string (e.g., "50%" for 0.5).
 */
export const toPercentage = (value: number): string => {
  return parseFloat((value * 100).toFixed(2)).toString() + "%";
};

/**
 * Keyframe definition for CSS animations.
 */
export interface AnimationKeyframe {
  /** Time offset (0-1) when this keyframe occurs */
  t: number;
  /** CSS style declarations for this keyframe */
  style: string;
}

/**
 * Merges keyframes with identical styles to optimize animation definition.
 *
 * @param keyframes - Array of animation keyframes.
 * @returns Optimized keyframes grouped by style.
 */
const mergeKeyframes = (keyframes: AnimationKeyframe[]): Array<{ style: string; times: number[] }> => {
  const styleMap = new Map<string, number[]>();

  for (const { t, style } of keyframes) {
    const existing = styleMap.get(style) ?? [];
    styleMap.set(style, [...existing, t]);
  }

  return Array.from(styleMap.entries())
    .map(([style, times]) => ({ style, times }))
    .sort((a, b) => a.times[0] - b.times[0]);
};

/**
 * Creates a CSS keyframe animation from a list of keyframes.
 *
 * @param animationName - The name for the CSS animation.
 * @param keyframes - Array of keyframes defining the animation.
 * @returns A CSS @keyframes rule as a string.
 *
 * @example
 * ```typescript
 * createKeyframeAnimation('fadeIn', [
 *   { t: 0, style: 'opacity: 0' },
 *   { t: 1, style: 'opacity: 1' }
 * ])
 * // Returns: '@keyframes fadeIn{0%{opacity:0}100%{opacity:1}}'
 * ```
 */
export const createKeyframeAnimation = (
  animationName: string,
  keyframes: AnimationKeyframe[]
): string => {
  const mergedFrames = mergeKeyframes(keyframes);

  const keyframeRules = mergedFrames
    .map(({ style, times }) => {
      const timeSelectors = times.map(toPercentage).join(",");
      return `${timeSelectors}{${style}}`;
    })
    .join("");

  return `@keyframes ${animationName}{${keyframeRules}}`;
};

/**
 * Minifies CSS by removing unnecessary whitespace and characters.
 *
 * @param css - The CSS string to minify.
 * @returns Minified CSS string.
 *
 * @example
 * ```typescript
 * minifyCss('.class { color: red; background: blue; }')
 * // Returns: '.class{color:red;background:blue}'
 * ```
 */
export const minifyCss = (css: string): string => {
  return css
    // Normalize whitespace to single spaces
    .replace(/\s+/g, " ")
    // Remove spaces around CSS delimiters
    .replace(/\s*([,;:{}()])\s*/g, "$1")
    // Remove trailing semicolons before closing braces
    .replace(/;\s*}/g, "}")
    // Trim leading/trailing whitespace
    .trim();
};

/**
 * Generates CSS custom properties (variables) for color themes.
 *
 * @param colors - Object mapping color keys to CSS color values.
 * @param prefix - Optional prefix for variable names (default: "c").
 * @returns CSS custom property declarations.
 *
 * @example
 * ```typescript
 * generateColorVariables({ 1: '#ff0000', 2: '#00ff00' })
 * // Returns: '--c1:#ff0000;--c2:#00ff00;'
 * ```
 */
export const generateColorVariables = (
  colors: Record<string | number, string>,
  prefix: string = "c"
): string => {
  return Object.entries(colors)
    .map(([key, value]) => `--${prefix}${key}:${value}`)
    .join(";") + ";";
};

/**
 * Creates a CSS rule with selector and declarations.
 *
 * @param selector - CSS selector string.
 * @param declarations - CSS property declarations.
 * @returns Complete CSS rule.
 *
 * @example
 * ```typescript
 * createCssRule('.my-class', { color: 'red', 'font-size': '16px' })
 * // Returns: '.my-class{color:red;font-size:16px}'
 * ```
 */
export const createCssRule = (
  selector: string,
  declarations: Record<string, string | number>
): string => {
  const props = Object.entries(declarations)
    .map(([prop, value]) => `${prop}:${value}`)
    .join(";");

  return `${selector}{${props}}`;
};