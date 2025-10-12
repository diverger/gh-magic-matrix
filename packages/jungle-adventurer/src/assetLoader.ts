/**
 * Asset Loader for built-in sprite sheets
 * Loads sprite images from the package's assets directory
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { SpriteSheetConfig, MultiDirectionalSprites } from './spriteAnimation';
import { createSpriteSheet } from './spriteAnimation';

// Get package directory (handles both ESM and CommonJS)
function getPackageDir(): string {
  // Try ESM first
  if (typeof __dirname !== 'undefined') {
    return join(__dirname, '..');
  }

  // Fallback for ESM
  try {
    const currentFile = fileURLToPath(import.meta.url);
    return join(dirname(currentFile), '..');
  } catch {
    // Last resort
    return join(process.cwd(), 'packages', 'jungle-adventurer');
  }
}

/**
 * Load image file as base64 data URL
 */
export function loadImageAsDataURL(filePath: string): string {
  try {
    const buffer = readFileSync(filePath);
    const base64 = buffer.toString('base64');
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    throw new Error(`Failed to load image: ${filePath} - ${error}`);
  }
}

/**
 * Load sprite sheet from file path
 */
export function loadSpriteSheet(
  filePath: string,
  frameWidth: number = 48,
  frameHeight: number = 64,
  frameCount: number = 8,
  layout: 'horizontal' | 'vertical' = 'horizontal'
): SpriteSheetConfig {
  const imageData = loadImageAsDataURL(filePath);
  return createSpriteSheet(imageData, frameWidth, frameHeight, frameCount, layout);
}

/**
 * Get path to built-in sprite asset
 */
export function getAssetPath(assetName: string): string {
  const packageDir = getPackageDir();
  return join(packageDir, 'assets', 'sprites', assetName);
}

/**
 * Load all built-in sprites (8-directional)
 * Returns MultiDirectionalSprites with all available sprites
 */
export function loadBuiltInSprites(): MultiDirectionalSprites {
  const sprites: MultiDirectionalSprites = {};

  // Sprite file mapping - using EXACT filenames from assets/sprites/
  const spriteFiles = {
    // Run with gun - 8 directions
    runRight: 'Run_Gun_right.png',
    runLeft: 'Run_Gun_left.png',
    runUp: 'Run_Gun_up.png',
    runDown: 'Run_Gun_down.png',
    runRightUp: 'Run_Gun_right_up.png',
    runRightDown: 'Run_Gun_right_down.png',
    runLeftUp: 'Run_Gun_left_up.png',
    runLeftDown: 'Run_Gun_left_down.png',

    // Shooting - 8 directions
    shootRight: 'Shooting_right.png',
    shootLeft: 'Shooting_left.png',
    shootUp: 'Shooting_up.png',
    shootDown: 'Shooting_down.png',
    shootRightUp: 'Shooting_right_up.png',
    shootRightDown: 'Shooting_right_down.png',
    shootLeftUp: 'Shooting_left_up.png',
    shootLeftDown: 'Shooting_left_down.png',

    // Walk while reloading - 8 directions
    reloadRight: 'Walk_while_reloading_Right.png',
    reloadLeft: 'Walk_while_reloading_Left.png',
    reloadUp: 'Walk_while_reloading_Up.png',
    reloadDown: 'Walk_while_reloading_Down.png',
    reloadRightUp: 'Walk_while_reloading_Right_Up.png',
    reloadRightDown: 'Walk_while_reloading_Right_Down.png',
    reloadLeftUp: 'Walk_while_reloading_Left_Up.png',
    reloadLeftDown: 'Walk_while_reloading_Left_Down.png',
  };

  // Load all sprites
  for (const [key, filename] of Object.entries(spriteFiles)) {
    try {
      const path = getAssetPath(filename);
      sprites[key as keyof MultiDirectionalSprites] = loadSpriteSheet(path);
    } catch (error) {
      // Skip missing sprites, will use fallback later
    }
  }

  // Ensure at least runRight sprite exists (minimum requirement)
  if (!sprites.runRight) {
    throw new Error('At least Run_Gun_right.png sprite is required!');
  }

  return sprites;
}

/**
 * Create placeholder sprite for testing
 * Generates a simple colored rectangle as base64 PNG
 */
export function createPlaceholderSprite(
  color: string = '#00ff00',
  frameCount: number = 8
): SpriteSheetConfig {
  // This is a minimal placeholder - in real use, actual sprite sheets are needed
  const placeholderData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  return createSpriteSheet(
    placeholderData,
    48,
    64,
    frameCount,
    'horizontal'
  );
}

export default {
  loadImageAsDataURL,
  loadSpriteSheet,
  getAssetPath,
  loadBuiltInSprites,
  createPlaceholderSprite,
};
