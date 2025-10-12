/**
 * Sprite Animation System
 * Handles 8-frame sprite sheets with automatic layout detection
 */

export interface SpriteSheetConfig {
  /** Base64 encoded PNG data or data URL */
  imageData: string;
  /** Frame width in pixels */
  frameWidth: number;
  /** Frame height in pixels */
  frameHeight: number;
  /** Number of frames */
  frameCount: number;
  /** Layout direction */
  layout: 'horizontal' | 'vertical';
}

export interface SpriteAnimation {
  /** Animation name (run, walk, shoot, etc.) */
  name: string;
  /** Sprite sheet configuration */
  spriteSheet: SpriteSheetConfig;
  /** Frame duration in seconds */
  frameDuration: number;
  /** Whether to loop the animation */
  loop: boolean;
}

/**
 * Animation types supported - 8 directions
 */
export type AnimationType =
  | 'run-right'
  | 'run-left'
  | 'run-up'
  | 'run-down'
  | 'run-right-up'
  | 'run-right-down'
  | 'run-left-up'
  | 'run-left-down'
  | 'shoot-right'
  | 'shoot-left'
  | 'shoot-up'
  | 'shoot-down'
  | 'shoot-right-up'
  | 'shoot-right-down'
  | 'shoot-left-up'
  | 'shoot-left-down'
  | 'reload-right'
  | 'reload-left'
  | 'reload-up'
  | 'reload-down'
  | 'reload-right-up'
  | 'reload-right-down'
  | 'reload-left-up'
  | 'reload-left-down'
  | 'idle';

/**
 * Direction enum for 8-directional movement
 */
export enum Direction8 {
  Right = 'right',
  Left = 'left',
  Up = 'up',
  Down = 'down',
  RightUp = 'right-up',
  RightDown = 'right-down',
  LeftUp = 'left-up',
  LeftDown = 'left-down',
}

/**
 * Character state with current animation
 */
export interface CharacterState {
  x: number;
  y: number;
  animation: AnimationType;
  frameIndex: number;
  direction: Direction8;
}

export interface CharacterPosition {
  x: number;
  y: number;
  /** Frame index (0-7) */
  frame: number;
  /** Current animation */
  animation: string;
}

/**
 * Detect sprite sheet layout based on image dimensions
 */
export function detectSpriteLayout(
  width: number,
  height: number,
  frameWidth: number,
  frameHeight: number,
  frameCount: number = 8
): 'horizontal' | 'vertical' {
  const horizontalExpectedWidth = frameWidth * frameCount;
  const verticalExpectedHeight = frameHeight * frameCount;

  // Check if dimensions match horizontal layout
  if (width === horizontalExpectedWidth && height === frameHeight) {
    return 'horizontal';
  }

  // Check if dimensions match vertical layout
  if (width === frameWidth && height === verticalExpectedHeight) {
    return 'vertical';
  }

  // Fallback: determine by aspect ratio
  const aspectRatio = width / height;
  return aspectRatio > 1 ? 'horizontal' : 'vertical';
}

/**
 * Create sprite sheet configuration from image data
 */
export function createSpriteSheet(
  imageData: string,
  frameWidth: number = 48,
  frameHeight: number = 64,
  frameCount: number = 8,
  layout?: 'horizontal' | 'vertical'
): SpriteSheetConfig {
  // If layout not specified, we'll need to detect it
  // For now, default to horizontal
  const detectedLayout = layout || 'horizontal';

  return {
    imageData,
    frameWidth,
    frameHeight,
    frameCount,
    layout: detectedLayout,
  };
}

/**
 * Generate SVG clip path for a specific sprite frame
 * This allows showing only one frame at a time from the sprite sheet
 */
export function generateSpriteClipPath(
  frameIndex: number,
  spriteSheet: SpriteSheetConfig,
  id: string
): string {
  const { frameWidth, frameHeight, layout } = spriteSheet;

  let x = 0;
  let y = 0;

  if (layout === 'horizontal') {
    x = frameIndex * frameWidth;
    y = 0;
  } else {
    x = 0;
    y = frameIndex * frameHeight;
  }

  return `
  <clipPath id="${id}">
    <rect x="${x}" y="${y}" width="${frameWidth}" height="${frameHeight}" />
  </clipPath>`;
}

/**
 * Generate SVG definition for all sprite clip paths (frames 0-7)
 */
