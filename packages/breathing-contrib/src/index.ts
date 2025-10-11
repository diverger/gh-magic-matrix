export interface ContributionDay {
  date: string;
  count: number;
}

export interface ContributionGrid {
  weeks: ContributionDay[][];
  maxCount: number;
}

export interface BreathingSVGOptions {
  cellSize?: number;
  cellGap?: number;
  cellRadius?: number;
  period?: number;
  colorLevels?: string[];
}

/**
 * Generate a breathing SVG animation for a GitHub contribution grid.
 * Each cell breathes from its minimum brightness (based on count) to maximum brightness.
 * Cells with higher contribution counts have brighter animations.
 */
export function generateBreathingSVG(
  grid: ContributionGrid,
  options: BreathingSVGOptions = {}
): string {
  const cellSize = options.cellSize ?? 12;
  const cellGap = options.cellGap ?? 2;
  const cellRadius = options.cellRadius ?? 2;
  const period = options.period ?? 3;
  const colorLevels = options.colorLevels ?? [
    '#ebedf0',
    '#9be9a8',
    '#40c463',
    '#30a14e',
    '#216e39',
  ];

  const weeks = grid.weeks.length;
  // GitHub contribution grid always has 7 rows (one per day of week)
  const days = 7;
  const width = weeks * (cellSize + cellGap) - cellGap;
  const height = days * (cellSize + cellGap) - cellGap;

  let cells = '';

  for (let weekIdx = 0; weekIdx < weeks; weekIdx++) {
    const week = grid.weeks[weekIdx];
    for (let dayIdx = 0; dayIdx < week.length; dayIdx++) {
      const day = week[dayIdx];
      const x = weekIdx * (cellSize + cellGap);
      const y = dayIdx * (cellSize + cellGap);

      if (day.count === 0) {
        // Empty cells don't animate
        cells += `\n  <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="${cellRadius}" fill="${colorLevels[0]}" />`;
      } else {
        // Calculate color level (1-4 maps to colorLevels array 1-4)
        const level = Math.min(Math.ceil((day.count / grid.maxCount) * 4), 4);
        const color = colorLevels[level] || colorLevels[colorLevels.length - 1];

        // Calculate opacity animation range based on contribution count
        // Higher counts = brighter animation
        const normalizedCount = day.count / grid.maxCount;
        const minOpacity = 0.3 + normalizedCount * 0.2;
        const maxOpacity = 0.7 + normalizedCount * 0.3;

        cells += `\n  <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="${cellRadius}" fill="${color}" opacity="${minOpacity}">
    <animate
      attributeName="opacity"
      values="${minOpacity};${maxOpacity};${minOpacity}"
      dur="${period}s"
      repeatCount="indefinite"
      calcMode="spline"
      keyTimes="0;0.5;1"
      keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
    />
  </rect>`;
      }
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="transparent"/>
  <g>${cells}
  </g>
</svg>`;
}
