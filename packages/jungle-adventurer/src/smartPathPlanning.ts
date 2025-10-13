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

export interface GridTarget {
  x: number; // grid column
  y: number; // grid row
  contributionLevel: number; // 1-4
}

export interface ActionSegment extends PathPoint {
  action: 'idle' | 'walk' | 'run' | 'shoot' | 'idle_shoot' | 'reload';
  targetX?: number; // shooting target position
  targetY?: number;
  targetIndex?: number; // original index in targets array (for hitTime mapping)
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
 * Check if there's a clear line of sight from (fromX, fromY) to (toX, toY)
 * Returns true if can shoot from current position to target
 */
function hasLineOfSight(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): boolean {
  // Can shoot if in same row or same column
  return fromX === toX || fromY === toY;
}

/**
 * Find a path from current position to a shooting position near target
 * Uses BFS to find valid path through cleared cells
 * Returns path as grid coordinates, or null if no path exists
 */
function findPathToShootingPosition(
  fromX: number,
  fromY: number,
  targetX: number,
  targetY: number,
  gridState: GridState,
  gridWidth: number,
  gridHeight: number
): { x: number; y: number }[] | null {
  // Candidate shooting positions:
  // - Adjacent cells (inside grid)
  // - Outside ring positions aligned with the target (allow starting outside)
  const shootingPositions = [
    { x: targetX - 1, y: targetY }, // from left (inside)
    { x: targetX + 1, y: targetY }, // from right (inside)
    { x: targetX, y: targetY - 1 }, // from above (inside)
    { x: targetX, y: targetY + 1 }, // from below (inside)
    { x: -1, y: targetY },          // outside left
    { x: gridWidth, y: targetY },   // outside right
    { x: targetX, y: -1 },          // outside top
    { x: targetX, y: gridHeight },  // outside bottom
  ];

  // Try each shooting position, find the one with shortest path
  let bestPath: { x: number; y: number }[] | null = null;
  let bestLength = Infinity;

  for (const shootPos of shootingPositions) {
    // Check if shooting position is valid (can stand there)
    if (!gridState.canStandAt(shootPos.x, shootPos.y)) continue;

    // BFS to find path
    const path = bfsPathfinding(fromX, fromY, shootPos.x, shootPos.y, gridState, gridWidth, gridHeight);
    if (path && path.length < bestLength) {
      bestPath = path;
      bestLength = path.length;
    }
  }

  return bestPath;
}

/**
 * BFS pathfinding - finds shortest path from (fromX, fromY) to (toX, toY)
 * Only walks through cells where gridState.canStandAt() is true
 */
function bfsPathfinding(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  gridState: GridState,
  gridWidth: number,
  gridHeight: number
): { x: number; y: number }[] | null {
  if (fromX === toX && fromY === toY) {
    return [{ x: fromX, y: fromY }];
  }

  type Node = { x: number; y: number; parent: Node | null };
  const visited = new Set<string>();
  const queue: Node[] = [{ x: fromX, y: fromY, parent: null }];
  visited.add(`${fromX},${fromY}`);

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Found destination
    if (current.x === toX && current.y === toY) {
      // Reconstruct path
      const path: { x: number; y: number }[] = [];
      let node: Node | null = current;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path;
    }

    // Try all 4 directions
    const directions = [
      { dx: 1, dy: 0 },   // right
      { dx: -1, dy: 0 },  // left
      { dx: 0, dy: 1 },   // down
      { dx: 0, dy: -1 },  // up
    ];

    for (const { dx, dy } of directions) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const key = `${nx},${ny}`;

      // Enforce bounds: allow walking inside grid and a 1-cell outside border [-1..gridWidth] x [-1..gridHeight]
      if (nx < -1 || ny < -1 || nx > gridWidth || ny > gridHeight) continue;

      // Skip if already visited
      if (visited.has(key)) continue;

      // Skip if can't stand there
      if (!gridState.canStandAt(nx, ny)) continue;

      // Add to queue
      visited.add(key);
      queue.push({ x: nx, y: ny, parent: current });
    }
  }

  // No path found
  return null;
}

/**
 * Find a blocking cell on the path and check if we can shoot it from current position
 * Returns the blocker if found and shootable, null otherwise
 */