export function generateAllSpriteClipPaths(
  spriteSheet: SpriteSheetConfig,
  baseId: string
): string {
  const clipPaths: string[] = [];

  for (let i = 0; i < spriteSheet.frameCount; i++) {
    clipPaths.push(
      generateSpriteClipPath(i, spriteSheet, `${baseId}-frame-${i}`)
    );
  }

  return clipPaths.join('\n');
}

/**
 * Generate CSS animation keyframes for sprite frame cycling
 */
export function generateSpriteAnimationCSS(
  animationName: string,
  spriteSheet: SpriteSheetConfig,
  fps: number = 12
): string {
  const { frameCount, frameWidth, frameHeight, layout } = spriteSheet;
  const frameDuration = 1 / fps;
  const totalDuration = frameCount * frameDuration;

  // Generate keyframes for each frame
  const keyframes: string[] = [];

  for (let i = 0; i < frameCount; i++) {
    const percent = (i / frameCount) * 100;
    let transform = '';

    if (layout === 'horizontal') {
      const offsetX = -(i * frameWidth);
      transform = `translateX(${offsetX}px)`;
    } else {
      const offsetY = -(i * frameHeight);
      transform = `translateY(${offsetY}px)`;
    }

    keyframes.push(`  ${percent.toFixed(2)}% { transform: ${transform}; }`);
  }

  // Add final keyframe to loop smoothly
  if (layout === 'horizontal') {
    keyframes.push(`  100% { transform: translateX(0px); }`);
  } else {
    keyframes.push(`  100% { transform: translateY(0px); }`);
  }

  return `
@keyframes ${animationName} {
${keyframes.join('\n')}
}`;
}

/**
 * Create SVG element for animated sprite
 * Uses CSS transforms to cycle through frames
 */
export function createAnimatedSpriteElement(
  spriteSheet: SpriteSheetConfig,
  position: { x: number; y: number },
  scale: number = 1.0,
  animationName: string,
  fps: number = 12
): string {
  const { frameWidth, frameHeight, imageData, frameCount } = spriteSheet;
  const totalDuration = frameCount / fps;

  const displayWidth = frameWidth * scale;
  const displayHeight = frameHeight * scale;

  return `
  <g class="sprite-character" transform="translate(${position.x}, ${position.y})">
    <g class="sprite-wrapper" style="
      width: ${displayWidth}px;
      height: ${displayHeight}px;
      overflow: hidden;
    ">
      <image
        href="${imageData}"
        width="${frameWidth * frameCount}"
        height="${frameHeight}"
        style="
          animation: ${animationName} ${totalDuration}s steps(${frameCount}) infinite;
          transform-origin: 0 0;
        "
      />
    </g>
  </g>`;
}

/**
 * Alternative: Use viewBox animation instead of CSS transforms
 * This is more compatible with static SVG viewers
 */
export function createSpriteWithViewBoxAnimation(
  spriteSheet: SpriteSheetConfig,
  position: { x: number; y: number },
  scale: number = 1.0,
  animationId: string,
  fps: number = 12
): string {
  const { frameWidth, frameHeight, imageData, frameCount, layout } = spriteSheet;
  const frameDuration = 1 / fps;
  const totalDuration = frameCount * frameDuration;

  const displayWidth = frameWidth * scale;
  const displayHeight = frameHeight * scale;

  // Generate viewBox values for each frame
  const viewBoxValues: string[] = [];
  for (let i = 0; i < frameCount; i++) {
    if (layout === 'horizontal') {
      const x = i * frameWidth;
      viewBoxValues.push(`${x} 0 ${frameWidth} ${frameHeight}`);
    } else {
      const y = i * frameHeight;
      viewBoxValues.push(`0 ${y} ${frameWidth} ${frameHeight}`);
    }
  }

  // Add first frame again for smooth loop
  viewBoxValues.push(viewBoxValues[0]);

  const keyTimes = Array.from(
    { length: frameCount + 1 },
    (_, i) => (i / frameCount).toFixed(3)
  ).join(';');

  return `
  <svg
    class="sprite-character"
    x="${position.x}"
    y="${position.y}"
    width="${displayWidth}"
    height="${displayHeight}"
    viewBox="${viewBoxValues[0]}"
  >
    <animate
      attributeName="viewBox"
      values="${viewBoxValues.join(';')}"
      keyTimes="${keyTimes}"
      dur="${totalDuration}s"
      repeatCount="indefinite"
      calcMode="discrete"
    />
    <image href="${imageData}" width="100%" height="100%" />
  </svg>`;
}

