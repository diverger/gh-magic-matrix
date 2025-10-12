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
  ShootingConfig,
} from './shootingSystem';
import {
  Block,
  createAllBlocksWithEffects,
  createAllImpactFlashesSVG,
} from './blockEffects';
import {
  smoothPath,
  PathPoint,
} from './pathPlanning';
import {
  createSmartPath,
  actionSegmentsToPathPoints,
  Target,
} from './smartPathPlanning';
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
  const colorScheme = options.colorScheme ?? 'github-light';
  const customColors = options.customColors;
  const colorLevels = getGridColors(colorScheme, customColors);
  const backgroundColor = options.backgroundColor ?? '#ffffff';

  // Validate color levels array
  if (!colorLevels || colorLevels.length < 5) {
    throw new Error(
      `Color scheme must provide exactly 5 colors, got ${colorLevels?.length ?? 0}`
    );
  }

  // Animation settings (internal defaults)
  const characterScale = options.characterScale ?? 1.0;
  const animationFPS = options.animationFPS ?? 12;
  const bulletSpeed = options.bulletSpeed ?? 200; // Increased from 150 to ensure bullets outpace character
  const fireRate = options.fireRate ?? 3;
  const bulletWidth = options.bulletWidth ?? 2;
  const bulletHeight = options.bulletHeight ?? 4;
  const bulletColor = options.bulletColor ?? '#ff4500'; // OrangeRed - high contrast on white background
  const blockDestroyEffect = options.blockDestroyEffect ?? 'explode';

  // Load sprites (use provided or load built-in)
  const sprites = options.sprites ?? loadBuiltInSprites();

  // Calculate grid dimensions
  const gridWidth = contributionWeeks.length;
  const gridHeight = 7; // Always 7 days per week
  const cellTotal = cellSize + cellGap;

  // Canvas with symmetric padding around grid
  // Left/Right: 1 cell each side
  // Top/Bottom: 2 cells each side (symmetric)
  const width = (gridWidth + 2) * cellTotal;   // Extra 2 cells width (1 on each side)
  const height = (gridHeight + 4) * cellTotal; // Extra 4 cells height (2 top, 2 bottom)

  const viewBoxX = -cellTotal;      // Start 1 cell to the left
  const viewBoxY = -cellTotal * 2;  // Start 2 cells above

  const svgWidth = width;
  const svgHeight = height;

  // Create blocks from contribution data AND collect path targets
  const blocks: Block[] = [];
  const pathTargets: Target[] = [];

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

        // Grid coordinates: x * cellTotal + m (exactly like the pattern)
        // NO margin offset - grid starts at (0, 0)
        const m = (cellTotal - cellSize) / 2;
        blocks.push({
          x: weekIdx * cellTotal + m,
          y: dayIdx * cellTotal + m,
          width: cellSize,
          height: cellSize,
          color: color || colorLevels[0] || '#666666', // Fallback chain
          level: level,
        });

        // Collect target for path planning
        pathTargets.push({
          x: weekIdx,
          y: dayIdx,
          contributionLevel: level,
        });
      }
    });
  });

  // Generate character path using smart planning
  let characterPath: PathPoint[];
  let smartSegments: any[] = []; // Keep ActionSegment[] for shooting system

  // Always use smart path that visits all contribution cells efficiently
  if (pathTargets.length > 0) {
    smartSegments = createSmartPath(
      pathTargets,
      gridWidth,
      gridHeight,
      cellSize,
      cellGap,
      30,  // walkSpeed
      60,  // runSpeed
      3    // shootRange (cells)
    );
    characterPath = actionSegmentsToPathPoints(smartSegments);
    console.log(`🎯 Smart path: ${smartSegments.length} segments, ${pathTargets.length} targets`);
  } else {
    // No contributions - just idle at starting position
    characterPath = [{
      x: -cellTotal + cellTotal / 2,
      y: -cellTotal + cellTotal / 2,
      time: 0,
    }];
  }

  // Reduce smoothing to avoid too many interpolation points
  characterPath = smoothPath(characterPath, 1);

  // Adjust character path to align character's center with block centers
  // animateMotion positions the top-left corner of the sprite, so we need to offset
  // Get any sprite to determine frame size (all sprites should have same dimensions)
  const firstSprite = sprites.runRight || sprites.shootRight || Object.values(sprites).find(s => s);
  const displayWidth = firstSprite ? firstSprite.frameWidth * characterScale : 48;
  const displayHeight = firstSprite ? firstSprite.frameHeight * characterScale : 64;

  // Generate bullets BEFORE offsetting character path
  // generateBullets expects character center coordinates
  const shootingConfig: ShootingConfig = {
    characterX: 0,
    characterY: 0,
    characterWidth: displayWidth,
    characterHeight: displayHeight,
    bulletSpeed,
    fireRate,
    bulletWidth,
    bulletHeight,
    bulletColor,
    hasTrail: true,
  };

  // Create shooting targets from blocks
  const shootingTargets = blocks.map(block => ({
    x: block.x,
    y: block.y,
    width: block.width,
    height: block.height,
    hitTime: undefined as number | undefined,  // Will be set by generateBullets
  }));

  // Generate bullets using ActionSegments (which have action and targetX/targetY)
  const bullets = generateBullets(smartSegments.length > 0 ? smartSegments : characterPath, shootingTargets, shootingConfig);

  // Create shooting state map: mark which path segments are shooting
  const shootingTimes = new Set<number>();
  bullets.forEach(bullet => {
    const shootTime = bullet.startTime;
    // Mark path segments near this shoot time as shooting
    characterPath.forEach((p, idx) => {
      if (idx > 0 && Math.abs(p.time - shootTime) < 0.2) { // Within 200ms
        shootingTimes.add(idx);
      }
    });
  });

  // Create hit time map from shootingTargets (using exact coordinates, no rounding!)
  const hitTimes = new Map<string, number>();
  shootingTargets.forEach(target => {
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
  viewBox="${viewBoxX} ${viewBoxY} ${svgWidth} ${svgHeight}"
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
>
  <style>
    .sprite-character-moving {
      transform-origin: center center;
    }
  </style>

  <!-- Background -->
  <rect x="${viewBoxX}" y="${viewBoxY}" width="${svgWidth}" height="${svgHeight}" fill="${backgroundColor}" />

  <!-- Blocks layer (with destroy effects) -->
  <g class="blocks-layer">
    ${createAllBlocksWithEffects(blocks, hitTimes, blockDestroyEffect)}
  </g>

    <!-- Impact flashes layer -->
  ${createAllImpactFlashesSVG(impacts)}

  <!-- Bullets layer -->
  ${createAllBulletsSVG(bullets, shootingConfig, characterPath)}

  <!-- Character layer (8-directional sprites, auto-switched based on movement) -->
  <!-- IMPORTANT: This MUST be AFTER blocks layer so character appears on top! -->
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
