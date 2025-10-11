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
  fadeInDuration?: number; // Duration of fade in transition (seconds)
  fadeOutDuration?: number; // Duration of fade out transition (seconds)
  colorLevels?: string[];
  endingText?: string; // Optional text to display at the end (pixel art style)
  fontSize?: FontSize; // Font size for ending text: '3x5' (compact) or '5x7' (standard)
  textFrameDuration?: number; // Duration for ending text frame (if different from frameDuration)
}

/**
 * Calculate animation timing for a frame in the blinking animation
 * @param frameIndex Index of the frame (0-based)
 * @param frameDuration Duration each frame stays visible (seconds)
 * @param fadeInDuration Duration of fade in transition (seconds)
 * @param fadeOutDuration Duration of fade out transition (seconds)
 * @param cycleDuration Total animation cycle duration (seconds)
 * @returns Timing values and normalized keyTimes for SMIL animation
 */
function calculateFrameTiming(
  frameIndex: number,
  frameDuration: number,
  fadeInDuration: number,
  fadeOutDuration: number,
  cycleDuration: number
) {
  const startTime = frameIndex * frameDuration;
  const fadeInEnd = startTime + fadeInDuration;
  const fadeOutStart = startTime + frameDuration - fadeOutDuration;
  const fadeOutEnd = startTime + frameDuration;

  const ki1 = fadeInEnd / cycleDuration;
  const ki2 = fadeOutStart / cycleDuration;
  const ki3 = fadeOutEnd / cycleDuration;

  return {
    startTime,
    fadeInEnd,
    fadeOutStart,
    fadeOutEnd,
    keyTimes: [0, ki1, ki2, ki3, 1],
    keySplines: '0 0 1 1;0.42 0 0.58 1;0.42 0 0.58 1;0 0 1 1',
  };
}/**
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
  const fadeInDuration = options.fadeInDuration ?? 0.5; // Default 0.5s fade in
  const fadeOutDuration = options.fadeOutDuration ?? 0.5; // Default 0.5s fade out
  const endingText = options.endingText; // Optional ending text frame
  const fontSize = options.fontSize ?? '5x7'; // Default to standard 5x7 font
  const textFrameDuration = options.textFrameDuration ?? frameDuration * 2; // Text shows 2x longer by default
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

  if (fadeInDuration < 0) {
    throw new Error(`fade_in_duration must be non-negative, got ${fadeInDuration}`);
  }

  if (fadeOutDuration < 0) {
    throw new Error(`fade_out_duration must be non-negative, got ${fadeOutDuration}`);
  }

  // Note: We now allow transition_duration >= frame_duration/2 to enable overlapping fades
  // This creates a chaotic, jittery screen effect where multiple frames are partially visible at once

  // Calculate canvas size based on fixed 53-week grid (GitHub standard)
  // All years display the same 7x53 grid, counting back from their end date
  const weeksPerFrame = 53;
  const days = 7; // Always 7 days per week
  const width = weeksPerFrame * (cellSize + cellGap) - cellGap;
  const height = days * (cellSize + cellGap) - cellGap;

  // Calculate total animation cycle duration (including optional ending text frame)
  const hasEndingFrame = endingText && endingText.trim().length > 0;
  const yearFramesDuration = yearlyContributions.length * frameDuration;
  const cycleDuration = yearFramesDuration + (hasEndingFrame ? textFrameDuration : 0);

  let yearGroups = '';

  yearlyContributions.forEach((yearContrib, yearIndex) => {
    const { year, grid } = yearContrib;
    const weeks = grid.weeks.length;

    // Calculate animation timing for this year
    const timing = calculateFrameTiming(yearIndex, frameDuration, fadeInDuration, fadeOutDuration, cycleDuration);

    // Opacity values: fade in (0→1), stay visible (1), fade out (1→0), stay hidden (0)
    // All years animate simultaneously with overlapping timing
    const opacityValues = '0;1;1;0;0';

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
      keySplines="${timing.keySplines}"
    />${cells}
  </g>`;
  });

  // Add optional ending text frame
  if (hasEndingFrame && endingText) {
    // Text frame waits until all year frames complete, then fades in
    const textFrameStart = yearFramesDuration / cycleDuration;
    const textFadeInEnd = (yearFramesDuration + fadeInDuration) / cycleDuration;
    const textFadeOutStart = (yearFramesDuration + textFrameDuration - fadeOutDuration) / cycleDuration;
    const textEnd = (yearFramesDuration + textFrameDuration) / cycleDuration;

    // Use 6 keyTimes to keep text hidden until year frames complete
    const textKeyTimes = [0, textFrameStart, textFadeInEnd, textFadeOutStart, textEnd, 1];
    const textKeySplines = '0 0 1 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0 0 1 1';

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
      keyTimes="${textKeyTimes.join(';')}"
      dur="${cycleDuration}s"
      repeatCount="indefinite"
      calcMode="spline"
      keySplines="${textKeySplines}"
    />${textCells}
  </g>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="transparent"/>${yearGroups}
</svg>`;
}