/**
 * Determine sprite flip direction based on movement
 */
function shouldFlipSprite(fromX: number, toX: number): boolean {
  return toX < fromX; // Flip when moving left
}

/**
 * Determine animation direction based on movement vector
 */
export function determineDirection(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): Direction8 {
  const deltaX = toX - fromX;
  const deltaY = toY - fromY;

  // Calculate angle (-180 to 180 degrees)
  const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

  // Map angle to 8 directions
  // Right: -22.5 to 22.5
  // RightDown: 22.5 to 67.5
  // Down: 67.5 to 112.5
  // LeftDown: 112.5 to 157.5
  // Left: 157.5 to -157.5
  // LeftUp: -157.5 to -112.5
  // Up: -112.5 to -67.5
  // RightUp: -67.5 to -22.5

  let result: Direction8;
  if (angle >= -22.5 && angle < 22.5) {
    result = Direction8.Right;
  } else if (angle >= 22.5 && angle < 67.5) {
    result = Direction8.RightDown;
  } else if (angle >= 67.5 && angle < 112.5) {
    result = Direction8.Down;
  } else if (angle >= 112.5 && angle < 157.5) {
    result = Direction8.LeftDown;
  } else if (angle >= 157.5 || angle < -157.5) {
    result = Direction8.Left;
  } else if (angle >= -157.5 && angle < -112.5) {
    result = Direction8.LeftUp;
  } else if (angle >= -112.5 && angle < -67.5) {
    result = Direction8.Up;
  } else {
    result = Direction8.RightUp;
  }

  // Log for pure vertical/horizontal shooting
  if (Math.abs(deltaX) < 0.1 || Math.abs(deltaY) < 0.1) {
    console.log(`[DIR] dx=${deltaX.toFixed(1)}, dy=${deltaY.toFixed(1)}, angle=${angle.toFixed(1)}° => ${result}`);
  }

  return result;
}

/**
 * Get sprite key for given direction and action
 */
export function getSpriteKey(
  direction: Direction8,
  action: 'run' | 'shoot' | 'reload' = 'run'
): keyof MultiDirectionalSprites {
  const directionMap: Record<Direction8, string> = {
    [Direction8.Right]: 'Right',
    [Direction8.Left]: 'Left',
    [Direction8.Up]: 'Up',
    [Direction8.Down]: 'Down',
    [Direction8.RightUp]: 'RightUp',
    [Direction8.RightDown]: 'RightDown',
    [Direction8.LeftUp]: 'LeftUp',
    [Direction8.LeftDown]: 'LeftDown',
  };

  const actionPrefix = action === 'run' ? 'run' : action === 'shoot' ? 'shoot' : 'reload';
  return `${actionPrefix}${directionMap[direction]}` as keyof MultiDirectionalSprites;
}

/**
 * Determine animation type based on movement direction and action
 */
export function determineAnimationType(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  isShooting: boolean = false
): AnimationType {
  const direction = determineDirection(fromX, fromY, toX, toY);
  const action = isShooting ? 'shoot' : 'run';

  const animationMap: Record<string, AnimationType> = {
    'run-right': 'run-right',
    'run-left': 'run-left',
    'run-up': 'run-up',
    'run-down': 'run-down',
    'run-right-up': 'run-right-up',
    'run-right-down': 'run-right-down',
    'run-left-up': 'run-left-up',
    'run-left-down': 'run-left-down',
    'shoot-right': 'shoot-right',
    'shoot-left': 'shoot-left',
    'shoot-up': 'shoot-up',
    'shoot-down': 'shoot-down',
    'shoot-right-up': 'shoot-right-up',
    'shoot-right-down': 'shoot-right-down',
    'shoot-left-up': 'shoot-left-up',
    'shoot-left-down': 'shoot-left-down',
  };

  return animationMap[`${action}-${direction}`] || 'run-right';
}

/**
 * Determine rotation for vertical movement sprite
 * NOTE: Not used anymore since we have 8-directional sprites
 */
export function getVerticalSpriteRotation(fromY: number, toY: number): number {
  return toY > fromY ? 180 : 0;
}

/**
 * Advanced sprite animation with 8-directional support
 * Each direction has its own sprite sheet (no mirroring!)
 */
