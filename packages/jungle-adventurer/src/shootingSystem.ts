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

    // Check if enough time has passed to fire again
    if (currentTime - lastFireTime >= fireInterval) {
      // Find nearest unshot target within range
      let nearestTarget: Target | null = null;
      let nearestDistance = Infinity;
      const shootRange = 300; // Max shooting range in pixels

      for (const target of remainingTargets) {
        const distance = calculateDistance(
          currentPos.x,
          currentPos.y,
          target.x,
          target.y
        );

        if (distance <= shootRange && distance < nearestDistance) {
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

        // Calculate gun muzzle offset based on shooting direction
        // Assume character is 48x64, gun muzzle is at front edge of character
        const muzzleDistance = 20; // Distance from center to muzzle
        const muzzleOffsetX = Math.cos(angle) * muzzleDistance;
        const muzzleOffsetY = Math.sin(angle) * muzzleDistance;

        const bulletStartX = currentPos.x + muzzleOffsetX;
        const bulletStartY = currentPos.y + muzzleOffsetY;
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
 */
export function createBulletSVG(
  bullet: Bullet,
  config: ShootingConfig
): string {
  const {
    bulletWidth = 2,
    bulletHeight = 4,
    bulletColor = '#ffff00',
    hasTrail = true,
  } = config;

  const path = `M ${bullet.startX},${bullet.startY} L ${bullet.targetX},${bullet.targetY}`;

  return `
  <g class="bullet" id="${bullet.id}">
    ${hasTrail ? createBulletTrail(bullet, bulletColor) : ''}
    <rect
      width="${bulletWidth}"
      height="${bulletHeight}"
      fill="${bulletColor}"
      rx="1"
    >
      <!-- Position animation along path -->
      <animateMotion
        path="${path}"
        dur="${bullet.duration}s"
        begin="${bullet.startTime}s"
        fill="freeze"
      />

      <!-- Fade out on impact -->
      <animate
        attributeName="opacity"
        values="1;1;0"
        keyTimes="0;0.9;1"
        dur="${bullet.duration}s"
        begin="${bullet.startTime}s"
        fill="freeze"
      />
    </rect>
  </g>`;
}

/**
 * Create bullet trail effect
 */
function createBulletTrail(bullet: Bullet, color: string): string {
  // Trail is a line that follows the bullet
  return `
  <line
    x1="${bullet.startX}"
    y1="${bullet.startY}"
    x2="${bullet.startX}"
    y2="${bullet.startY}"
    stroke="${color}"
    stroke-width="1"
    opacity="0.5"
  >
    <animate
      attributeName="x2"
      values="${bullet.startX};${bullet.targetX}"
      dur="${bullet.duration}s"
      begin="${bullet.startTime}s"
      fill="freeze"
    />
    <animate
      attributeName="y2"
      values="${bullet.startY};${bullet.targetY}"
      dur="${bullet.duration}s"
      begin="${bullet.startTime}s"
      fill="freeze"
    />
    <animate
      attributeName="opacity"
      values="0.5;0.5;0"
      keyTimes="0;0.9;1"
      dur="${bullet.duration}s"
      begin="${bullet.startTime}s"
      fill="freeze"
    />
  </line>`;
}

/**
 * Create SVG for all bullets
 */
export function createAllBulletsSVG(
  bullets: Bullet[],
  config: ShootingConfig
): string {
  return `
  <g class="bullets-layer">
    ${bullets.map(bullet => createBulletSVG(bullet, config)).join('\n')}
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
