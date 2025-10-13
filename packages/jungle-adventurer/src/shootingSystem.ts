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

export interface BlockTarget {
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
 * Find the LAST idle_shoot segment at the same position
 * Since pathForShooting contains the original smartSegment times for idle_shoot actions,
 * we need to find the last segment in the sequence of stationary shooting points
 */
function findShootingTimes(
  characterPath: any[],
  currentSegmentTime: number,
  shootingX: number,
  shootingY: number,
  debugKey?: string
): { firstShootTime: number; lastShootTime: number } {
  let lastShootTime = currentSegmentTime;
  let firstShootTime = currentSegmentTime;
  let count = 0;

  // Find all consecutive idle_shoot segments at the same position
  const threshold = 1.0; // Within 1px

  for (const point of characterPath) {
    if (point.action !== 'idle_shoot') continue;

    const distance = calculateDistance(point.x, point.y, shootingX, shootingY);
    if (distance < threshold) {
      if (count === 0) {
        firstShootTime = point.time;
      }
      lastShootTime = point.time;
      count++;
    }
  }

  if (debugKey) {
    const holdDuration = lastShootTime - firstShootTime;
    console.log(`[SHOOT-TIME] ${debugKey}: firstShoot=${firstShootTime.toFixed(2)}s, lastShoot=${lastShootTime.toFixed(2)}s, holdDuration=${holdDuration.toFixed(2)}s, segments=${count}, currentSegTime=${currentSegmentTime.toFixed(2)}s`);
  }

  return { firstShootTime, lastShootTime };
}

/**
 * Generate bullets to shoot at targets
 * GUN SHOOTING LOGIC: Path planning adds 'idle_shoot' action when stopping to shoot
 *
 * 1. Path planning stops 1 cell before target and adds 'idle_shoot' action
 * 2. 'idle_shoot' action has targetX/targetY indicating what to shoot
 * 3. Generate bullet trace from character to target
 */
export function generateBullets(
  characterPath: any[], // ActionSegment[] with action, targetX, targetY properties
  targets: BlockTarget[],
  config: ShootingConfig
): Bullet[] {
  const {
    bulletSpeed = 500, // Very fast bullets (almost instant)
  } = config;

  const bullets: Bullet[] = [];
  let bulletIdCounter = 0;

  // Shooting animation timing - slowed down for better visual clarity
  // Full shooting animation is 8 frames @ 12 FPS = ~0.67s
  const shootingAnimationDelay = 6 / 12; // 0.5 seconds - wait for full aiming animation
  const bulletTravelTime = 0.1; // 100ms bullet travel - more visible
  // Small safety margin to ensure smooth visual timing
  const safetyMargin = 0.1; // 100ms extra buffer

  console.log(`[SHOOT] Checking ${characterPath.length} path segments for shooting actions`);

  // Find all 'idle_shoot' action segments
  const shootSegments = characterPath.filter((seg: any) => seg.action === 'idle_shoot');
  console.log(`[SHOOT] Found ${shootSegments.length} shooting actions`);

  // Diagnostic: collect requested target keys from shoot segments and report missing ones
  const requestedKeys: string[] = [];
  for (const seg of shootSegments) {
    if (seg.targetX !== undefined && seg.targetY !== undefined) {
      requestedKeys.push(`${seg.targetX.toFixed(1)},${seg.targetY.toFixed(1)}`);
    }
  }
  const uniqueRequested = Array.from(new Set(requestedKeys));
  // We'll compare unique requested keys to existing targets when targetMap is built

  // Create a map of target positions for hit time assignment
  const targetMap = new Map<string, BlockTarget>();
  for (const target of targets) {
    const key = `${target.x.toFixed(1)},${target.y.toFixed(1)}`;
    targetMap.set(key, target);
  }  // Generate a bullet for each shooting action
  // Diagnostic: compare requested keys vs available target keys
  const availableKeys = Array.from(targetMap.keys());
  const missingRequested = uniqueRequested.filter(k => !targetMap.has(k));
  if (missingRequested.length > 0) {
    console.warn('[SHOOT] Missing requested targets:', missingRequested.slice(0, 20));
  } else {
    console.log('[SHOOT] All requested targets available:', uniqueRequested.length);
  }

  let debugCount = 0; // Only log first few for debugging

  for (const segment of shootSegments) {
    if (segment.targetX === undefined || segment.targetY === undefined) {
      console.warn('[SHOOT] Shooting segment missing target coordinates:', segment);
      continue;
    }

    const characterCenterX = segment.x;
    const characterCenterY = segment.y;
    const targetCenterX = segment.targetX;
    const targetCenterY = segment.targetY;

    if (debugCount < 5) {
      console.log(`[SHOOT] Processing shoot segment:`, {
        segmentTime: segment.time?.toFixed(2),
        segmentPos: `(${characterCenterX?.toFixed(1)}, ${characterCenterY?.toFixed(1)})`,
        targetPos: `(${targetCenterX?.toFixed(1)}, ${targetCenterY?.toFixed(1)})`
      });
    }

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
    if (!target) {
      // Log debugging info for missing targets so we can trace 999s
      console.warn('[SHOOT] No matching target found for shooting segment:', {
        targetKey,
        targetCenterX: targetCenterX.toFixed(3),
        targetCenterY: targetCenterY.toFixed(3),
        characterCenterX: characterCenterX.toFixed(3),
        characterCenterY: characterCenterY.toFixed(3),
        dx: dx.toFixed(3),
        dy: dy.toFixed(3),
      });
    }

    // Find when character starts and finishes the shooting hold period
    // pathForShooting contains the original smartSegment times for idle_shoot
    const debugKey = debugCount < 5 ? targetKey : undefined;
    const { firstShootTime, lastShootTime } = findShootingTimes(characterPath, segment.time, characterCenterX, characterCenterY, debugKey);

    // === TIMING: Block destroys when muzzle flash appears (frame 3 of 8) ===
    // Shooting animation: 8 frames @ 12 FPS = 0.67s total
    // Muzzle flash typically appears in frame 2-3 (earlier in the animation)
    // Frame 3 timing: 3 frames ÷ 12 FPS = 0.25s
    const SHOOTING_FRAMES = 8;
    const FPS = 12;
    const MUZZLE_FLASH_FRAME = 3; // Earlier in the 8-frame animation
    const MUZZLE_FLASH_DELAY = MUZZLE_FLASH_FRAME / FPS; // 0.25s
    debugCount++;

    // Check if too close (less than 1 grid cell = 14px) - don't draw trace
    const minShootDistance = 14;
    if (bulletTravelDistance < minShootDistance) {
      // Too close — destroy at muzzle flash moment
      if (target) {
        const proposed = firstShootTime + MUZZLE_FLASH_DELAY;
        if (target.hitTime === undefined || proposed > target.hitTime) {
          if (debugKey) {
            console.log('[SHOOT] Close-target hitTime', {
              targetKey,
              proposed: proposed.toFixed(2),
              segmentTime: segment.time.toFixed(2),
              firstShoot: firstShootTime.toFixed(2),
              lastShoot: lastShootTime.toFixed(2),
              muzzleFlashDelay: MUZZLE_FLASH_DELAY,
              totalDelay: (proposed - firstShootTime).toFixed(2)
            });
          }
          target.hitTime = proposed;
        }
      }
      continue; // Skip generating bullet trace
    }

    // Far enough — add bullet travel time
    // For far targets: muzzle flash + bullet travel time
    const visualBasedHitTime = firstShootTime + MUZZLE_FLASH_DELAY + bulletTravelTime;

    if (target) {
      const proposed = visualBasedHitTime;
      if (target.hitTime === undefined || proposed > target.hitTime) {
        if (debugKey) {
          console.log('[SHOOT] Far-target hitTime', {
            targetKey,
            proposed: proposed.toFixed(2),
            segmentTime: segment.time.toFixed(2),
            firstShoot: firstShootTime.toFixed(2),
            lastShoot: lastShootTime.toFixed(2),
            muzzleFlashDelay: MUZZLE_FLASH_DELAY,
            bulletTravel: bulletTravelTime,
            totalDelay: (proposed - firstShootTime).toFixed(2)
          });
        }
        target.hitTime = proposed;
      }
    }    // Create bullet trace from character to target
    const bullet: Bullet = {
      id: `bullet-${bulletIdCounter++}`,
      startX: bulletStartX,
      startY: bulletStartY,
      targetX: targetCenterX,
      targetY: targetCenterY,
      startTime: segment.time + shootingAnimationDelay, // Fire after animation delay
      duration: bulletTravelTime, // Short trace effect duration
      speed: bulletSpeed,
    };

    bullets.push(bullet);
  }

  // Diagnostic: how many targets received a hitTime
  const assigned = targets.filter(t => t.hitTime !== undefined).length;
  console.log(`[SHOOT] Generated bullets=${bullets.length}, targetsAssignedHitTime=${assigned}/${targets.length}`);
  if (assigned !== uniqueRequested.length) {
    // List a few targets that were requested but didn't get assigned
    const notAssigned: string[] = [];
    for (const k of uniqueRequested) {
      if (!targetMap.get(k) || targetMap.get(k)!.hitTime === undefined) {
        notAssigned.push(k);
        if (notAssigned.length >= 10) break;
      }
    }
    if (notAssigned.length > 0) console.warn('[SHOOT] Requested but not assigned examples:', notAssigned.slice(0, 10));
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
  targets: BlockTarget[],
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
