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
 * Generate path from current position to target
 * Uses direct Manhattan path (horizontal then vertical)
 *
 * For simplicity, use direct path (can be enhanced with A* later)
 */
function generatePathToTarget(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  cellSize: number,
  cellGap: number,
  speed: number,
  currentTime: number
): PathPoint[] {
  const path: PathPoint[] = [];
  const cellTotal = cellSize + cellGap;
  // Same as blocks: center the position within the cell
  const m = (cellTotal - cellSize) / 2;

  let x = fromX;
  let y = fromY;
  let time = currentTime;

  // Move horizontally first (one cell at a time)
  const targetX = toX;
  while (x !== targetX) {
    const step = x < targetX ? 1 : -1;
    x += step;
    time += cellTotal / speed;
    path.push({ x: x * cellTotal + m, y: y * cellTotal + m, time });
  }

  // Then move vertically (one cell at a time)
  const targetY = toY;
  while (y !== targetY) {
    const step = y < targetY ? 1 : -1;
    y += step;
    time += cellTotal / speed;
    path.push({ x: x * cellTotal + m, y: y * cellTotal + m, time });
  }

  return path;
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

    const distance = manhattanDistance(currentX, currentY, nextTarget.x, nextTarget.y);

    // Determine action based on distance
    let speed: number;
    let action: 'walk' | 'run' | 'shoot';

    if (distance <= shootRange) {
      // Close range - shoot while moving
      speed = walkSpeed;
      action = 'shoot';
    } else {
      // Far range - just run
      speed = runSpeed;
      action = 'run';
    }

    // Generate path to target
    const pathToTarget = generatePathToTarget(
      currentX,
      currentY,
      nextTarget.x,
      nextTarget.y,
      cellSize,
      cellGap,
      speed,
      currentTime
    );

    // Add path segments with actions
    for (const point of pathToTarget) {
      segments.push({
        ...point,
        action,
        targetX: nextTarget.x * cellTotal + m,
        targetY: nextTarget.y * cellTotal + m,
      });
    }

    // Arrive at target - idle shoot
    if (pathToTarget.length > 0) {
      currentTime = pathToTarget[pathToTarget.length - 1].time;
    }
    const shootDuration = 0.5; // 0.5 seconds to shoot target
    currentTime += shootDuration;

    segments.push({
      x: nextTarget.x * cellTotal + m,
      y: nextTarget.y * cellTotal + m,
      time: currentTime,
      action: 'idle_shoot',
      targetX: nextTarget.x * cellTotal + m,
      targetY: nextTarget.y * cellTotal + m,
    });

    // Update current position
    currentX = nextTarget.x;
    currentY = nextTarget.y;
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
