/**
 * Smart Path Planning System
 *
 * Strategy:
 * 1. Find all contribution cells (targets) sorted by contribution level
 * 2. Character starts OUTSIDE the grid
 * 3. Shoot blocks from outside, then enter cleared area
 * 4. Only move into cells that have been cleared (shot)
 * 5. Use greedy nearest-neighbor to visit all targets efficiently
 */

import type { PathPoint } from './pathPlanning';

export interface Target {
  x: number; // grid column
  y: number; // grid row
  contributionLevel: number; // 1-4
}

export interface ActionSegment extends PathPoint {
  action: 'idle' | 'walk' | 'run' | 'shoot' | 'idle_shoot';
  targetX?: number; // shooting target position
  targetY?: number;
}

/**
 * Grid state tracker - which cells have been cleared
 */
class GridState {
  private cleared: Set<string>;
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.cleared = new Set();
  }

  /**
   * Check if a cell has been cleared (can move into it)
   */
  isCleared(x: number, y: number): boolean {
    return this.cleared.has(`${x},${y}`);
  }

  /**
   * Mark a cell as cleared
   */
  clear(x: number, y: number): void {
    this.cleared.add(`${x},${y}`);
  }

  /**
   * Check if position is outside grid bounds (always accessible)
   */
  isOutside(x: number, y: number): boolean {
    return x < 0 || y < 0 || x >= this.width || y >= this.height;
  }

  /**
   * Check if character can stand at this position
   */
  canStandAt(x: number, y: number): boolean {
    return this.isOutside(x, y) || this.isCleared(x, y);
  }
}

/**
 * Calculate Manhattan distance between two points
 */
function manhattanDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

/**
 * Find nearest unvisited target using greedy algorithm
 */
function findNearestTarget(
  currentX: number,
  currentY: number,
  targets: Target[],
  visited: Set<string>
): Target | null {
  let nearest: Target | null = null;
  let minDistance = Infinity;

  for (const target of targets) {
    const key = `${target.x},${target.y}`;
    if (visited.has(key)) continue;

    const distance = manhattanDistance(currentX, currentY, target.x, target.y);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = target;
    }
  }

  return nearest;
}

/**
 * Generate path from current position to a shooting position for the target
 * Then add a "turn and shoot" segment
 *
 * Shooting logic:
 * 1. Move to a position where target is in one of 4 cardinal directions
 * 2. Turn to face the target (this changes movement direction)
 * 3. Shoot in straight line
 */
function generatePathToShootTarget(
  fromX: number,
  fromY: number,
  targetX: number,
  targetY: number,
  cellSize: number,
  cellGap: number,
  speed: number,
  currentTime: number
): { path: PathPoint[], shootFromX: number, shootFromY: number, finalTime: number } {
  const path: PathPoint[] = [];
  const cellTotal = cellSize + cellGap;
  const m = (cellTotal - cellSize) / 2;

  let x = fromX;
  let y = fromY;
  let time = currentTime;

  // Strategy: Move to same row or column as target, then face it and shoot
  // Choose whether to align horizontally or vertically based on which is closer

  const dx = targetX - fromX;
  const dy = targetY - fromY;

  let shootFromGridX = fromX;
  let shootFromGridY = fromY;

  if (Math.abs(dx) > Math.abs(dy)) {
    // Target is more horizontal - align vertically first, then move horizontally
    // Move to target's row
    while (y !== targetY) {
      const step = y < targetY ? 1 : -1;
      y += step;
      time += cellTotal / speed;
      path.push({ x: x * cellTotal + m, y: y * cellTotal + m, time });
    }

    // Then move towards target column (but stop before target, so we can shoot)
    // Stop 1-3 cells away from target
    const targetCol = targetX;
    const stopBeforeTarget = x < targetCol ? targetCol - 1 : targetCol + 1;

    while (x !== stopBeforeTarget) {
      const step = x < stopBeforeTarget ? 1 : -1;
      x += step;
      time += cellTotal / speed;
      path.push({ x: x * cellTotal + m, y: y * cellTotal + m, time });
    }

    shootFromGridX = x;
    shootFromGridY = y;
  } else {
    // Target is more vertical - align horizontally first, then move vertically
    // Move to target's column
    while (x !== targetX) {
      const step = x < targetX ? 1 : -1;
      x += step;
      time += cellTotal / speed;
      path.push({ x: x * cellTotal + m, y: y * cellTotal + m, time });
    }

    // Then move towards target row (but stop before target)
    const targetRow = targetY;
    const stopBeforeTarget = y < targetRow ? targetRow - 1 : targetRow + 1;

    while (y !== stopBeforeTarget) {
      const step = y < stopBeforeTarget ? 1 : -1;
      y += step;
      time += cellTotal / speed;
      path.push({ x: x * cellTotal + m, y: y * cellTotal + m, time });
    }

    shootFromGridX = x;
    shootFromGridY = y;
  }

  return {
    path,
    shootFromX: shootFromGridX,
    shootFromY: shootFromGridY,
    finalTime: time
  };
}

