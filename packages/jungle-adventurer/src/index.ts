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
  GridTarget,
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
  const characterScale = options.characterScale ?? 0.7;  // Scale down to fit in cells (real sprite ~16x32, frame 48x64)
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

  // Canvas with padding around grid to accommodate sprite movement
  // Sprite frame: 33.6px x 44.8px at scale 0.7
  // Left/Right: 2 cells (28px) to fit sprite width (33.6px)
  // Top/Bottom: 2 cells each side (symmetric)
  const width = (gridWidth + 4) * cellTotal;   // Extra 4 cells width (2 on each side)
  const height = (gridHeight + 4) * cellTotal; // Extra 4 cells height (2 top, 2 bottom)

  const viewBoxX = -cellTotal * 2;  // Start 2 cells to the left
  const viewBoxY = -cellTotal * 2;  // Start 2 cells above

  const svgWidth = width;
  const svgHeight = height;

  // Create blocks from contribution data AND collect path targets
  const blocks: Block[] = [];
  const pathTargets: GridTarget[] = [];

  contributionWeeks.forEach((week, weekIdx) => {
    if (!week.days) {
      return; // Skip weeks without days
    }

    week.days.forEach((day, dayIdx) => {
      if (day.count > 0) {
        // Validate and clamp level to valid range (0-4)
        const level = Math.max(0, Math.min(4, day.level ?? 0));
        const targetLevel = Math.max(1, Math.min(4, level)); // smartPath expects 1-4

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
          contributionLevel: targetLevel,
        });
      }
    });
  });
  
  console.log(`[DEBUG-BLOCKS] Created ${blocks.length} blocks and ${pathTargets.length} pathTargets`);
  console.log(`[DEBUG-BLOCKS] First 5 blocks:`, blocks.slice(0, 5).map(b => `(${b.x},${b.y})`));
  console.log(`[DEBUG-BLOCKS] First 5 pathTargets:`, pathTargets.slice(0, 5).map(t => `grid(${t.x},${t.y})`));

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

  // Adjust character's center with block centers
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
  // IMPORTANT: Convert from block corner coordinates to block CENTER coordinates
  // block.x/y are top-left corner + margin (weekIdx * 14 + 1)
  // We need center coordinates (weekIdx * 14 + 7) to match gridToPixel() output
  const shootingTargets = blocks.map(block => ({
    x: block.x + block.width / 2,  // Convert corner to center: +12/2 = +6
    y: block.y + block.height / 2,
    width: block.width,
    height: block.height,
    hitTime: undefined as number | undefined,  // Will be set by generateBullets
  }));

  // Merge action data from smartSegments into the smoothed characterPath so
  // bullet timing matches the visual (smoothed) timeline. For each smoothed
  // path point, find the nearest action segment (by time) and attach action
  // and target fields so generateBullets sees the exact times used for animation.
  // IMPORTANT: For shooting actions, we need to use the ORIGINAL smartSegment's
  // position and time, not the smoothed path point, to ensure accurate hit timing.

  // First, build pathForShooting from smoothed characterPath
  const pathForShooting = characterPath.map(p => {
    // Use smaller threshold (0.1s) to better preserve shooting hold points
    const nearest = smartSegments.find((s: any) => Math.abs(s.time - p.time) < 0.1);

    // For idle_shoot actions, use the original segment's position and time
    // to ensure bullets are generated from the exact shooting position
    if (nearest?.action === 'idle_shoot') {
      return {
        x: nearest.x,        // Use original shooting position
        y: nearest.y,        // Use original shooting position
        time: nearest.time,  // Use original shooting time
        action: nearest.action,
        targetX: nearest.targetX,
        targetY: nearest.targetY,
      };
    }

    // For other actions, use smoothed path data
    return {
      x: p.x,
      y: p.y,
      time: p.time,
      action: nearest?.action,
      targetX: nearest?.targetX,
      targetY: nearest?.targetY,
    };
  });

  // CRITICAL FIX: Ensure ALL idle_shoot segments from smartSegments are included
  // The smoothing may have skipped some shooting hold points due to interpolation
  // We need to preserve the full shooting hold duration for proper timing
  const allShootSegments = smartSegments.filter((s: any) => s.action === 'idle_shoot');
  for (const shootSeg of allShootSegments) {
    // Check if this shooting segment is already in pathForShooting
    const existsInPath = pathForShooting.some(p =>
      p.action === 'idle_shoot' &&
      Math.abs(p.time - shootSeg.time) < 0.01 &&
      Math.abs(p.x - shootSeg.x) < 1 &&
      Math.abs(p.y - shootSeg.y) < 1
    );

    if (!existsInPath) {
      // Insert this shooting segment at the correct time position
      const insertIndex = pathForShooting.findIndex(p => p.time > shootSeg.time);
      const newPoint = {
        x: shootSeg.x,
        y: shootSeg.y,
        time: shootSeg.time,
        action: shootSeg.action,
        targetX: shootSeg.targetX,
        targetY: shootSeg.targetY,
      };

      if (insertIndex === -1) {
        pathForShooting.push(newPoint);
      } else {
        pathForShooting.splice(insertIndex, 0, newPoint);
      }
    }
  }

  // Diagnostic: report how many smoothed points were matched to an action segment
  try {
    const matched = pathForShooting.filter(p => p.action !== undefined).length;
    const idleShootCount = pathForShooting.filter(p => p.action === 'idle_shoot').length;
    const deltas: number[] = [];
    for (const p of pathForShooting) {
      if (p.action !== undefined) {
        const nearest = smartSegments.find((s: any) => Math.abs(s.time - p.time) < 0.25);
        if (nearest) deltas.push(Math.abs(nearest.time - p.time));
      }
    }
    deltas.sort((a, b) => a - b);
    console.log('[DIAG] pathForShooting: points=', pathForShooting.length, 'matched=', matched, 'idle_shoot=', idleShootCount, 'deltaSamples=', deltas.slice(0,5));
  } catch (e) {
    /* ignore diag errors */
  }

  // Generate bullets using the merged path which matches visual timing
  const bullets = generateBullets(pathForShooting, shootingTargets, shootingConfig);

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

  // Create hit time map from shootingTargets
  // IMPORTANT: Use block CORNER coordinates (not center) as key to match createBlockWithEffect
  const hitTimes = new Map<string, number>();
  let debugHitTimeCount = 0;
  shootingTargets.forEach((target, index) => {
    if (target.hitTime !== undefined) {
      // Convert center coordinates back to corner coordinates to match blocks array
      const block = blocks[index];
      const blockId = `block-${block.x}-${block.y}`;
      hitTimes.set(blockId, target.hitTime);

      // DEBUG: Log first few mappings
      if (debugHitTimeCount < 5) {
        console.log(`[HITTIME-MAP] index=${index}, targetCenter=(${target.x.toFixed(1)},${target.y.toFixed(1)}), blockCorner=(${block.x},${block.y}), blockId=${blockId}, hitTime=${target.hitTime.toFixed(2)}s`);
        debugHitTimeCount++;
      }
    }
  });

  // Diagnostic logging: report how many blocks received hitTimes and list a few missing
  const hitCount = hitTimes.size;
  const totalBlocks = blocks.length;
  if (hitCount !== totalBlocks) {
    const missing: string[] = [];
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      const id = `block-${b.x}-${b.y}`;
      if (!hitTimes.has(id)) {
        missing.push(id);
        if (missing.length >= 10) break;
      }
    }
    console.warn('[HITTIMES] hitCount=', hitCount, 'totalBlocks=', totalBlocks, 'missingExamples=', missing.slice(0, 10));
  } else {
    console.log('[HITTIMES] All blocks have hitTimes:', hitCount);
  }

  // IMPORTANT: Filter out blocks that were never shot (no hitTime)
  // These blocks can't be reached by the character and shouldn't be displayed
  const reachableBlocks = blocks.filter((b, index) => {
    const blockId = `block-${b.x}-${b.y}`;
    return hitTimes.has(blockId);
  });
  console.log(`[BLOCKS] Rendering ${reachableBlocks.length}/${blocks.length} blocks (only those that can be reached and shot)`);
  
  // DEBUG: Show block distribution
  const blocksByGridX = new Map<number, number>();
  const blocksByGridY = new Map<number, number>();
  blocks.forEach(b => {
    const gridX = Math.floor(b.x / cellTotal);
    const gridY = Math.floor(b.y / cellTotal);
    blocksByGridX.set(gridX, (blocksByGridX.get(gridX) || 0) + 1);
    blocksByGridY.set(gridY, (blocksByGridY.get(gridY) || 0) + 1);
  });
  console.log(`[DEBUG] All blocks by gridX:`, Array.from(blocksByGridX.entries()).sort((a,b) => a[0] - b[0]).slice(0, 10));
  console.log(`[DEBUG] All blocks by gridY:`, Array.from(blocksByGridY.entries()).sort((a,b) => a[0] - b[0]).slice(0, 10));
  
  const reachableByGridX = new Map<number, number>();
  const reachableByGridY = new Map<number, number>();
  reachableBlocks.forEach(b => {
    const gridX = Math.floor(b.x / cellTotal);
    const gridY = Math.floor(b.y / cellTotal);
    reachableByGridX.set(gridX, (reachableByGridX.get(gridX) || 0) + 1);
    reachableByGridY.set(gridY, (reachableByGridY.get(gridY) || 0) + 1);
  });
  console.log(`[DEBUG] Reachable blocks by gridX:`, Array.from(reachableByGridX.entries()).sort((a,b) => a[0] - b[0]).slice(0, 10));
  console.log(`[DEBUG] Reachable blocks by gridY:`, Array.from(reachableByGridY.entries()).sort((a,b) => a[0] - b[0]).slice(0, 10));

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
    ${createAllBlocksWithEffects(reachableBlocks, hitTimes, blockDestroyEffect)}
  </g>

  <!-- Impact flashes layer -->
  ${createAllImpactFlashesSVG(impacts)}

  <!-- Bullets layer - REMOVED: no bullet traces, instant hit only -->

  <!-- Character layer (8-directional sprites, auto-switched based on movement) -->
  <!-- IMPORTANT: This MUST be AFTER blocks layer so character appears on top! -->
    ${createMultiDirectionalSpriteElement(
    sprites,
    // Convert PathPoint[] with cumulative time to path segments with duration per segment
    // Map by TIME instead of index, because smoothPath inserts extra points
    characterPath.map((p, index) => {
      // Find the segment that contains this time point
      // Use binary search for efficiency (pathForShooting is sorted by time)
      let seg = undefined;
      let left = 0;
      let right = pathForShooting.length - 1;

      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const segTime = pathForShooting[mid].time;

        // If within 10ms of this segment's time, consider it a match
        if (Math.abs(segTime - p.time) < 0.01) {
          seg = pathForShooting[mid];
          break;
        }

        // Otherwise, check if this segment is active during this time
        // A segment is active from its time until the next segment's time
        const nextSegTime = mid < pathForShooting.length - 1 ? pathForShooting[mid + 1].time : Infinity;
        if (p.time >= segTime && p.time < nextSegTime) {
          seg = pathForShooting[mid];
          break;
        }

        if (segTime < p.time) {
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }

      const isShooting = seg?.action === 'idle_shoot';
      const isReloading = seg?.action === 'reload';

      return {
        x: p.x,
        y: p.y,
        duration: index === 0 ? 0 : p.time - characterPath[index - 1].time,
        isShooting,
        isReloading,
        targetX: seg?.targetX,
        targetY: seg?.targetY,
      };
    }),
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
