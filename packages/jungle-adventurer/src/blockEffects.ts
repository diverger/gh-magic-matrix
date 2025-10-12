/**
 * Block Effects System
 * Handles visual effects when blocks are destroyed
 */

export interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  level: number; // Contribution level (0-4)
}

export interface BlockDestroyEffect {
  block: Block;
  hitTime: number; // When the block gets hit
  effectType: 'explode' | 'fade' | 'shatter' | 'dissolve';
  duration: number; // Effect duration
}

/**
 * Create fade-out effect for a block
 */
export function createFadeOutEffect(
  block: Block,
  hitTime: number,
  duration: number = 0.3
): string {
  return `
  <rect
    x="${block.x}"
    y="${block.y}"
    width="${block.width}"
    height="${block.height}"
    fill="${block.color}"
    rx="2"
  >
    <!-- Fade out when hit -->
    <animate
      attributeName="opacity"
      values="1;1;0"
      keyTimes="0;${(hitTime / (hitTime + duration)).toFixed(3)};1"
      dur="${hitTime + duration}s"
      fill="freeze"
    />
  </rect>`;
}

/**
 * Create explosion effect for a block
 */
export function createExplosionEffect(
  block: Block,
  hitTime: number,
  duration: number = 0.4
): string {
  const centerX = block.x + block.width / 2;
  const centerY = block.y + block.height / 2;
  const explosionDelay = hitTime;

  // Create multiple explosion particles
  const particleCount = 8;
  const particles: string[] = [];

  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2;
    const distance = block.width * 1.5;
    const endX = centerX + Math.cos(angle) * distance;
    const endY = centerY + Math.sin(angle) * distance;

    particles.push(`
    <circle
      cx="${centerX}"
      cy="${centerY}"
      r="2"
      fill="${block.color}"
      opacity="0"
    >
      <!-- Move outward -->
      <animate
        attributeName="cx"
        values="${centerX};${endX}"
        dur="${duration}s"
        begin="${explosionDelay}s"
        fill="freeze"
      />
      <animate
        attributeName="cy"
        values="${centerY};${endY}"
        dur="${duration}s"
        begin="${explosionDelay}s"
        fill="freeze"
      />
      <!-- Fade in then out -->
      <animate
        attributeName="opacity"
        values="0;1;0"
        keyTimes="0;0.3;1"
        dur="${duration}s"
        begin="${explosionDelay}s"
        fill="freeze"
      />
      <!-- Shrink -->
      <animate
        attributeName="r"
        values="2;1;0"
        dur="${duration}s"
        begin="${explosionDelay}s"
        fill="freeze"
      />
    </circle>`);
  }

  return `
  <g class="explosion-effect">
    <!-- Block expands and fades -->
    <rect
      x="${block.x}"
      y="${block.y}"
      width="${block.width}"
      height="${block.height}"
      fill="${block.color}"
      rx="2"
    >
      <!-- Scale up -->
      <animateTransform
        attributeName="transform"
        type="scale"
        values="1;1.5;0"
        keyTimes="0;${(hitTime / (hitTime + duration)).toFixed(3)};1"
        dur="${hitTime + duration}s"
        additive="sum"
        fill="freeze"
      />
      <!-- Fade out -->
      <animate
        attributeName="opacity"
        values="1;1;0.5;0"
        keyTimes="0;${(hitTime / (hitTime + duration)).toFixed(3)};${((hitTime + duration * 0.5) / (hitTime + duration)).toFixed(3)};1"
        dur="${hitTime + duration}s"
        fill="freeze"
      />
    </rect>

    <!-- Explosion particles -->
    ${particles.join('\n')}
  </g>`;
}

/**
 * Create shatter effect for a block (breaks into pieces)
 */
export function createShatterEffect(
  block: Block,
  hitTime: number,
  duration: number = 0.5
): string {
  const pieces = 4; // 2x2 grid of pieces
  const pieceWidth = block.width / 2;
  const pieceHeight = block.height / 2;
  const shards: string[] = [];

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      const pieceX = block.x + col * pieceWidth;
      const pieceY = block.y + row * pieceHeight;

      // Each piece flies in a different direction
      const angle = Math.atan2(row - 0.5, col - 0.5);
      const distance = block.width * 2;
      const endX = pieceX + Math.cos(angle) * distance;
      const endY = pieceY + Math.sin(angle) * distance + block.height; // Add gravity effect

      shards.push(`
      <rect
        x="${pieceX}"
        y="${pieceY}"
        width="${pieceWidth}"
        height="${pieceHeight}"
        fill="${block.color}"
        opacity="0"
      >
        <!-- Move and fall -->
        <animate
          attributeName="x"
          values="${pieceX};${endX}"
          dur="${duration}s"
          begin="${hitTime}s"
          fill="freeze"
        />
        <animate
          attributeName="y"
          values="${pieceY};${endY}"
          dur="${duration}s"
          begin="${hitTime}s"
          fill="freeze"
        />
        <!-- Fade in then out -->
        <animate
          attributeName="opacity"
          values="0;1;0"
          keyTimes="0;0.1;1"
          dur="${duration}s"
          begin="${hitTime}s"
          fill="freeze"
        />
        <!-- Rotate while falling -->
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 ${pieceX + pieceWidth/2} ${pieceY + pieceHeight/2};${360 * (row + col)} ${pieceX + pieceWidth/2} ${pieceY + pieceHeight/2}"
          dur="${duration}s"
          begin="${hitTime}s"
          fill="freeze"
        />
      </rect>`);
    }
  }

  return `
  <g class="shatter-effect">
    ${shards.join('\n')}
  </g>`;
}