export interface MultiDirectionalSprites {
  // Run with gun - 8 directions
  runRight?: SpriteSheetConfig;
  runLeft?: SpriteSheetConfig;
  runUp?: SpriteSheetConfig;
  runDown?: SpriteSheetConfig;
  runRightUp?: SpriteSheetConfig;
  runRightDown?: SpriteSheetConfig;
  runLeftUp?: SpriteSheetConfig;
  runLeftDown?: SpriteSheetConfig;

  // Shooting - 8 directions
  shootRight?: SpriteSheetConfig;
  shootLeft?: SpriteSheetConfig;
  shootUp?: SpriteSheetConfig;
  shootDown?: SpriteSheetConfig;
  shootRightUp?: SpriteSheetConfig;
  shootRightDown?: SpriteSheetConfig;
  shootLeftUp?: SpriteSheetConfig;
  shootLeftDown?: SpriteSheetConfig;

  // Reload while walking - 8 directions
  reloadRight?: SpriteSheetConfig;
  reloadLeft?: SpriteSheetConfig;
  reloadUp?: SpriteSheetConfig;
  reloadDown?: SpriteSheetConfig;
  reloadRightUp?: SpriteSheetConfig;
  reloadRightDown?: SpriteSheetConfig;
  reloadLeftUp?: SpriteSheetConfig;
  reloadLeftDown?: SpriteSheetConfig;
}

/**
 * Create moving sprite with position animation and auto-flip
 */
export function createMovingSpriteElement(
  spriteSheet: SpriteSheetConfig,
  pathPoints: { x: number; y: number; duration: number }[],
  scale: number = 1.0,
  animationId: string,
  fps: number = 12,
  autoFlip: boolean = true  // Auto-flip when moving left
): string {
  const { frameWidth, frameHeight, imageData, frameCount, layout } = spriteSheet;
  const frameDuration = 1 / fps;
  const spriteAnimDuration = frameCount * frameDuration;

  const displayWidth = frameWidth * scale;
  const displayHeight = frameHeight * scale;

  // Calculate full sprite sheet dimensions
  const fullWidth = layout === 'horizontal' ? frameWidth * frameCount : frameWidth;
  const fullHeight = layout === 'vertical' ? frameHeight * frameCount : frameHeight;

  // Determine flip state for each segment
  const flipStates: boolean[] = [];
  for (let i = 0; i < pathPoints.length - 1; i++) {
    const flip = autoFlip && shouldFlipSprite(pathPoints[i].x, pathPoints[i + 1].x);
    flipStates.push(flip);
  }
  flipStates.push(flipStates[flipStates.length - 1] || false); // Last point same as previous

  // Calculate total path duration
  const totalDuration = pathPoints.reduce((sum, p) => sum + p.duration, 0);

  // Generate viewBox animation for sprite frames
  const viewBoxValues: string[] = [];
  for (let i = 0; i < frameCount; i++) {
    if (layout === 'horizontal') {
      const x = i * frameWidth;
      viewBoxValues.push(`${x} 0 ${frameWidth} ${frameHeight}`);
    } else {
      const y = i * frameHeight;
      viewBoxValues.push(`0 ${y} ${frameWidth} ${frameHeight}`);
    }
  }
  viewBoxValues.push(viewBoxValues[0]); // Loop back to first frame

  const frameKeyTimes = Array.from(
    { length: frameCount + 1 },
    (_, i) => (i / frameCount).toFixed(3)
  ).join(';');

  // Generate position animation values
  const positionValues = pathPoints.map(p => `${p.x},${p.y}`).join(';');

  // Generate keyTimes for position animation
  let accumulatedTime = 0;
  const positionKeyTimes = [
    '0',
    ...pathPoints.map(p => {
      accumulatedTime += p.duration;
      return (accumulatedTime / totalDuration).toFixed(3);
    })
  ].join(';');

  // Generate flip animation if needed
  let flipAnimation = '';
  if (autoFlip && flipStates.some(f => f)) {
    // Create discrete flip animation based on path segments
    const flipValues = flipStates.map(flip => flip ? '-1 1' : '1 1').join(';');
    flipAnimation = `
    <animateTransform
      attributeName="transform"
      type="scale"
      values="${flipValues}"
      keyTimes="${positionKeyTimes}"
      dur="${totalDuration}s"
      calcMode="discrete"
      additive="sum"
    />`;
  }

  return `
  <g class="sprite-character-moving">
    <!-- Position animation - applies to the group -->
    <animateMotion
      path="${generateSVGPath(pathPoints)}"
      dur="${totalDuration}s"
      fill="freeze"
    />

    <svg
      width="${displayWidth}"
      height="${displayHeight}"
      viewBox="${viewBoxValues[0]}"
      x="${-displayWidth / 2}"
      y="${-displayHeight / 2}"
    >
      <!-- Sprite frame animation -->
      <animate
        attributeName="viewBox"
        values="${viewBoxValues.join(';')}"
        keyTimes="${frameKeyTimes}"
        dur="${spriteAnimDuration}s"
        repeatCount="indefinite"
        calcMode="discrete"
      />

      ${flipAnimation}

      <!-- CRITICAL: Use actual pixel dimensions, not 100%! -->
      <image href="${imageData}" width="${fullWidth}" height="${fullHeight}" />
    </svg>
  </g>`;
}

