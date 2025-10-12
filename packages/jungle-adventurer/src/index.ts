/**
 * Jungle Adventurer Main Entry
 * Generates animated SVG of character shooting through contribution blocks
 */

import {
  MultiDirectionalSprites,
  createMultiDirectionalSpriteElement,
} from './spriteAnimation';
import {
  generateBullets,
  createAllBulletsSVG,
  createAllMuzzleFlashesSVG,
  ShootingConfig,
} from './shootingSystem';
import {
  Block,
  createAllBlocksWithEffects,
  createAllImpactFlashesSVG,
} from './blockEffects';
import {
  createScanningPath,
  createZigzagPath,
  createSpiralPath,
  smoothPath,
  PathPoint,
} from './pathPlanning';
import { loadBuiltInSprites } from './assetLoader';
import { getGridColors } from './colorSchemes';

export interface ContributionDay {
  date: string;
  count: number;
  level: number; // 0-4
}

export interface ContributionWeek {
  days: ContributionDay[];
}

export interface JungleAdventurerOptions {
  // Grid settings
  cellSize?: number;
  cellGap?: number;
  cellRadius?: number;

  // Color settings (simplified - user only needs to set these)
  colorScheme?: string;      // Predefined color scheme name
  customColors?: string;     // Custom colors override (comma-separated)
  backgroundColor?: string;

  // Advanced settings (internal use, not exposed to users)
  sprites?: MultiDirectionalSprites;  // Use built-in sprites if not provided
  characterScale?: number;
  animationFPS?: number;
  bulletSpeed?: number;
  fireRate?: number;
  bulletWidth?: number;
  bulletHeight?: number;
  bulletColor?: string;
  blockDestroyEffect?: 'explode' | 'fade' | 'shatter' | 'dissolve';
  pathType?: 'scanning' | 'zigzag' | 'spiral';
  characterSpeed?: number;
}

/**
 * Generate the complete Jungle Adventurer SVG animation
 */