/**
 * Create smart path that visits all contribution cells
 * Uses greedy nearest-neighbor algorithm (can be improved with better TSP solver)
 */
export function createSmartPath(
  targets: Target[],
  gridWidth: number,
  gridHeight: number,
  cellSize: number,
  cellGap: number,
  walkSpeed: number = 30,   // slow walk
  runSpeed: number = 60,    // fast run
  shootRange: number = 3    // cells within which to start shooting
): ActionSegment[] {
  if (targets.length === 0) {
    return [];
  }

  const cellTotal = cellSize + cellGap;
  // Same as blocks: center the position within the cell
  const m = (cellTotal - cellSize) / 2;
  const visited = new Set<string>();
  const segments: ActionSegment[] = [];

  // Start OUTSIDE the grid (top-left corner)
  // Character enters from outside and moves toward first target
  let currentX = -1;  // grid cell coordinates (-1 means outside grid on the left)
  let currentY = -1;  // grid cell coordinates (-1 means outside grid on top)
  
  // Start immediately, no entrance delay
  let currentTime = 0;

  // First position: outside grid (negative coordinates)
  segments.push({
    x: currentX * cellTotal + m,  // negative coordinates, outside grid
    y: currentY * cellTotal + m,  // negative coordinates, outside grid
    time: currentTime,
    action: 'idle',
  });

  // Safety limit to prevent infinite loops
  let iterations = 0;
  const maxIterations = targets.length + 10;

  // Visit all targets using nearest-neighbor greedy algorithm
  while (visited.size < targets.length && iterations < maxIterations) {
    iterations++;

    const nextTarget = findNearestTarget(currentX, currentY, targets, visited);
    if (!nextTarget) break;

    const targetKey = `${nextTarget.x},${nextTarget.y}`;
    visited.add(targetKey);

    // Shooting strategy: Move to a position where we can see the target
    // "See" means: same row or same column, with line of sight
    // We DON'T need to move TO the target, just to a position facing it

    const dx = nextTarget.x - currentX;
    const dy = nextTarget.y - currentY;

    // Decide approach direction: prioritize the longer distance
    if (Math.abs(dx) >= Math.abs(dy)) {
      // Approach horizontally
      // First, align vertically to same row as target
      while (currentY !== nextTarget.y) {
        const step = currentY < nextTarget.y ? 1 : -1;
        currentY += step;
        currentTime += cellTotal / runSpeed;
        segments.push({
          x: currentX * cellTotal + m,
          y: currentY * cellTotal + m,
          time: currentTime,
          action: 'run',
        });
      }

      // Now we're in the same row, move closer horizontally (but not all the way)
      // Stop when we're within shooting range
      const targetX = nextTarget.x;
      const minDistance = 1; // Stop 1 cell before target
      const desiredX = currentX < targetX ? targetX - minDistance : targetX + minDistance;

      while (currentX !== desiredX) {
        const step = currentX < desiredX ? 1 : -1;
        currentX += step;
        currentTime += cellTotal / runSpeed;
        segments.push({
          x: currentX * cellTotal + m,
          y: currentY * cellTotal + m,
          time: currentTime,
          action: 'run',
        });
      }
    } else {
      // Approach vertically
      // First, align horizontally to same column as target
      while (currentX !== nextTarget.x) {
        const step = currentX < nextTarget.x ? 1 : -1;
        currentX += step;
        currentTime += cellTotal / runSpeed;
        segments.push({
          x: currentX * cellTotal + m,
          y: currentY * cellTotal + m,
          time: currentTime,
          action: 'run',
        });
      }

      // Now we're in the same column, move closer vertically (but not all the way)
      const targetY = nextTarget.y;
      const minDistance = 1; // Stop 1 cell before target
      const desiredY = currentY < targetY ? targetY - minDistance : targetY + minDistance;

      while (currentY !== desiredY) {
        const step = currentY < desiredY ? 1 : -1;
        currentY += step;
        currentTime += cellTotal / runSpeed;
        segments.push({
          x: currentX * cellTotal + m,
          y: currentY * cellTotal + m,
          time: currentTime,
          action: 'run',
        });
      }
    }

    // Now we're facing the target, add a shooting pause
    currentTime += 0.1; // Brief pause to aim
    
    // Add shooting action
    segments.push({
      x: currentX * cellTotal + m,
      y: currentY * cellTotal + m,
      time: currentTime,
      action: 'idle_shoot',
      targetX: nextTarget.x * cellTotal + m,
      targetY: nextTarget.y * cellTotal + m,
    });
    
    // No waiting - character can move immediately after shooting
    // Block disappears instantly, explosion is just visual effect
  }

  console.log(`📍 Smart path generated: ${segments.length} segments, visited ${visited.size}/${targets.length} targets`);

  return segments;
}

/**
 * Convert ActionSegments back to PathPoints for compatibility
 */
export function actionSegmentsToPathPoints(segments: ActionSegment[]): PathPoint[] {
  return segments.map(seg => ({
    x: seg.x,
    y: seg.y,
    time: seg.time,
  }));
}
