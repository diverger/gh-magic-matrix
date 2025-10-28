/**
 * XML and SVG utility functions for creating structured markup.
 */

/**
 * Creates an SVG or XML element with attributes.
 *
 * @param tagName - The name of the XML/SVG element.
 * @param attributes - Object containing attribute key-value pairs.
 * @returns A string representation of the XML element.
 *
 * @example
 * ```typescript
 * createElement('rect', { x: 10, y: 20, width: 100, height: 50 })
 * // Returns: '<rect x="10" y="20" width="100" height="50"/>'
 * ```
 */
export const createElement = (tagName: string, attributes: Record<string, any>): string => {
  return `<${tagName} ${convertToAttributes(attributes)}/>`;
};

/**
 * Converts an object to XML/SVG attribute string format.
 *
 * @param attributes - Object containing attribute key-value pairs.
 * @returns A string of formatted attributes.
 *
 * @example
 * ```typescript
 * convertToAttributes({ x: 10, y: null, class: 'rect' })
 * // Returns: 'x="10" class="rect"'
 * ```
 */
export const convertToAttributes = (attributes: Record<string, any>): string => {
  return Object.entries(attributes)
    .filter(([, value]) => value !== null && value !== undefined)
    .map(([name, value]) => `${name}="${String(value).replace(/"/g, '&quot;')}"`)
    .join(" ");
};

/**
 * Escapes special XML characters in text content.
 *
 * @param text - The text to escape.
 * @returns The escaped text safe for XML content.
 */
export const escapeXml = (text: string): string => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

/**
 * Creates an SVG container element with proper namespace and structure.
 *
 * @param options - SVG configuration options.
 * @returns The opening SVG tag with attributes.
 */
export const createSvgContainer = (options: {
  viewBox: string;
  width: number;
  height: number;
  className?: string;
}): string => {
  const attributes: Record<string, any> = {
    viewBox: options.viewBox,
    width: options.width,
    height: options.height,
    xmlns: "http://www.w3.org/2000/svg",
    class: options.className,
  };

  return createElement("svg", attributes).replace("/>", ">");
};

/**
 * Checks if a point (x, y) is outside the grid boundaries.
 *
 * @param x - X coordinate of the point.
 * @param y - Y coordinate of the point.
 * @param width - Width of the grid.
 * @param height - Height of the grid.
 * @returns True if the point is outside the grid, false otherwise.
 *
 * @example
 * ```typescript
 * isOutsideGrid(5, 5, 10, 10) // Returns: false (inside grid)
 * isOutsideGrid(-1, 5, 10, 10) // Returns: true (outside grid)
 * isOutsideGrid(10, 5, 10, 10) // Returns: true (outside grid, x >= width)
 * ```
 */
export const isOutsideGrid = (x: number, y: number, width: number, height: number): boolean => {
  return x < 0 || y < 0 || x >= width || y >= height;
};