/**
 * Shooting System
 * Handles bullet generation, trajectory calculation, and collision detection
 */

export interface Bullet {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  startTime: number; // Animation timeline position (seconds)
  duration: number; // Flight duration (seconds)
  speed: number; // Pixels per second
}

export interface Target {
  x: number;
  y: number;
  width: number;
  height: number;
  hitTime?: number; // When this target gets hit (seconds in timeline)
}

export interface ShootingConfig {
  /** Character position */
  characterX: number;
  characterY: number;
  /** Character display size (for calculating muzzle position) */
  characterWidth?: number;
  characterHeight?: number;
  /** Bullet spawn offset from character center */
  bulletOffsetX?: number;
  bulletOffsetY?: number;
  /** Bullet size */
  bulletWidth?: number;
  bulletHeight?: number;
  /** Bullet speed (px/s) */
  bulletSpeed?: number;
  /** Fire rate (bullets per second) */
  fireRate?: number;
  /** Bullet color */
  bulletColor?: string;
  /** Bullet trail effect */
  hasTrail?: boolean;
}

/**
 * Calculate distance between two points
 */
export function calculateDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate bullet flight duration based on distance and speed
 */
export function calculateBulletDuration(
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  speed: number
): number {
  if (speed <= 0) {
    throw new Error(`Bullet speed must be positive, got ${speed}`);
  }
  const distance = calculateDistance(startX, startY, targetX, targetY);
  return distance / speed;
}

/**
 * Generate bullets to shoot at targets
 * Returns array of bullets with timing information
 */
