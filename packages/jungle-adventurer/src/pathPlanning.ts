/**
 * Path Planning System
 * Simplified path algorithm for character movement
 */

export interface PathPoint {
  x: number;
  y: number;
  time: number; // Time at this point (seconds)
}

export interface GridCell {
  x: number;
  y: number;
  hasBlock: boolean;
  contributionLevel: number; // 0-4
}

/**
 * Create a simple scanning path (left-to-right, top-to-bottom)
 *
 * Coordinate system:
 * - X: column * cellTotal (left to right, 0 to gridWidth-1)
 * - Y: row * cellTotal (top to bottom, 0 to gridHeight-1)
 * - Origin (0,0) is top-left of the grid
 * - Character moves within grid cells (no padding needed)
 */
export function createScanningPath(
  gridWidth: number,
  gridHeight: number,
  cellSize: number,
  cellGap: number,
  speed: number = 50 // reduced default speed
): PathPoint[] {
  const path: PathPoint[] = [];
  let currentTime = 0;

  const cellTotal = cellSize + cellGap;
  const m = cellTotal / 2; // center of cell

  // Start position at first cell (top-left)
  const startX = m;
  const startY = m;

  path.push({ x: startX, y: startY, time: currentTime });

  // Scan each row from top to bottom
  // ALWAYS left to right to avoid "backwards running"
  for (let row = 0; row < gridHeight; row++) {
    const y = row * cellTotal + m;

    // Always move left to right
    for (let col = 0; col < gridWidth; col++) {
      const x = col * cellTotal + m;

      // Skip first cell (already there)
      if (row === 0 && col === 0) continue;

      if (path.length > 0) {
        const lastPoint = path[path.length - 1];
        const distance = Math.sqrt(
          Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2)
        );
        currentTime += distance / speed;
      }

      path.push({ x, y, time: currentTime });
    }

    // Move to next row (if not the last row)
    // Two-step movement: down first, then left to start of next row
    if (row < gridHeight - 1) {
      const nextY = (row + 1) * cellTotal + m;
      const lastPoint = path[path.length - 1];

      // Step 1: Move down (keep same X)
      currentTime += cellTotal / speed;
      path.push({ x: lastPoint.x, y: nextY, time: currentTime });

      // Step 2: Move left to start of next row (if not already there)
      if (lastPoint.x !== m) {
        const horizontalDistance = Math.abs(lastPoint.x - m);
        currentTime += horizontalDistance / speed;
        path.push({ x: m, y: nextY, time: currentTime });
      }
    }
  }

  return path;
}

/**
 * Create a zigzag path (more dynamic)
 */
export function createZigzagPath(
  gridWidth: number,
  gridHeight: number,
  cellSize: number,
  cellGap: number,
  speed: number = 120
): PathPoint[] {
  const path: PathPoint[] = [];
  let currentTime = 0;

  const cellTotal = cellSize + cellGap;

  // Start at bottom-center
  const startX = (gridWidth / 2) * cellTotal;
  const startY = gridHeight * cellTotal + cellTotal * 2;

  path.push({ x: startX, y: startY, time: currentTime });

  // Zigzag pattern
  for (let row = gridHeight - 1; row >= 0; row--) {
    const y = row * cellTotal + cellSize / 2;

    // Determine direction based on row
    const direction = row % 2 === 0 ? 1 : -1;
    const startCol = row % 2 === 0 ? 0 : gridWidth - 1;
    const endCol = row % 2 === 0 ? gridWidth - 1 : 0;

    for (let col = startCol; direction > 0 ? col <= endCol : col >= endCol; col += direction) {
      const x = col * cellTotal + cellSize / 2;

      if (path.length > 0) {
        const lastPoint = path[path.length - 1];
        const distance = Math.sqrt(
          Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2)
        );
        currentTime += distance / speed;
      }

      path.push({ x, y, time: currentTime });
    }
  }

  return path;
}

/**
 * Create a spiral path (center outward or outward to center)
 */
export function createSpiralPath(
  gridWidth: number,
  gridHeight: number,
  cellSize: number,
  cellGap: number,
  speed: number = 100,
  inward: boolean = true
): PathPoint[] {
  const path: PathPoint[] = [];
  let currentTime = 0;
  const cellTotal = cellSize + cellGap;

  const visited = new Set<string>();
  let row = inward ? 0 : Math.floor(gridHeight / 2);
  let col = inward ? 0 : Math.floor(gridWidth / 2);

  // Start position
  const startX = (gridWidth / 2) * cellTotal;
  const startY = gridHeight * cellTotal + cellTotal * 2;
  path.push({ x: startX, y: startY, time: currentTime });

  // Spiral directions: right, down, left, up
  const directions = [
    { dx: 1, dy: 0 },  // right
    { dx: 0, dy: 1 },  // down
    { dx: -1, dy: 0 }, // left
    { dx: 0, dy: -1 }, // up
  ];

  let dirIndex = 0;
  let steps = 1;
  let stepCount = 0;
  let directionChanges = 0;

  while (visited.size < gridWidth * gridHeight) {
    for (let i = 0; i < steps; i++) {
      if (col >= 0 && col < gridWidth && row >= 0 && row < gridHeight) {
        const key = `${col},${row}`;
        if (!visited.has(key)) {
          const x = col * cellTotal + cellSize / 2;
          const y = row * cellTotal + cellSize / 2;

          if (path.length > 0) {
            const lastPoint = path[path.length - 1];
            const distance = Math.sqrt(
              Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2)
            );
            currentTime += distance / speed;
          }

          path.push({ x, y, time: currentTime });
          visited.add(key);
        }
      }

      col += directions[dirIndex].dx;
      row += directions[dirIndex].dy;
    }

    dirIndex = (dirIndex + 1) % 4;
    directionChanges++;

    if (directionChanges % 2 === 0) {
      steps++;
    }

    // Safety break
    if (stepCount++ > gridWidth * gridHeight * 2) break;
  }

  return path;
}

/**
 * Smooth a path by adding interpolated points
 */
export function smoothPath(
  path: PathPoint[],
  pointsPerSegment: number = 5
): PathPoint[] {
  if (path.length < 2) return path;

  const smoothedPath: PathPoint[] = [path[0]];

  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i + 1];

    for (let j = 1; j <= pointsPerSegment; j++) {
      const t = j / pointsPerSegment;
      const x = p1.x + (p2.x - p1.x) * t;
      const y = p1.y + (p2.y - p1.y) * t;
      const time = p1.time + (p2.time - p1.time) * t;
      smoothedPath.push({ x, y, time });
    }
  }

  return smoothedPath;
}

export default {
  createScanningPath,
  createZigzagPath,
  createSpiralPath,
  smoothPath,
};
