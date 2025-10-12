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
 * Create a simple scanning path (left-to-right, row by row)
 * Similar to old-school arcade games
 */
export function createScanningPath(
  gridWidth: number,
  gridHeight: number,
  cellSize: number,
  cellGap: number,
  speed: number = 100 // pixels per second
): PathPoint[] {
  const path: PathPoint[] = [];
  let currentTime = 0;

  const cellTotal = cellSize + cellGap;

  // Start position (bottom-left, below the grid)
  const startX = 0;
  const startY = gridHeight * cellTotal + cellTotal * 2;

  path.push({ x: startX, y: startY, time: currentTime });

  // Move to first row
  const firstRowY = (gridHeight - 1) * cellTotal + cellSize / 2;
  const moveUpDistance = Math.abs(startY - firstRowY);
  currentTime += moveUpDistance / speed;
  path.push({ x: startX, y: firstRowY, time: currentTime });

  // Scan each row from bottom to top
  for (let row = gridHeight - 1; row >= 0; row--) {
    const y = row * cellTotal + cellSize / 2;

    // Move across the row
    if (row % 2 === 1) {
      // Odd rows: left to right
      for (let col = 0; col < gridWidth; col++) {
        const x = col * cellTotal + cellSize / 2;
        const distance = col > 0 ? cellTotal : 0;
        currentTime += distance / speed;
        path.push({ x, y, time: currentTime });
      }
    } else {
      // Even rows: right to left
      for (let col = gridWidth - 1; col >= 0; col--) {
        const x = col * cellTotal + cellSize / 2;
        const distance = col < gridWidth - 1 ? cellTotal : 0;
        currentTime += distance / speed;
        path.push({ x, y, time: currentTime });
      }
    }

    // Move to next row (if not the last row)
    if (row > 0) {
      const nextY = (row - 1) * cellTotal + cellSize / 2;
      currentTime += cellTotal / speed;
      const lastX = path[path.length - 1].x;
      path.push({ x: lastX, y: nextY, time: currentTime });
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