export function generateBullets(
  characterPath: { x: number; y: number; time: number }[],
  targets: Target[],
  config: ShootingConfig
): Bullet[] {
  const {
    bulletOffsetX = 0,
    bulletOffsetY = -10, // Shoot from slightly above center
    bulletSpeed = 150,
    fireRate = 3,
  } = config;

  // Validate parameters to prevent Infinity/NaN in calculations
  if (bulletSpeed <= 0) {
    throw new Error(`bulletSpeed must be positive, got ${bulletSpeed}`);
  }
  if (fireRate <= 0) {
    throw new Error(`fireRate must be positive, got ${fireRate}`);
  }

  const bullets: Bullet[] = [];
  const fireInterval = 1 / fireRate;

  let bulletIdCounter = 0;
  let lastFireTime = -fireInterval; // Allow immediate first shot

  // Sort targets by distance from start (shoot nearest first)
  const sortedTargets = [...targets].sort((a, b) => {
    const distA = calculateDistance(
      characterPath[0].x,
      characterPath[0].y,
      a.x,
      a.y
    );
    const distB = calculateDistance(
      characterPath[0].x,
      characterPath[0].y,
      b.x,
      b.y
    );
    return distA - distB;
  });

  // Track which targets have been shot
  const remainingTargets = new Set(sortedTargets);

  // Iterate through character path
  for (let i = 0; i < characterPath.length; i++) {
    const currentPos = characterPath[i];
    const currentTime = currentPos.time;

    // Calculate movement direction from the direction character is currently traveling
    // Use previous->current for current direction (not current->next which is future direction)
    let movementDirX = 0;
    let movementDirY = 0;

    // Use previous to current for movement direction (the direction we just traveled)
    if (i > 0) {
      const prevPos = characterPath[i - 1];
      movementDirX = currentPos.x - prevPos.x;
      movementDirY = currentPos.y - prevPos.y;
      const len = Math.sqrt(movementDirX * movementDirX + movementDirY * movementDirY);
      if (len > 0) {
        movementDirX /= len;
        movementDirY /= len;
      }
    } else {
      // At start (i=0), use current to next for initial direction
      if (i < characterPath.length - 1) {
        const nextPos = characterPath[i + 1];
        movementDirX = nextPos.x - currentPos.x;
        movementDirY = nextPos.y - currentPos.y;
        const len = Math.sqrt(movementDirX * movementDirX + movementDirY * movementDirY);
        if (len > 0) {
          movementDirX /= len;
          movementDirY /= len;
        }
      }
    }

    // Check if enough time has passed to fire again
    if (currentTime - lastFireTime >= fireInterval) {
      // Find nearest unshot target AHEAD in movement direction
      let nearestTarget: Target | null = null;
      let nearestDistance = Infinity;
      const shootRange = 300; // Max shooting range in pixels

      // DEBUG: Log movement direction for first few bullets
      if (bullets.length < 3) {
        console.log(`[DEBUG] Bullet ${bullets.length} @ ${currentTime.toFixed(2)}s: movementDir=(${movementDirX.toFixed(2)}, ${movementDirY.toFixed(2)})`);
      }

      for (const target of remainingTargets) {
        const targetCenterX = target.x + target.width / 2;
        const targetCenterY = target.y + target.height / 2;

        // Vector from character to target
        const toTargetX = targetCenterX - currentPos.x;
        const toTargetY = targetCenterY - currentPos.y;

        // Dot product to check if target is ahead (in front of character)
        // If moving, only shoot targets in front (dot product > 0)
        const dotProduct = toTargetX * movementDirX + toTargetY * movementDirY;
        const isAhead = movementDirX === 0 && movementDirY === 0 ? true : dotProduct > 0;

        const distance = calculateDistance(
          currentPos.x,
          currentPos.y,
          targetCenterX,
          targetCenterY
        );

        // DEBUG: Log target evaluation for first bullet
        if (bullets.length === 0 && distance < 100) {
          console.log(`  Target @ (${targetCenterX.toFixed(1)}, ${targetCenterY.toFixed(1)}): toTarget=(${toTargetX.toFixed(1)}, ${toTargetY.toFixed(1)}), dot=${dotProduct.toFixed(2)}, isAhead=${isAhead}`);
        }

        if (isAhead && distance <= shootRange && distance < nearestDistance) {
          nearestDistance = distance;
          nearestTarget = target;
        }
      }

      // Fire at the nearest target
      if (nearestTarget) {
        // Calculate direction to target
        const dx = nearestTarget.x + nearestTarget.width / 2 - currentPos.x;
        const dy = nearestTarget.y + nearestTarget.height / 2 - currentPos.y;
        const angle = Math.atan2(dy, dx);

        // Calculate gun muzzle offset based on shooting direction and character size
        // Character center is at currentPos, we need to offset to the edge where gun is
        const characterWidth = config.characterWidth || 48;
        const characterHeight = config.characterHeight || 64;

        // Determine which direction we're shooting (horizontal or vertical dominant)
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        let muzzleOffsetX = 0;
        let muzzleOffsetY = 0;

        if (absX >= absY) {
          // Horizontal shooting (left/right) - also handles diagonal case
          // Gun muzzle is at character's horizontal edge, vertical center
          muzzleOffsetX = (dx > 0 ? 1 : -1) * (characterWidth / 2);
          muzzleOffsetY = 0; // Keep at vertical center
        } else {
          // Vertical shooting (up/down)
          // Gun muzzle is at character's vertical edge, horizontal center
          muzzleOffsetX = 0; // Keep at horizontal center
          muzzleOffsetY = (dy > 0 ? 1 : -1) * (characterHeight / 2);
        }

        const bulletStartX = currentPos.x + muzzleOffsetX;
        const bulletStartY = currentPos.y + muzzleOffsetY;

        // DEBUG: Log first few bullets
        if (bullets.length < 3) {
          console.log(`  [BULLET ${bullets.length}] charPos=(${currentPos.x.toFixed(1)}, ${currentPos.y.toFixed(1)}), muzzleOffset=(${muzzleOffsetX.toFixed(1)}, ${muzzleOffsetY.toFixed(1)}), bulletStart=(${bulletStartX.toFixed(1)}, ${bulletStartY.toFixed(1)}), target=(${(nearestTarget.x + nearestTarget.width/2).toFixed(1)}, ${(nearestTarget.y + nearestTarget.height/2).toFixed(1)})`);
        }

        const duration = calculateBulletDuration(
          bulletStartX,
          bulletStartY,
          nearestTarget.x + nearestTarget.width / 2,
          nearestTarget.y + nearestTarget.height / 2,
          bulletSpeed
        );

        const bullet: Bullet = {
          id: `bullet-${bulletIdCounter++}`,
          startX: bulletStartX,
          startY: bulletStartY,
          targetX: nearestTarget.x + nearestTarget.width / 2,
          targetY: nearestTarget.y + nearestTarget.height / 2,
          startTime: currentTime,
          duration,
          speed: bulletSpeed,
        };

        bullets.push(bullet);

        // Mark when this target gets hit
        nearestTarget.hitTime = currentTime + duration;

        // Remove from remaining targets
        remainingTargets.delete(nearestTarget);

        lastFireTime = currentTime;
      }
    }
  }

  return bullets;
}

