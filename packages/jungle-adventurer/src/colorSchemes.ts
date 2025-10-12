/**
 * Color Schemes for Grid Cells
 * Each scheme has 5 colors: [empty, level1, level2, level3, level4]
 */

export interface ColorScheme {
  name: string;
  description: string;
  colors: [string, string, string, string, string];
}

export const COLOR_SCHEMES: Record<string, ColorScheme> = {
  'github-green': {
    name: 'GitHub Green',
    description: 'Classic GitHub contribution graph colors',
    colors: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
  },

  'github-dark': {
    name: 'GitHub Dark',
    description: 'GitHub dark mode colors',
    colors: ['#161b22', '#1c4532', '#00643b', '#29824e', '#3ba55d'],
  },

  'halloween': {
    name: 'Halloween',
    description: 'Spooky orange and purple theme',
    colors: ['#1a0a1f', '#4a1a4a', '#8b2d8b', '#d65f00', '#ff9500'],
  },

  'ocean': {
    name: 'Ocean',
    description: 'Deep blue ocean colors',
    colors: ['#0a1929', '#0d3a5f', '#115293', '#1976d2', '#42a5f5'],
  },

  'forest': {
    name: 'Forest',
    description: 'Natural forest green tones',
    colors: ['#1a2f1a', '#2d5016', '#4a7c2e', '#6ba547', '#8bc34a'],
  },

  'sunset': {
    name: 'Sunset',
    description: 'Warm sunset colors',
    colors: ['#1f1419', '#5c1a33', '#9c254d', '#d84a6b', '#ff6b9d'],
  },

  'candy': {
    name: 'Candy',
    description: 'Sweet candy colors',
    colors: ['#1a1a2e', '#6b2d5c', '#a73489', '#e91e63', '#ff4081'],
  },

  'matrix': {
    name: 'Matrix',
    description: 'Digital matrix green',
    colors: ['#000000', '#003300', '#00ff00', '#00ff66', '#00ff99'],
  },

  'arctic': {
    name: 'Arctic',
    description: 'Cool icy blues and whites',
    colors: ['#0f1419', '#1e3a5f', '#2196f3', '#64b5f6', '#90caf9'],
  },

  'lava': {
    name: 'Lava',
    description: 'Hot lava reds and oranges',
    colors: ['#1a0000', '#4a0000', '#cc0000', '#ff4400', '#ff9900'],
  },
};

/**
 * Get color scheme by name
 */
export function getColorScheme(name: string): string[] {
  const scheme = COLOR_SCHEMES[name.toLowerCase()];
  if (scheme) {
    return scheme.colors;
  }

  // Default to github-green
  return COLOR_SCHEMES['github-green'].colors;
}

/**
 * Parse custom colors from comma-separated string
 */
export function parseCustomColors(colorString: string): string[] | null {
  if (!colorString || colorString.trim() === '') {
    return null;
  }

  const colors = colorString.split(',').map(c => c.trim());

  if (colors.length !== 5) {
    return null;
  }

  // Validate hex colors
  const hexRegex = /^#[0-9A-Fa-f]{6}$/;
  for (const color of colors) {
    if (!hexRegex.test(color)) {
      return null;
    }
  }

  return colors;
}

/**
 * Get colors for grid rendering
 * Always returns exactly 5 colors (guaranteed)
 */
export function getGridColors(
  colorScheme: string = 'github-green',
  customColors?: string
): [string, string, string, string, string] {
  // Custom colors take priority
  if (customColors) {
    const parsed = parseCustomColors(customColors);
    if (parsed && parsed.length === 5) {
      return parsed as [string, string, string, string, string];
    }
    // Log warning if custom colors are invalid
    if (customColors.trim() !== '') {
      console.warn(
        `Invalid custom colors "${customColors}". Expected 5 hex colors. Falling back to scheme "${colorScheme}".`
      );
    }
  }

  // Otherwise use named scheme
  const colors = getColorScheme(colorScheme);

  // Defensive check (should never happen, but TypeScript safety)
  if (colors.length !== 5) {
    console.error(
      `Color scheme "${colorScheme}" returned ${colors.length} colors instead of 5. Using default.`
    );
    return COLOR_SCHEMES['github-green'].colors;
  }

  return colors as [string, string, string, string, string];
}

export default {
  COLOR_SCHEMES,
  getColorScheme,
  parseCustomColors,
  getGridColors,
};