/**
 * Generate SVG path from points
 */
function generateSVGPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';

  const pathParts = [`M ${points[0].x} ${points[0].y}`];

  for (let i = 1; i < points.length; i++) {
    pathParts.push(`L ${points[i].x} ${points[i].y}`);
  }

  return pathParts.join(' ');
}

/**
 * Create advanced multi-directional sprite animation
 * Automatically switches between sprites based on movement direction
 */
export function createMultiDirectionalSpriteElement(
  sprites: MultiDirectionalSprites,
  pathPoints: { x: number; y: number; duration: number; isShooting?: boolean; targetX?: number; targetY?: number }[],
  scale: number = 1.0,
  animationId: string,
  fps: number = 12
): string {
  // Calculate total animation duration
  const totalDuration = pathPoints.reduce((sum, p) => sum + p.duration, 0);

  // Build sprite segments with timing information
  interface SpriteSegment {
    startTime: number;
    endTime: number;
    spriteKey: keyof MultiDirectionalSprites;
    direction: Direction8;
  }

  const segments: SpriteSegment[] = [];
  let currentTime = 0;

  for (let i = 0; i < pathPoints.length - 1; i++) {
    const from = pathPoints[i];
    const to = pathPoints[i + 1];
    const duration = to.duration;

    // Determine direction based on shooting target or movement
    let direction: Direction8;
    const isShooting = from.isShooting || to.isShooting || false;

    if (isShooting && from.targetX !== undefined && from.targetY !== undefined) {
      // When shooting, face the TARGET, not the movement direction
      direction = determineDirection(from.x, from.y, from.targetX, from.targetY);
    } else {
      // When running, use movement direction
      direction = determineDirection(from.x, from.y, to.x, to.y);
    }

    const action = isShooting ? 'shoot' : 'run';
    const spriteKey = getSpriteKey(direction, action);

    segments.push({
      startTime: currentTime,
      endTime: currentTime + duration,
      spriteKey,
      direction,
    });

    currentTime += duration;
  }

  // Collect unique sprites used in the animation
  const uniqueSpriteKeys = Array.from(new Set(segments.map(s => s.spriteKey)));

  console.log(`🎮 Multi-Directional Sprite Animation:`);
  console.log(`  Total segments: ${segments.length}`);
  console.log(`  Unique sprites: ${uniqueSpriteKeys.join(', ')}`);
  console.log(`  Segment breakdown:`, segments.map(s =>
    `${s.direction} (${s.startTime.toFixed(2)}s-${s.endTime.toFixed(2)}s)`
  ).join(', '));

  // Create animation with sprite switching
  return createSegmentedMultiSpriteElement(
    sprites,
    segments,
    pathPoints,
    totalDuration,
    scale,
    animationId,
    fps
  );
}

/**
 * Create sprite animation that switches between different sprites for each path segment
 */
