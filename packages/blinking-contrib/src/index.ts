export interface ContributionDay {
  date: string;
  count: number;
}

export interface ContributionGrid {
  weeks: ContributionDay[][];
  maxCount: number;
}

export interface YearlyContribution {
  year: number;
  grid: ContributionGrid;
  weekOffset: number; // Number of weeks from year start (for alignment)
}

export interface BlinkingSVGOptions {
  cellSize?: number;
  cellGap?: number;
  cellRadius?: number;
  frameDuration?: number; // Duration to show each year (seconds)
  transitionDuration?: number; // Duration of fade transition (seconds)
  colorLevels?: string[];
}

/**
 * Generate a blinking SVG animation that displays GitHub contributions year by year.
 * Each year fades in, displays for a period, then fades out to the next year,
 * creating a starry sky blinking effect.
 */
export function generateBlinkingSVG(
  yearlyContributions: YearlyContribution[],
  options: BlinkingSVGOptions = {}
): string {
  const cellSize = options.cellSize ?? 12;
  const cellGap = options.cellGap ?? 2;
  const cellRadius = options.cellRadius ?? 2;
  const frameDuration = options.frameDuration ?? 1.5; // Show each year for 1.5 seconds (faster)
  const transitionDuration = options.transitionDuration ?? 0.3; // 0.3s fade transition (faster, smoother)
  const colorLevels = options.colorLevels ?? [
    '#161b22', // Dark background (empty)
    '#0e4429', // Level 1 (low)
    '#006d32', // Level 2 (medium-low)
    '#26a641', // Level 3 (medium-high)
    '#39d353', // Level 4 (high)
  ];

  if (yearlyContributions.length === 0) {
    throw new Error('No contribution data provided');
  }

  // Validate timing parameters to prevent invalid SVG animations
  if (frameDuration <= 0) {
    throw new Error(`frame_duration must be positive, got ${frameDuration}`);
  }

  if (transitionDuration < 0) {
    throw new Error(`transition_duration must be non-negative, got ${transitionDuration}`);
  }

  // Ensure transition_duration doesn't equal or exceed half of frame_duration
  // to prevent zero-length spline segments (duplicate keyTimes) and overlapping fades
  const maxTransitionDuration = frameDuration / 2;
  if (transitionDuration >= maxTransitionDuration) {
    throw new Error(
      `transition_duration (${transitionDuration}s) must be strictly less than half of frame_duration (${frameDuration / 2}s). ` +
      `Equal values produce duplicate keyTimes entries, creating zero-length spline segments that are invalid in SMIL. ` +
      `Please use transition_duration < ${maxTransitionDuration}s or increase frame_duration.`
    );
  }

  // Calculate canvas size based on the full year grid
  // All years now have the same structure (Jan 1 - Dec 31 with padding to full weeks)
  // so we can use any year's week count (they should all be 53 or 54)
  const maxWeeks = Math.max(...yearlyContributions.map(yc => yc.grid.weeks.length));
  const days = 7; // Always 7 days per week
  const width = maxWeeks * (cellSize + cellGap) - cellGap;
  const height = days * (cellSize + cellGap) - cellGap;

  // Calculate total animation cycle duration
  const cycleDuration = yearlyContributions.length * frameDuration;

  let yearGroups = '';
  let yearLabels = '';

  yearlyContributions.forEach((yearContrib, yearIndex) => {
    const { year, grid } = yearContrib;
    const weeks = grid.weeks.length;

    // Calculate animation timing for this year
    // Each year appears, stays visible, then fades out
    const startTime = yearIndex * frameDuration;
    const fadeInEnd = startTime + transitionDuration;
    const fadeOutStart = startTime + frameDuration - transitionDuration;
    const fadeOutEnd = startTime + frameDuration;

    // Calculate key times (normalized to 0-1 range)
    const keyTimes = [
      0,
      fadeInEnd / cycleDuration,
      fadeOutStart / cycleDuration,
      fadeOutEnd / cycleDuration,
      1,
    ];

    // Opacity values: 0 (hidden) -> 1 (visible) -> 1 (visible) -> 0 (hidden) -> 0 (stay hidden)
    const opacityValues = yearIndex === yearlyContributions.length - 1
      ? '0;1;1;0;0' // Last year loops back to start
      : '0;1;1;0;0';

    let cells = '';

    for (let weekIdx = 0; weekIdx < weeks; weekIdx++) {
      const week = grid.weeks[weekIdx];
      for (let dayIdx = 0; dayIdx < week.length; dayIdx++) {
        const day = week[dayIdx];
        // All years are now aligned from Jan 1, no offset needed
        const x = weekIdx * (cellSize + cellGap);
        const y = dayIdx * (cellSize + cellGap);

        // Calculate color level based on contribution count
        let color = colorLevels[0]; // Default empty color
        if (day.count > 0) {
          const level = Math.min(Math.ceil((day.count / grid.maxCount) * 4), 4);
          color = colorLevels[level] || colorLevels[colorLevels.length - 1];
        }

        // Add slight random delay to each cell for more organic blinking effect
        const cellDelay = (weekIdx * 0.01 + dayIdx * 0.005) % transitionDuration;

        cells += `\n    <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="${cellRadius}" fill="${color}" />`;
      }
    }

    // Add year label
    const labelX = width / 2;
    const labelY = height + 20;

    yearLabels += `\n  <text x="${labelX}" y="${labelY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#586069" opacity="0">
    ${year}
    <animate
      attributeName="opacity"
      values="${opacityValues}"
      keyTimes="${keyTimes.join(';')}"
      dur="${cycleDuration}s"
      repeatCount="indefinite"
      calcMode="linear"
    />
  </text>`;

    // Create a group for each year with fade animation
    yearGroups += `\n  <g id="year-${year}" opacity="0">
    <animate
      attributeName="opacity"
      values="${opacityValues}"
      keyTimes="${keyTimes.join(';')}"
      dur="${cycleDuration}s"
      repeatCount="indefinite"
      calcMode="spline"
      keySplines="0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1"
    />${cells}
  </g>`;
  });

  // Add extra padding for year label
  const totalHeight = height + 30;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${totalHeight}" viewBox="0 0 ${width} ${totalHeight}">
  <style>
    @keyframes twinkle {
      0%, 100% { opacity: 0.7; }
      50% { opacity: 1; }
    }
  </style>
  <rect width="${width}" height="${totalHeight}" fill="transparent"/>${yearGroups}${yearLabels}
</svg>`;
}