function findShootableBlocker(
  currentX: number,
  currentY: number,
  targetX: number,
  targetY: number,
  gridState: GridState,
  targets: GridTarget[],
  visited: Set<string>
): GridTarget | null {
  // Check if there's a blocker in our path
  // For horizontal movement
  if (currentY === targetY) {
    const step = currentX < targetX ? 1 : -1;
    for (let x = currentX + step; x !== targetX; x += step) {
      if (!gridState.canStandAt(x, currentY)) {
        // Found a blocker! Check if it's a target we can shoot (and haven't visited yet)
        const blockerTarget = targets.find(t => t.x === x && t.y === currentY);
        const blockerKey = blockerTarget ? `${blockerTarget.x},${blockerTarget.y}` : '';
        if (blockerTarget && !visited.has(blockerKey) && hasLineOfSight(currentX, currentY, x, currentY)) {
          return blockerTarget;
        }
      }
    }
  }

  // For vertical movement
  if (currentX === targetX) {
    const step = currentY < targetY ? 1 : -1;
    for (let y = currentY + step; y !== targetY; y += step) {
      if (!gridState.canStandAt(currentX, y)) {
        // Found a blocker! Check if it's a target we can shoot (and haven't visited yet)
        const blockerTarget = targets.find(t => t.x === currentX && t.y === y);
        const blockerKey = blockerTarget ? `${blockerTarget.x},${blockerTarget.y}` : '';
        if (blockerTarget && !visited.has(blockerKey) && hasLineOfSight(currentX, currentY, currentX, y)) {
          return blockerTarget;
        }
      }
    }
  }

  return null;
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
  targets: GridTarget[],
  visited: Set<string>
): GridTarget | null {
  let nearest: GridTarget | null = null;
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
  currentTime: number,
  gridWidth: number,
  gridHeight: number
): { path: PathPoint[], shootFromX: number, shootFromY: number, finalTime: number } {
  const path: PathPoint[] = [];
  const cellTotal = cellSize + cellGap;
  const m = (cellTotal - cellSize) / 2;

  // Helper function to convert grid coords to pixel coords
  // When outside grid, adjust position to avoid overlapping with edge blocks
  const gridToPixel = (gridX: number, gridY: number): { x: number, y: number } => {
    // Place sprite at cell center (gridX * 14 + 7), not at corner+margin
    let pixelX = gridX * cellTotal + cellTotal / 2;
    let pixelY = gridY * cellTotal + cellTotal / 2;

    // Character sprite frame size: 33.6px x 44.8px (48x64 frame at scale 0.7)
    // Frame half-width: 16.8px, Frame half-height: 22.4px

    // Move sprite away from grid edges to avoid overlapping
    if (gridX < 0) {
      pixelX -= 10;
    } else if (gridX >= gridWidth) {
      pixelX += 10;
    }

    if (gridY < 0) {
      pixelY -= 10;
    } else if (gridY >= gridHeight) {
      pixelY += 10;
    }

    return { x: pixelX, y: pixelY };
  };  let x = fromX;
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
      const pos = gridToPixel(x, y);
      path.push({ x: pos.x, y: pos.y, time });
    }

    // Then move towards target column (but stop before target, so we can shoot)
    // Stop 1-3 cells away from target
    const targetCol = targetX;
    const stopBeforeTarget = x < targetCol ? targetCol - 1 : targetCol + 1;

    while (x !== stopBeforeTarget) {
      const step = x < stopBeforeTarget ? 1 : -1;
      x += step;
      time += cellTotal / speed;
      const pos = gridToPixel(x, y);
      path.push({ x: pos.x, y: pos.y, time });
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
      const pos = gridToPixel(x, y);
      path.push({ x: pos.x, y: pos.y, time });
    }

    // Then move towards target row (but stop before target)
    const targetRow = targetY;
    const stopBeforeTarget = y < targetRow ? targetRow - 1 : targetRow + 1;

    while (y !== stopBeforeTarget) {
      const step = y < stopBeforeTarget ? 1 : -1;
      y += step;
      time += cellTotal / speed;
      const pos = gridToPixel(x, y);
      path.push({ x: pos.x, y: pos.y, time });
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
 * PRINCIPLE: Follow snk strategy - clear blocks by contribution level (low to high)
 * - Level 1 (lowest) first
 * - Level 2 second
 * - Level 3 third
 * - Level 4 (highest) last
 */
export function createSmartPath(
  targets: GridTarget[],
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
  const segments: ActionSegment[] = [];

  // Helper function to convert grid coords to pixel coords
  // When outside grid, adjust position to avoid overlapping with edge blocks
  const gridToPixel = (gridX: number, gridY: number): { x: number, y: number } => {
    // Place sprite at cell center (gridX * 14 + 7), not at corner+margin
    let pixelX = gridX * cellTotal + cellTotal / 2;
    let pixelY = gridY * cellTotal + cellTotal / 2;

    // Character sprite frame size: 33.6px x 44.8px (48x64 frame at scale 0.7)
    // Frame half-width: 16.8px, Frame half-height: 22.4px

    // Move sprite away from grid edges to avoid overlapping with edge blocks
    if (gridX < 0) {
      pixelX -= 10;  // Move LEFT away from grid
    } else if (gridX >= gridWidth) {
      pixelX += 10;  // Move RIGHT away from grid
    }

    if (gridY < 0) {
      pixelY -= 10;  // Move UP away from grid
    } else if (gridY >= gridHeight) {
      pixelY += 10;  // Move DOWN away from grid
    }

    return { x: pixelX, y: pixelY };
  };

  // Track which cells have been cleared (can walk through)
  const gridState = new GridState(gridWidth, gridHeight);

  // Start OUTSIDE the grid (top-left corner)
  let currentX = -1;  // grid cell coordinates (-1 means outside grid on the left)
  let currentY = -1;  // grid cell coordinates (-1 means outside grid on top)
  let currentTime = 0;

  // First position: outside grid
  const startPos = gridToPixel(currentX, currentY);
  segments.push({
    x: startPos.x,
    y: startPos.y,
    time: currentTime,
    action: 'idle',
  });

  // SNK PRINCIPLE: Sort targets by contribution level (low to high)
  // Level 1 first, then 2, 3, 4
  // IMPORTANT: Track original index before sorting so we can map back to blocks array
  const targetsWithIndex = targets.map((t, index) => ({ ...t, originalIndex: index }));
  const sortedTargets = targetsWithIndex.sort((a, b) => a.contributionLevel - b.contributionLevel);

  const levelCounts = sortedTargets.reduce((acc, t) => {
    acc[t.contributionLevel] = (acc[t.contributionLevel] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  console.log(`📊 Targets by level: L1=${levelCounts[1]||0}, L2=${levelCounts[2]||0}, L3=${levelCounts[3]||0}, L4=${levelCounts[4]||0}`);

  const visited = new Set<string>();
  const attemptedBlockers = new Set<string>(); // Track blockers we've tried to prioritize

  // Process each target in order (low contribution first)
  // Use while loop with manual index to safely handle array modifications
  let targetIndex = 0;
  const maxIterations = sortedTargets.length * 10; // Safety limit to prevent infinite loops
  let iterations = 0;

  while (targetIndex < sortedTargets.length && iterations < maxIterations) {
    iterations++;
    const nextTarget = sortedTargets[targetIndex];
    const targetKey = `${nextTarget.x},${nextTarget.y}`;

    if (visited.has(targetKey)) {
      targetIndex++;
      continue; // Already cleared
    }

    // KEY DIFFERENCE FROM SNK:
    // - snk finds path TO the target cell (walks on it)
    // - We find path to a SHOOTING POSITION (1 cell away, with line of sight)

    // Find path to a position where we can shoot the target
    const path = findPathToShootingPosition(
      currentX,
      currentY,
      nextTarget.x,
      nextTarget.y,
      gridState,
      gridWidth,
      gridHeight
    );

    if (!path) {
      // No direct path - target is blocked
      // Try to find a blocker we can shoot to clear the way
      console.log(`[PATH] Target at (${nextTarget.x}, ${nextTarget.y}) is blocked, looking for shootable blockers...`);

      // Find all possible shooting positions around the target
      const shootingPositions = [
        { x: nextTarget.x - 1, y: nextTarget.y },
        { x: nextTarget.x + 1, y: nextTarget.y },
        { x: nextTarget.x, y: nextTarget.y - 1 },
        { x: nextTarget.x, y: nextTarget.y + 1 },
      ];

      // Find blockers that are preventing us from reaching shooting positions
      let foundBlocker = false;
      for (const shootPos of shootingPositions) {
        // Check if this shooting position is blocked by a target
        if (!gridState.canStandAt(shootPos.x, shootPos.y)) {
          const blockerTarget = sortedTargets.find(t => t.x === shootPos.x && t.y === shootPos.y && !visited.has(`${t.x},${t.y}`));
          if (blockerTarget) {
            const blockerKey = `${blockerTarget.x},${blockerTarget.y}`;

            // Check if we've already tried to prioritize this blocker (circular dependency)
            if (attemptedBlockers.has(blockerKey)) {
              console.warn(`[PATH] Circular blocker dependency detected at (${blockerTarget.x}, ${blockerTarget.y}), skipping`);
              continue;
            }

            // Found a blocker! Process it first
            console.log(`[PATH] Found blocker at (${blockerTarget.x}, ${blockerTarget.y}), will shoot it first`);
            attemptedBlockers.add(blockerKey);

            // Remove any existing occurrence of this blocker to avoid duplicating it
            const existingIdx = sortedTargets.indexOf(blockerTarget);
            if (existingIdx !== -1) {
              // Remove the existing entry
              sortedTargets.splice(existingIdx, 1);
              // Adjust current index if blocker was before current position
              if (existingIdx < targetIndex) {
                targetIndex--;
              }
            }
            // Insert blocker before current target
            sortedTargets.splice(targetIndex, 0, blockerTarget);
            foundBlocker = true;
            break;
          }
        }
      }

      if (!foundBlocker) {
        console.warn(`[PATH] No path found to shoot target at (${nextTarget.x}, ${nextTarget.y}) and no shootable blockers found`);
        // Skip this target and move on to prevent infinite loop
        targetIndex++;
        continue;
      }
      // Don't increment index - we want to process the blocker we just inserted
      continue;
    }

    // Follow the path (skip first point as it's current position)
    for (let i = 1; i < path.length; i++) {
      currentX = path[i].x;
      currentY = path[i].y;
      currentTime += cellTotal / runSpeed;

      const pos = gridToPixel(currentX, currentY);
      segments.push({
        x: pos.x,
        y: pos.y,
        time: currentTime,
        action: 'run',
      });
    }

    // Minimal pause at shooting position - just enough to stop moving
    // No explicit aiming pause needed - the hold below provides it

    const shootPos = gridToPixel(currentX, currentY);
    const targetPos = gridToPixel(nextTarget.x, nextTarget.y);

    // Add reload action BEFORE shooting so we can visually confirm reload happens
    // Reload animation: use 8-frame reload sprites (walk_while_reloading_* exist)
    const reloadHoldDuration = 0.5; // 500ms reload (approx)
    const reloadSteps = 4; // break reload into a few segments so it's visible
    segments.push({
      x: shootPos.x,
      y: shootPos.y,
      time: currentTime,
      action: 'reload',
      targetX: targetPos.x,  // Face the target while reloading
      targetY: targetPos.y,
    });
    for (let r = 1; r <= reloadSteps; r++) {
      currentTime += reloadHoldDuration / reloadSteps;
      segments.push({
        x: shootPos.x,
        y: shootPos.y,
        time: currentTime,
        action: 'reload',
        targetX: targetPos.x,  // Keep facing target
        targetY: targetPos.y,
      });
    }

    // Add shooting action
    segments.push({
      x: shootPos.x,
      y: shootPos.y,
      time: currentTime,
      action: 'idle_shoot',
      targetX: targetPos.x,
      targetY: targetPos.y,
      targetIndex: nextTarget.originalIndex,  // Store original index for hitTime mapping
    });

    // Hold duration for shooting animation
    // Shooting sprite: 8 frames @ 12 FPS = 0.67s total animation
    // Play the complete 8-frame animation (includes muzzle flash naturally)
    const shootingHoldDuration = 8 / 12; // Full 8-frame animation = 0.67s
    const holdSteps = 8; // 8 stationary points for 8-frame animation

    for (let i = 1; i <= holdSteps; i++) {
      currentTime += shootingHoldDuration / holdSteps;
      segments.push({
        x: shootPos.x,  // Same position - character is stationary
        y: shootPos.y,  // Same position - character is stationary
        time: currentTime,
        action: 'idle_shoot', // Keep showing shooting animation
        targetX: targetPos.x,
        targetY: targetPos.y,
      });
    }

    // Add a small buffer after shooting to ensure block disappears before moving
    // Block destroys at lastShootTime - 0.08s, so we need to wait until after that
    const blockDestructionBuffer = 0.05; // 50ms after shooting hold ends
    currentTime += blockDestructionBuffer;

    segments.push({
      x: shootPos.x,
      y: shootPos.y,
      time: currentTime,
      action: 'idle', // Brief idle to ensure block is gone
    });

  // Mark target as cleared so subsequent BFS can traverse it.
  // The small buffer above prevents walking through a still-visible block.
  gridState.clear(nextTarget.x, nextTarget.y);

  // Record that we've visited this target so it's not targeted again
  visited.add(targetKey);

    // Character now pauses during shooting for visual clarity
    // The shooting hold duration ensures visible aiming and firing

    // Move to next target in the list
    targetIndex++;
  }

  console.log(`📍 Smart path generated: ${segments.length} segments, visited ${visited.size}/${targets.length} targets (by contribution level)`);

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
