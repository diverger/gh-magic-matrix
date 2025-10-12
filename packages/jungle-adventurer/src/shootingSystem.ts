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
 * GUN SHOOTING LOGIC: Path planning adds 'idle_shoot' action when stopping to shoot
 *
 * 1. Path planning stops 1 cell before target and adds 'idle_shoot' action
 * 2. 'idle_shoot' action has targetX/targetY indicating what to shoot
 * 3. Generate bullet trace from character position to target
 */
export function generateBullets(
  characterPath: any[], // ActionSegment[] with action, targetX, targetY properties
  targets: Target[],
  config: ShootingConfig
): Bullet[] {
  const {
    bulletSpeed = 500, // Very fast bullets (almost instant)
  } = config;

  const bullets: Bullet[] = [];
  let bulletIdCounter = 0;

  console.log(`[SHOOT] Checking ${characterPath.length} path segments for shooting actions`);

  // Find all 'idle_shoot' action segments
  const shootSegments = characterPath.filter((seg: any) => seg.action === 'idle_shoot');
  console.log(`[SHOOT] Found ${shootSegments.length} shooting actions`);

  // Create a map of target positions for hit time assignment
  const targetMap = new Map<string, Target>();
  for (const target of targets) {
    const key = `${target.x.toFixed(1)},${target.y.toFixed(1)}`;
    targetMap.set(key, target);
  }

  // Generate a bullet for each shooting action
  for (const segment of shootSegments) {
    if (!segment.targetX || !segment.targetY) {
      console.warn('[SHOOT] Shooting segment missing target coordinates:', segment);
      continue;
    }

    const characterCenterX = segment.x;
    const characterCenterY = segment.y;
    const targetCenterX = segment.targetX;
    const targetCenterY = segment.targetY;

    // Calculate direction vector from character to target
    const dx = targetCenterX - characterCenterX;
    const dy = targetCenterY - characterCenterY;
    const charToTargetDistance = Math.sqrt(dx * dx + dy * dy);

    // Normalize direction
    const dirX = dx / charToTargetDistance;
    const dirY = dy / charToTargetDistance;

    // Get character dimensions from config
    const characterWidth = config.characterWidth || 48;
    const characterHeight = config.characterHeight || 64;

    // Calculate bullet start position based on shooting direction
    let bulletStartX = characterCenterX;
    let bulletStartY = characterCenterY;

    const absX = Math.abs(dirX);
    const absY = Math.abs(dirY);

    if (absX > absY) {
      // Shooting horizontally (left or right)
      // Muzzle is at character's vertical center, offset horizontally by ~half character width
      const horizontalOffset = characterWidth / 2; // Start from edge of character
      bulletStartX = characterCenterX + (dirX > 0 ? horizontalOffset : -horizontalOffset);
      bulletStartY = characterCenterY; // Keep Y at center (where gun is)
    } else {
      // Shooting vertically (up or down)
      bulletStartX = characterCenterX; // Keep X at center
      if (dirY > 0) {
        // Shooting down - start from center, slightly below
        bulletStartY = characterCenterY + characterHeight / 3; // Not bottom edge, closer to center
      } else {
        // Shooting up - start from center, slightly above  
        bulletStartY = characterCenterY - characterHeight / 3; // Not top edge, closer to center
      }
    }

    // Calculate actual bullet travel distance (from bullet start to target)
    const bulletTravelDistance = Math.sqrt(
      (targetCenterX - bulletStartX) ** 2 +
      (targetCenterY - bulletStartY) ** 2
    );

    const duration = 0.05; // Fixed short duration for trace visual effect only

    // Find matching target
    const targetKey = `${targetCenterX.toFixed(1)},${targetCenterY.toFixed(1)}`;
    const target = targetMap.get(targetKey);

    // Check if too close (less than 1 grid cell = 14px) - don't draw trace
    const minShootDistance = 14;
    if (bulletTravelDistance < minShootDistance) {
      // Too close — don't draw bullet trace, but destroy block immediately
      if (target) {
        target.hitTime = segment.time; // Instant hit
      }
      continue; // Skip generating bullet trace
    }

    // Far enough — draw bullet trace AND destroy block immediately (same time)
    if (target) {
      target.hitTime = segment.time; // Block destroyed when shot is fired (instant hit)
    }

    // Create bullet trace from character to target
    const bullet: Bullet = {
      id: `bullet-${bulletIdCounter++}`,
      startX: bulletStartX,
      startY: bulletStartY,
      targetX: targetCenterX,
      targetY: targetCenterY,
      startTime: segment.time, // Shoot immediately when in position
      duration: duration, // Short trace effect duration
      speed: bulletSpeed,
    };

    bullets.push(bullet);
  }

  return bullets;
}

/**
 * Create SVG element for a single bullet trajectory (just a line)
 * No bullet entity, just show the shooting trace line
 */
export function createBulletSVG(
  bullet: Bullet,
  config: ShootingConfig,
  characterPath?: { x: number; y: number; time: number }[]
): string {
  const {
    bulletColor = '#ff6600', // Orange-red for bullet trace
  } = config;

  const flashDuration = 0.05; // 50ms instant flash

  const svg = `
  <line
    class="bullet-trace"
    id="${bullet.id}"
    x1="${bullet.startX}"
    y1="${bullet.startY}"
    x2="${bullet.targetX}"
    y2="${bullet.targetY}"
    stroke="${bulletColor}"
    stroke-width="2"
    stroke-linecap="round"
    opacity="0"
  >
    <!-- Instant appear at shoot time -->
    <set attributeName="opacity" to="0.9" begin="${bullet.startTime}s" />
    
    <!-- Instant disappear after brief flash -->
    <set attributeName="opacity" to="0" begin="${bullet.startTime + flashDuration}s" />
  </line>`;

  return svg;
}

/**
 * Create SVG for all bullets (just trace lines)
 */
export function createAllBulletsSVG(
  bullets: Bullet[],
  config: ShootingConfig,
  characterPath?: { x: number; y: number; time: number }[]
): string {
  const bulletSVGs = bullets.map(bullet => createBulletSVG(bullet, config, characterPath));

  return `
  <g class="bullets-layer">
    ${bulletSVGs.join('\n')}
  </g>`;
}/**
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