function createSegmentedMultiSpriteElement(
  sprites: MultiDirectionalSprites,
  segments: { startTime: number; endTime: number; spriteKey: keyof MultiDirectionalSprites }[],
  pathPoints: { x: number; y: number; duration: number }[],
  totalDuration: number,
  scale: number,
  animationId: string,
  fps: number
): string {
  // Use SMIL animation with <set> elements to switch sprites at specific times
  // Create one <image> per unique sprite, show/hide based on timing

  const uniqueSpriteKeys = Array.from(new Set(segments.map(s => s.spriteKey)));

  // For each unique sprite, create visibility timeline
  const spriteVisibilityMap = new Map<string, { startTime: number; endTime: number }[]>();

  for (const segment of segments) {
    const key = segment.spriteKey;
    if (!spriteVisibilityMap.has(key)) {
      spriteVisibilityMap.set(key, []);
    }
    spriteVisibilityMap.get(key)!.push({
      startTime: segment.startTime,
      endTime: segment.endTime,
    });
  }

  // Calculate sprite dimensions
  const firstSprite = sprites[uniqueSpriteKeys[0]];
  if (!firstSprite) {
    throw new Error('No sprite sheets provided');
  }

  const layout = firstSprite.layout || 'horizontal';
  const frameWidth = firstSprite.frameWidth || 64;
  const frameHeight = firstSprite.frameHeight || 64;
  const frameCount = firstSprite.frameCount || 6;

  const fullWidth = layout === 'horizontal' ? frameWidth * frameCount : frameWidth;
  const fullHeight = layout === 'vertical' ? frameHeight * frameCount : frameHeight;
  const displayWidth = frameWidth * scale;
  const displayHeight = frameHeight * scale;

  const spriteAnimDuration = frameCount / fps;

  // Generate viewBox animation values for frame cycling
  const viewBoxValues: string[] = [];
  for (let i = 0; i < frameCount; i++) {
    if (layout === 'horizontal') {
      const x = i * frameWidth;
      viewBoxValues.push(`${x} 0 ${frameWidth} ${frameHeight}`);
    } else {
      const y = i * frameHeight;
      viewBoxValues.push(`0 ${y} ${frameWidth} ${frameHeight}`);
    }
  }
  viewBoxValues.push(viewBoxValues[0]);

  const frameKeyTimes = Array.from(
    { length: frameCount + 1 },
    (_, i) => (i / frameCount).toFixed(3)
  ).join(';');

  // Generate position animation path
  const positionPath = generateSVGPath(pathPoints);

  // Build sprite layers with visibility animations
  const spriteLayers = uniqueSpriteKeys.map((spriteKey, index) => {
    const sprite = sprites[spriteKey];
    if (!sprite) return '';

    const visibilityRanges = spriteVisibilityMap.get(spriteKey) || [];

    // Create visibility animation using <set> elements
    // Start hidden, then show/hide at specific times
    const visibilityAnimations = visibilityRanges.flatMap((range, rangeIndex) => {
      const beginTime = range.startTime.toFixed(3);
      const endTime = range.endTime.toFixed(3);

      return [
        // Show at start time
        `<set attributeName="visibility" to="visible" begin="${beginTime}s" />`,
        // Hide at end time
        `<set attributeName="visibility" to="hidden" begin="${endTime}s" />`,
      ];
    }).join('\n      ');

    const isFirstSprite = index === 0;
    const initialVisibility = isFirstSprite ? 'visible' : 'hidden';

    return `
    <svg
      width="${displayWidth}"
      height="${displayHeight}"
      viewBox="${viewBoxValues[0]}"
      x="${-displayWidth / 2}"
      y="${-displayHeight / 2}"
      visibility="${initialVisibility}"
      class="sprite-layer-${spriteKey}"
    >
      <!-- Frame animation -->
      <animate
        attributeName="viewBox"
        values="${viewBoxValues.join(';')}"
        keyTimes="${frameKeyTimes}"
        dur="${spriteAnimDuration}s"
        repeatCount="indefinite"
        calcMode="discrete"
      />

      <!-- Visibility switching -->
      ${visibilityAnimations}

      <image href="${sprite.imageData}" width="${fullWidth}" height="${fullHeight}" />
    </svg>`;
  }).join('');

  return `
  <g class="sprite-character-multidirectional" id="${animationId}">
    <!-- Position animation -->
    <animateMotion
      path="${positionPath}"
      dur="${totalDuration}s"
      fill="freeze"
    />

    <!-- Multiple sprite layers that switch visibility -->
    ${spriteLayers}
  </g>`;
}


/**
 * Utility: Convert file path to base64 data URL
 * Note: This is a placeholder - actual implementation will use Node.js fs
 */
export async function loadSpriteSheetFromFile(
  filePath: string
): Promise<string> {
  // This will be implemented in the action.ts file
  // Returns: "data:image/png;base64,iVBORw0KGg..."
  throw new Error('loadSpriteSheetFromFile must be implemented in action.ts');
}

export default {
  detectSpriteLayout,
  createSpriteSheet,
  generateSpriteAnimationCSS,
  createAnimatedSpriteElement,
  createSpriteWithViewBoxAnimation,
  createMovingSpriteElement,
};