/**
 * Create SVG element for a single bullet
 * The bullet needs to follow the character until it's fired
 */
export function createBulletSVG(
  bullet: Bullet,
  config: ShootingConfig,
  characterPath?: { x: number; y: number; time: number }[]
): string {
  const {
    bulletWidth = 2,
    bulletHeight = 4,
    bulletColor = '#ffff00',
    hasTrail = true,
  } = config;

  // Build the complete bullet path:
  // 1. If characterPath provided, follow character from start until bullet.startTime
  // 2. Then fly from bullet.startX,startY to target

  let completePath = '';
  let totalDuration = 0;

  if (characterPath && characterPath.length > 0) {
    // Find the character position at bullet start time
    // Bullet follows character until startTime, then shoots
    const pathBeforeFire = characterPath.filter(p => p.time <= bullet.startTime);

    if (pathBeforeFire.length > 1) {
      // Follow character's path from start to fire time
      const pathPoints = pathBeforeFire.map(p => `${p.x},${p.y}`).join(' L ');
      completePath = `M ${pathPoints}`;
      totalDuration = bullet.startTime;
    } else if (pathBeforeFire.length === 1) {
      // Only one point (start time = 0), just start from there
      completePath = `M ${pathBeforeFire[0].x},${pathBeforeFire[0].y}`;
      totalDuration = 0;
    } else {
      // Shouldn't happen, but fallback
      completePath = `M ${bullet.startX},${bullet.startY}`;
      totalDuration = 0;
    }

    // Add the shooting trajectory
    completePath += ` L ${bullet.targetX},${bullet.targetY}`;
    totalDuration += bullet.duration;
  } else {
    // Fallback: just the shooting trajectory
    completePath = `M ${bullet.startX},${bullet.startY} L ${bullet.targetX},${bullet.targetY}`;
    totalDuration = bullet.duration;
  }

  return `
  <g class="bullet" id="${bullet.id}">
    ${hasTrail && characterPath ? createBulletTrail(bullet, bulletColor, characterPath) : ''}
    <rect
      width="${bulletWidth}"
      height="${bulletHeight}"
      fill="${bulletColor}"
      rx="1"
      x="${-bulletWidth / 2}"
      y="${-bulletHeight / 2}"
      opacity="0"
    >
      <!-- Position animation - follows character then shoots -->
      <animateMotion
        path="${completePath}"
        dur="${totalDuration}s"
        begin="0s"
        fill="freeze"
      />

      <!-- Show bullet only when it fires (at startTime) -->
      <set attributeName="opacity" to="1" begin="${bullet.startTime}s" />

      <!-- Fade out on impact - use shorter duration for fast bullets -->
      <animate
        attributeName="opacity"
        from="1"
        to="0"
        dur="${Math.min(0.1, bullet.duration * 0.3)}s"
        begin="${totalDuration - Math.min(0.1, bullet.duration * 0.3)}s"
        fill="freeze"
      />
    </rect>
  </g>`;
}

/**
 * Create bullet trail effect
 * Trail only appears during the shooting phase, following the bullet
 */
