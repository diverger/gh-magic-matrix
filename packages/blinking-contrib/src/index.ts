import { renderPixelText, FontSize } from './pixelFont';

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
  endingText?: string; // Optional text to display at the end (pixel art style)
  fontSize?: FontSize; // Font size for ending text: '3x5' (compact) or '5x7' (standard)
}

/**
 * Calculate animation timing for a frame in the blinking animation
 * @param frameIndex Index of the frame (0-based)
 * @param frameDuration Duration each frame stays visible (seconds)
 * @param transitionDuration Duration of fade in/out transitions (seconds)
 * @param cycleDuration Total animation cycle duration (seconds)
 * @returns Timing values and normalized keyTimes for SMIL animation
 */
function calculateFrameTiming(
  frameIndex: number,
  frameDuration: number,
  transitionDuration: number,
  cycleDuration: number
) {
  const startTime = frameIndex * frameDuration;
  const fadeInEnd = startTime + transitionDuration;
  const fadeOutStart = startTime + frameDuration - transitionDuration;
  const fadeOutEnd = startTime + frameDuration;

  const start = startTime / cycleDuration;
  const ki1 = fadeInEnd / cycleDuration;
  const ki2 = fadeOutStart / cycleDuration;
  const ki3 = fadeOutEnd / cycleDuration;

  return {
    startTime,
    fadeInEnd,
    fadeOutStart,
    fadeOutEnd,
    keyTimes: [0, start, ki1, ki2, ki3, 1],
  };
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
  const frameDuration = options.frameDuration ?? 3; // Show each year for 3 seconds (more visible)
  const transitionDuration = options.transitionDuration ?? 0.8; // 0.8s fade transition (smoother)
  const endingText = options.endingText; // Optional ending text frame
  const fontSize = options.fontSize ?? '5x7'; // Default to standard 5x7 font
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

  // Calculate canvas size based on fixed 53-week grid (GitHub standard)
  // All years display the same 7x53 grid, counting back from their end date
  const weeksPerFrame = 53;
  const days = 7; // Always 7 days per week
  const width = weeksPerFrame * (cellSize + cellGap) - cellGap;
  const height = days * (cellSize + cellGap) - cellGap;

  // Calculate total animation cycle duration (including optional ending text frame)
  const hasEndingFrame = endingText && endingText.trim().length > 0;
  const totalFrames = yearlyContributions.length + (hasEndingFrame ? 1 : 0);
  const cycleDuration = totalFrames * frameDuration;

  let yearGroups = '';

  yearlyContributions.forEach((yearContrib, yearIndex) => {
    const { year, grid } = yearContrib;
    const weeks = grid.weeks.length;

    // Calculate animation timing for this year
    const timing = calculateFrameTiming(yearIndex, frameDuration, transitionDuration, cycleDuration);

    // Opacity values: stay hidden (0) until startTime, then fade in (0→1), stay visible (1), fade out (1→0), stay hidden (0)
    const opacityValues = '0;0;1;1;0;0';

    let cells = '';

    for (let weekIdx = 0; weekIdx < weeks; weekIdx++) {
      const week = grid.weeks[weekIdx];
      for (let dayIdx = 0; dayIdx < week.length; dayIdx++) {
        const day = week[dayIdx];
        // All frames are same size (53 weeks), no offset needed
        const x = weekIdx * (cellSize + cellGap);
        const y = dayIdx * (cellSize + cellGap);

        // Calculate color level based on contribution count
        let color = colorLevels[0]; // Default empty color
        if (day.count > 0) {
          const level = Math.min(Math.ceil((day.count / grid.maxCount) * 4), 4);
          color = colorLevels[level] || colorLevels[colorLevels.length - 1];
        }

        cells += `\n    <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="${cellRadius}" fill="${color}" />`;
      }
    }

    // Create a group for each year with fade animation
    yearGroups += `\n  <g id="year-${year}" opacity="0">
    <animate
      attributeName="opacity"
      values="${opacityValues}"
      keyTimes="${timing.keyTimes.join(';')}"
      dur="${cycleDuration}s"
      repeatCount="indefinite"
      calcMode="spline"
      keySplines="0 0 1 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0 0 1 1"
    />${cells}
  </g>`;
  });

  // Add optional ending text frame
  if (hasEndingFrame && endingText) {
    const textFrameIndex = yearlyContributions.length;

    // Calculate animation timing for text frame
    const timing = calculateFrameTiming(textFrameIndex, frameDuration, transitionDuration, cycleDuration);

    // Render text as pixel coordinates
    const textPixels = renderPixelText(
      endingText,
      fontSize,
      true, // centerHorizontally
      true, // centerVertically
      1,    // charSpacing
    );

    // Use the highest contribution color for text
    const textColor = colorLevels[colorLevels.length - 1];

    let textCells = '';
    textPixels.forEach(({ weekIdx, dayIdx }) => {
      const x = weekIdx * (cellSize + cellGap);
      const y = dayIdx * (cellSize + cellGap);
      textCells += `\n    <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="${cellRadius}" fill="${textColor}" />`;
    });

    yearGroups += `\n  <g id="text-frame" opacity="0">
    <animate
      attributeName="opacity"
      values="0;0;1;1;0;0"
      keyTimes="${timing.keyTimes.join(';')}"
      dur="${cycleDuration}s"
      repeatCount="indefinite"
      calcMode="spline"
      keySplines="0 0 1 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0 0 1 1"
    />${textCells}
  </g>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="transparent"/>${yearGroups}
</svg>`;
}