/**
 * Create dissolve effect (block pixelates and disappears)
 */
export function createDissolveEffect(
  block: Block,
  hitTime: number,
  duration: number = 0.6
): string {
  // Break block into pixels
  const pixelSize = 2;
  const cols = Math.ceil(block.width / pixelSize);
  const rows = Math.ceil(block.height / pixelSize);
  const pixels: string[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const pixelX = block.x + col * pixelSize;
      const pixelY = block.y + row * pixelSize;

      // Each pixel disappears at a slightly different time (wave effect)
      const delay = (row + col) * 0.02;
      const pixelDuration = 0.3;

      pixels.push(`
      <rect
        x="${pixelX}"
        y="${pixelY}"
        width="${pixelSize}"
        height="${pixelSize}"
        fill="${block.color}"
        opacity="0"
      >
        <animate
          attributeName="opacity"
          values="0;1;0"
          keyTimes="0;0.5;1"
          dur="${pixelDuration}s"
          begin="${hitTime + delay}s"
          fill="freeze"
        />
        <!-- Float up slightly -->
        <animate
          attributeName="y"
          values="${pixelY};${pixelY - 5}"
          dur="${pixelDuration}s"
          begin="${hitTime + delay}s"
          fill="freeze"
        />
      </rect>`);
    }
  }

  return `
  <g class="dissolve-effect">
    ${pixels.join('\n')}
  </g>`;
}

/**
 * Create block with destroy effect based on type
 */
export function createBlockWithEffect(
  block: Block,
  hitTime: number,
  effectType: 'explode' | 'fade' | 'shatter' | 'dissolve' = 'explode'
): string {
  switch (effectType) {
    case 'fade':
      return createFadeOutEffect(block, hitTime);
    case 'explode':
      return createExplosionEffect(block, hitTime);
    case 'shatter':
      return createShatterEffect(block, hitTime);
    case 'dissolve':
      return createDissolveEffect(block, hitTime);
    default:
      return createFadeOutEffect(block, hitTime);
  }
}

/**
 * Create all blocks with their effects
 */
export function createAllBlocksWithEffects(
  blocks: Block[],
  hitTimes: Map<string, number>, // Map block ID to hit time
  effectType: 'explode' | 'fade' | 'shatter' | 'dissolve' = 'explode'
): string {
  return blocks
    .map((block, index) => {
      const blockId = `block-${block.x}-${block.y}`;
      const hitTime = hitTimes.get(blockId) || 999; // Default to far future if not hit
      return createBlockWithEffect(block, hitTime, effectType);
    })
    .join('\n');
}

/**
 * Create impact flash effect when bullet hits
 */
export function createImpactFlashSVG(
  x: number,
  y: number,
  hitTime: number,
  color: string = '#ffffff'
): string {
  return `
  <g class="impact-flash">
    <circle
      cx="${x}"
      cy="${y}"
      r="0"
      fill="${color}"
      opacity="0"
    >
      <animate
        attributeName="r"
        values="0;8;0"
        dur="0.15s"
        begin="${hitTime}s"
        fill="freeze"
      />
      <animate
        attributeName="opacity"
        values="0;1;0"
        dur="0.15s"
        begin="${hitTime}s"
        fill="freeze"
      />
    </circle>

    <!-- Secondary ring -->
    <circle
      cx="${x}"
      cy="${y}"
      r="0"
      fill="none"
      stroke="${color}"
      stroke-width="2"
      opacity="0"
    >
      <animate
        attributeName="r"
        values="3;12;18"
        dur="0.25s"
        begin="${hitTime}s"
        fill="freeze"
      />
      <animate
        attributeName="opacity"
        values="0;0.8;0"
        keyTimes="0;0.3;1"
        dur="0.25s"
        begin="${hitTime}s"
        fill="freeze"
      />
    </circle>
  </g>`;
}

/**
 * Create all impact flashes
 */
export function createAllImpactFlashesSVG(
  impacts: { x: number; y: number; time: number }[]
): string {
  return `
  <g class="impact-flashes-layer">
    ${impacts
      .map(impact => createImpactFlashSVG(impact.x, impact.y, impact.time))
      .join('\n')}
  </g>`;
}

export default {
  createFadeOutEffect,
  createExplosionEffect,
  createShatterEffect,
  createDissolveEffect,
  createBlockWithEffect,
  createAllBlocksWithEffects,
  createImpactFlashSVG,
  createAllImpactFlashesSVG,
};