function createBulletTrail(
  bullet: Bullet,
  color: string,
  characterPath?: { x: number; y: number; time: number }[]
): string {
  // Trail is a short line segment that follows the bullet
  // It only appears during the shooting phase
  const trailStartTime = bullet.startTime;
  const trailLength = 8; // Trail length in pixels

  // Calculate trail direction (opposite to bullet direction)
  const dx = bullet.targetX - bullet.startX;
  const dy = bullet.targetY - bullet.startY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0) return ''; // No trail for zero-distance bullets

  const trailDx = (-dx / distance) * trailLength;
  const trailDy = (-dy / distance) * trailLength;

  // Build the same path as the bullet for following character
  let completePath = '';
  let totalDuration = 0;

  if (characterPath && characterPath.length > 0) {
    const pathBeforeFire = characterPath.filter(p => p.time <= bullet.startTime);

    if (pathBeforeFire.length > 1) {
      const pathPoints = pathBeforeFire.map(p => `${p.x},${p.y}`).join(' L ');
      completePath = `M ${pathPoints}`;
      totalDuration = bullet.startTime;
    } else if (pathBeforeFire.length === 1) {
      completePath = `M ${pathBeforeFire[0].x},${pathBeforeFire[0].y}`;
      totalDuration = 0;
    } else {
      completePath = `M ${bullet.startX},${bullet.startY}`;
      totalDuration = 0;
    }

    completePath += ` L ${bullet.targetX},${bullet.targetY}`;
    totalDuration += bullet.duration;
  } else {
    completePath = `M ${bullet.startX},${bullet.startY} L ${bullet.targetX},${bullet.targetY}`;
    totalDuration = bullet.duration;
  }

  return `
  <line
    x1="0"
    y1="0"
    x2="${trailDx}"
    y2="${trailDy}"
    stroke="${color}"
    stroke-width="2"
    stroke-linecap="round"
    opacity="0"
  >
    <!-- Follow the same path as bullet -->
    <animateMotion
      path="${completePath}"
      dur="${totalDuration}s"
      begin="0s"
      fill="freeze"
    />

    <!-- Show trail only when shooting starts -->
    <set attributeName="opacity" to="0.6" begin="${trailStartTime}s" />

    <!-- Fade out on impact -->
    <animate
      attributeName="opacity"
      from="0.6"
      to="0"
      dur="${Math.min(0.1, bullet.duration * 0.3)}s"
      begin="${totalDuration - Math.min(0.1, bullet.duration * 0.3)}s"
      fill="freeze"
    />
  </line>`;
}

/**
 * Create SVG for all bullets
 */
export function createAllBulletsSVG(
  bullets: Bullet[],
  config: ShootingConfig,
  characterPath?: { x: number; y: number; time: number }[]
): string {
  return `
  <g class="bullets-layer">
    ${bullets.map(bullet => createBulletSVG(bullet, config, characterPath)).join('\n')}
  </g>`;
}

/**
 * Create muzzle flash effect when shooting
 */
export function createMuzzleFlashSVG(
  x: number,
  y: number,
  startTime: number,
  color: string = '#ffaa00'
): string {
  const flashDuration = 0.1; // 100ms flash

  return `
  <g class="muzzle-flash">
    <circle
      cx="${x}"
      cy="${y}"
      r="0"
      fill="${color}"
      opacity="0"
    >
      <animate
        attributeName="r"
        values="0;6;0"
        dur="${flashDuration}s"
        begin="${startTime}s"
        fill="freeze"
      />
      <animate
        attributeName="opacity"
        values="0;0.8;0"
        dur="${flashDuration}s"
        begin="${startTime}s"
        fill="freeze"
      />
    </circle>
  </g>`;
}

/**
 * Create all muzzle flashes for bullets
 */
export function createAllMuzzleFlashesSVG(
  bullets: Bullet[],
  bulletColor: string = '#ffaa00'
): string {
  return `
  <g class="muzzle-flashes-layer">
    ${bullets
      .map(bullet =>
        createMuzzleFlashSVG(bullet.startX, bullet.startY, bullet.startTime, bulletColor)
      )
      .join('\n')}
  </g>`;
}

/**
 * Calculate optimal shooting positions along a path
 * Returns positions where character should stop/slow to shoot
 */
export function calculateShootingPositions(
  path: { x: number; y: number }[],
  targets: Target[],
  shootRange: number = 300
): number[] {
  const shootingIndices: number[] = [];

  for (let i = 0; i < path.length; i++) {
    const pos = path[i];

    // Check if any unshot target is in range
    for (const target of targets) {
      if (target.hitTime !== undefined) continue; // Already hit

      const distance = calculateDistance(
        pos.x,
        pos.y,
        target.x + target.width / 2,
        target.y + target.height / 2
      );

      if (distance <= shootRange) {
        shootingIndices.push(i);
        break; // Found a target in range, mark this position
      }
    }
  }

  return shootingIndices;
}

export default {
  calculateDistance,
  calculateBulletDuration,
  generateBullets,
  createBulletSVG,
  createAllBulletsSVG,
  createMuzzleFlashSVG,
  createAllMuzzleFlashesSVG,
  calculateShootingPositions,
};