export function generateJungleAdventurerSVG(
  contributionWeeks: ContributionWeek[],
  options: JungleAdventurerOptions = {}
): string {
  // Validate input
  if (!contributionWeeks || contributionWeeks.length === 0) {
    throw new Error('contributionWeeks cannot be empty');
  }

  // Validate that we have valid weeks with days
  const validWeeks = contributionWeeks.filter(
    week => week.days && week.days.length > 0
  );

  if (validWeeks.length === 0) {
    throw new Error('contributionWeeks must contain at least one week with days');
  }

  // Grid settings
  const cellSize = options.cellSize ?? 12;
  const cellGap = options.cellGap ?? 2;
  const cellRadius = options.cellRadius ?? 2;

  // Color settings (simplified!)
  const colorScheme = options.colorScheme ?? 'github-green';
  const customColors = options.customColors;
  const colorLevels = getGridColors(colorScheme, customColors);
  const backgroundColor = options.backgroundColor ?? '#0d1117';

  // Validate color levels array
  if (!colorLevels || colorLevels.length < 5) {
    throw new Error(
      `Color scheme must provide exactly 5 colors, got ${colorLevels?.length ?? 0}`
    );
  }

  // Animation settings (internal defaults)
  const characterScale = options.characterScale ?? 1.0;
  const animationFPS = options.animationFPS ?? 12;
  const bulletSpeed = options.bulletSpeed ?? 150;
  const fireRate = options.fireRate ?? 3;
  const bulletWidth = options.bulletWidth ?? 2;
  const bulletHeight = options.bulletHeight ?? 4;
  const bulletColor = options.bulletColor ?? '#ffff00';
  const blockDestroyEffect = options.blockDestroyEffect ?? 'explode';
  const pathType = options.pathType ?? 'scanning';
  const characterSpeed = options.characterSpeed ?? 100;

  // Load sprites (use provided or load built-in)
  const sprites = options.sprites ?? loadBuiltInSprites();

  // Calculate grid dimensions
  const gridWidth = contributionWeeks.length;
  const gridHeight = 7; // Always 7 days per week
  const totalWidth = gridWidth * (cellSize + cellGap) - cellGap;
  const totalHeight = gridHeight * (cellSize + cellGap) - cellGap;

  // Add padding for character movement
  const padding = 100;
  const svgWidth = totalWidth + padding * 2;
  const svgHeight = totalHeight + padding * 2;

  // Create blocks from contribution data
  const blocks: Block[] = [];
  const cellTotal = cellSize + cellGap;

  contributionWeeks.forEach((week, weekIdx) => {
    if (!week.days) {
      return; // Skip weeks without days
    }

    week.days.forEach((day, dayIdx) => {
      if (day.count > 0) {
        // Validate and clamp level to valid range (0-4)
        const level = Math.max(0, Math.min(4, day.level ?? 0));

        // Double-check color exists (defensive programming)
        const color = colorLevels[level];
        if (!color) {
          console.warn(
            `Warning: No color found for level ${level}, using fallback`
          );
        }

        blocks.push({
          x: padding + weekIdx * cellTotal,
          y: padding + dayIdx * cellTotal,
          width: cellSize,
          height: cellSize,
          color: color || colorLevels[0] || '#666666', // Fallback chain
          level: level,
        });
      }
    });
  });

  // Generate character path
  let characterPath: PathPoint[];

  switch (pathType) {
    case 'zigzag':
      characterPath = createZigzagPath(
        gridWidth,
        gridHeight,
        cellSize,
        cellGap,
        characterSpeed
      );
      break;
    case 'spiral':
      characterPath = createSpiralPath(
        gridWidth,
        gridHeight,
        cellSize,
        cellGap,
        characterSpeed
      );
      break;
    case 'scanning':
    default:
      characterPath = createScanningPath(
        gridWidth,
        gridHeight,
        cellSize,
        cellGap,
        characterSpeed
      );
      break;
  }

  // Offset path by padding
  characterPath = characterPath.map(p => ({
    ...p,
    x: p.x + padding,
    y: p.y + padding,
  }));

  // Smooth the path for better animation
  characterPath = smoothPath(characterPath, 3);

  // Generate bullets
  const shootingConfig: ShootingConfig = {
    characterX: 0,
    characterY: 0,
    bulletSpeed,
    fireRate,
    bulletWidth,
    bulletHeight,
    bulletColor,
    hasTrail: true,
  };

  const targets = blocks.map(block => ({
    x: block.x,
    y: block.y,
    width: block.width,
    height: block.height,
    hitTime: undefined as number | undefined,  // Will be set by generateBullets
  }));

  // Generate bullets - this will populate hitTime in targets
  const bullets = generateBullets(characterPath, targets, shootingConfig);

  // Create hit time map from targets (using exact coordinates, no rounding!)
  const hitTimes = new Map<string, number>();
  targets.forEach(target => {
    if (target.hitTime !== undefined) {
      const blockId = `block-${target.x}-${target.y}`;
      hitTimes.set(blockId, target.hitTime);
    }
  });

  // Calculate total animation duration
  const totalDuration = characterPath[characterPath.length - 1].time + 2; // +2s buffer

  // Generate impact flashes
  const impacts = bullets.map(b => ({
    x: b.targetX,
    y: b.targetY,
    time: b.startTime + b.duration,
  }));

  // Build SVG
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg
  width="${svgWidth}"
  height="${svgHeight}"
  viewBox="0 0 ${svgWidth} ${svgHeight}"
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
>
  <style>
    .sprite-character-moving {
      transform-origin: center center;
    }
  </style>

  <!-- Background -->
  <rect width="100%" height="100%" fill="${backgroundColor}" />

  <!-- Blocks layer (with destroy effects) -->
  <g class="blocks-layer">
    ${createAllBlocksWithEffects(blocks, hitTimes, blockDestroyEffect)}
  </g>

  <!-- Impact flashes layer -->
  ${createAllImpactFlashesSVG(impacts)}

  <!-- Bullets layer -->
  ${createAllBulletsSVG(bullets, shootingConfig)}

  <!-- Muzzle flashes layer -->
  ${createAllMuzzleFlashesSVG(bullets, bulletColor)}

  <!-- Character layer (8-directional sprites, auto-switched based on movement) -->
  ${createMultiDirectionalSpriteElement(
    sprites,
    // Convert PathPoint[] with cumulative time to path segments with duration per segment
    characterPath.map((p, index) => ({
      x: p.x,
      y: p.y,
      duration: index === 0 ? 0 : p.time - characterPath[index - 1].time,
      isShooting: false, // TODO: Track shooting state per path point
    })),
    characterScale,
    'character-anim',
    animationFPS
  )}

  <!-- Timeline indicator (optional, for debugging) -->
  <!--
  <text x="10" y="30" fill="#ffffff" font-family="monospace" font-size="14">
    Duration: ${totalDuration.toFixed(1)}s | Blocks: ${blocks.length} | Bullets: ${bullets.length}
  </text>
  -->
</svg>`;

  return svgContent;
}

export default {
  generateJungleAdventurerSVG,
};
