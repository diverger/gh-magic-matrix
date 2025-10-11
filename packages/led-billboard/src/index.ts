/**
 * LED Billboard - Convert SVG images to animated pixel-style LED display
 * Supports dynamic frame-by-frame animation with customizable matrix size
 */

export interface LEDMatrixConfig {
  width: number;
  height: number;
  cellSize: number;
  cellGap: number;
  cellRadius: number;
  backgroundColor: string;
  ledOnColor: string;
  ledOffColor: string;
  stretch: boolean; // Whether to stretch to fill matrix or maintain aspect ratio
}

export interface Frame {
  pixels: boolean[][];
  duration: number; // Duration in milliseconds
}

/**
 * Parse SVG content to extract pixel data
 * This is a simplified version - you can extend it to parse actual SVG elements
 */
export function parseSVGToPixels(
  svgContent: string,
  width?: number,
  height?: number,
  stretch: boolean = true
): { pixels: boolean[][]; inferredWidth: number; inferredHeight: number } {
  // Try to infer dimensions from SVG viewBox or width/height attributes
  const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/);
  const widthMatch = svgContent.match(/width=["'](\d+)["']/);
  const heightMatch = svgContent.match(/height=["'](\d+)["']/);

  let inferredWidth = width || 32; // Default 32x32
  let inferredHeight = height || 32;
  let sourceWidth = 320; // Default source dimensions
  let sourceHeight = 320;

  if (viewBoxMatch) {
    const [, , , w, h] = viewBoxMatch[1].split(/\s+/).map(Number);
    if (w && h) {
      sourceWidth = w;
      sourceHeight = h;
      if (!width || !height) {
        // Auto-detect dimensions
        inferredWidth = width || Math.round(w / 10); // Scale down
        inferredHeight = height || Math.round(h / 10);
      }
    }
  } else if (widthMatch && heightMatch) {
    sourceWidth = parseInt(widthMatch[1]);
    sourceHeight = parseInt(heightMatch[1]);
    if (!width || !height) {
      inferredWidth = width || Math.round(sourceWidth / 10);
      inferredHeight = height || Math.round(sourceHeight / 10);
    }
  }

  // Handle aspect ratio when stretch is disabled
  if (!stretch && (width || height)) {
    const sourceAspect = sourceWidth / sourceHeight;
    if (width && height) {
      // Both dimensions specified - fit within bounds maintaining aspect ratio
      const targetAspect = width / height;
      if (sourceAspect > targetAspect) {
        // Source is wider - fit to width
        inferredWidth = width;
        inferredHeight = Math.round(width / sourceAspect);
      } else {
        // Source is taller - fit to height
        inferredHeight = height;
        inferredWidth = Math.round(height * sourceAspect);
      }
    } else if (width) {
      // Only width specified - scale height proportionally
      inferredWidth = width;
      inferredHeight = Math.round(width / sourceAspect);
    } else if (height) {
      // Only height specified - scale width proportionally
      inferredHeight = height;
      inferredWidth = Math.round(height * sourceAspect);
    }
  } else if (width && height) {
    // Stretch mode - use specified dimensions exactly
    inferredWidth = width;
    inferredHeight = height;
  }

  // Create empty pixel grid
  const pixels: boolean[][] = Array(inferredHeight)
    .fill(null)
    .map(() => Array(inferredWidth).fill(false));

  // For now, we'll create a simple pattern
  // In a real implementation, you'd parse SVG paths/shapes and rasterize them
  // This is a placeholder that creates a border pattern
  for (let y = 0; y < inferredHeight; y++) {
    for (let x = 0; x < inferredWidth; x++) {
      // Create a simple test pattern
      if (x === 0 || x === inferredWidth - 1 || y === 0 || y === inferredHeight - 1) {
        pixels[y][x] = true;
      }
    }
  }

  return { pixels, inferredWidth, inferredHeight };
}

/**
 * Generate LED billboard SVG with animation
 */
export function generateLEDBillboard(
  frames: Frame[],
  config: LEDMatrixConfig,
  animationDuration: number = 3000 // Total animation duration in ms
): string {
  const { width, height, cellSize, cellGap, cellRadius, backgroundColor, ledOnColor, ledOffColor } = config;

  const totalWidth = width * cellSize + (width - 1) * cellGap;
  const totalHeight = height * cellSize + (height - 1) * cellGap;

  const svgWidth = totalWidth;
  const svgHeight = totalHeight;

  let svg = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${svgWidth}" height="${svgHeight}" fill="${backgroundColor}"/>
  <defs>
    <style>
      @keyframes blink {
        0%, 100% { opacity: 0.2; }
        50% { opacity: 1; }
      }
    </style>
  </defs>
`;

  // Create LED cells
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cx = x * (cellSize + cellGap) + cellSize / 2;
      const cy = y * (cellSize + cellGap) + cellSize / 2;
      const ledId = `led-${y}-${x}`;

      // Determine if this LED should be on in any frame
      const isActiveInAnyFrame = frames.some(frame => frame.pixels[y]?.[x]);

      if (isActiveInAnyFrame) {
        // Create animated LED
        svg += `  <circle id="${ledId}" cx="${cx}" cy="${cy}" r="${cellSize / 2}" rx="${cellRadius}" ry="${cellRadius}">
    <animate attributeName="fill" dur="${animationDuration}ms" repeatCount="indefinite" values="${generateAnimationValues(frames, y, x, ledOnColor, ledOffColor)}" keyTimes="${generateKeyTimes(frames, animationDuration)}"/>
  </circle>\n`;
      } else {
        // Static off LED
        svg += `  <circle cx="${cx}" cy="${cy}" r="${cellSize / 2}" fill="${ledOffColor}" opacity="0.2"/>\n`;
      }
    }
  }

  svg += `</svg>`;
  return svg;
}

/**
 * Generate animation values for LED fill color
 */
function generateAnimationValues(
  frames: Frame[],
  y: number,
  x: number,
  ledOnColor: string,
  ledOffColor: string
): string {
  const values = frames.map(frame => (frame.pixels[y]?.[x] ? ledOnColor : ledOffColor));
  values.push(values[0]); // Complete the loop
  return values.join(';');
}

/**
 * Generate keyTimes for animation
 */
function generateKeyTimes(frames: Frame[], totalDuration: number): string {
  let currentTime = 0;
  const keyTimes: number[] = [0];

  for (const frame of frames) {
    currentTime += frame.duration;
    keyTimes.push(currentTime / totalDuration);
  }

  // Ensure the last keyTime is exactly 1
  keyTimes[keyTimes.length - 1] = 1;

  return keyTimes.map(t => t.toFixed(3)).join(';');
}

/**
 * Create a simple text-based pattern (fallback)
 */
export function createTextPattern(
  text: string,
  width: number,
  height: number
): boolean[][] {
  const pixels: boolean[][] = Array(height)
    .fill(null)
    .map(() => Array(width).fill(false));

  // Simple 5x7 text rendering (placeholder)
  // You can integrate with the existing pixelFont module
  const startX = Math.floor((width - text.length * 6) / 2);
  const startY = Math.floor((height - 7) / 2);

  for (let i = 0; i < text.length; i++) {
    const x = startX + i * 6;
    if (x >= 0 && x < width - 5) {
      // Draw a simple vertical line for each character (placeholder)
      for (let dy = 0; dy < 7 && startY + dy < height; dy++) {
        if (x >= 0 && startY + dy >= 0) {
          pixels[startY + dy][x] = true;
        }
      }
    }
  }

  return pixels;
}

/**
 * Main function to convert SVG files to LED billboard
 */
export function convertSVGToLEDBillboard(
  svgContents: string[],
  config: Partial<LEDMatrixConfig> = {},
  frameDurations?: number[]
): string {
  // Parse first SVG to infer dimensions if not provided
  const stretch = config.stretch ?? true; // Default to stretch mode
  const firstParse = parseSVGToPixels(svgContents[0], config.width, config.height, stretch);

  const finalConfig: LEDMatrixConfig = {
    width: config.width || firstParse.inferredWidth,
    height: config.height || firstParse.inferredHeight,
    cellSize: config.cellSize || 8,
    cellGap: config.cellGap || 2,
    cellRadius: config.cellRadius || 1,
    backgroundColor: config.backgroundColor || '#000000',
    ledOnColor: config.ledOnColor || '#00ff00',
    ledOffColor: config.ledOffColor || '#003300',
    stretch: stretch,
  };

  // Parse all SVGs to frames
  const frames: Frame[] = svgContents.map((svg, i) => {
    const { pixels } = parseSVGToPixels(svg, finalConfig.width, finalConfig.height, stretch);
    const duration = frameDurations?.[i] || 1000; // Default 1 second per frame
    return { pixels, duration };
  });

  const totalDuration = frames.reduce((sum, f) => sum + f.duration, 0);

  return generateLEDBillboard(frames, finalConfig, totalDuration);
}
