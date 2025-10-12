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
    // In production (ncc bundle), __dirname points to dist/jungle-adventurer/
    if (typeof __dirname !== 'undefined') {
        return __dirname;
    }

    // Fallback for ESM - go up one level from src/ to package root
    try {
        const currentFile = fileURLToPath(import.meta.url);
        return join(dirname(currentFile), '..');
    } catch {
        // Development fallback
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
        const ext = filePath.split('.').pop()?.toLowerCase() || 'png';
        const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
        return `data:${mimeType};base64,${base64}`;
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

    // Sprite file mapping - using EXACT filenames from assets/sprites/ (all lowercase)
    const spriteFiles = {
        // Run with gun (not shooting) - 8 directions
        runRight: 'run_gun_right.png',
        runLeft: 'run_gun_left.png',
        runUp: 'run_gun_up.png',
        runDown: 'run_gun_down.png',
        runRightUp: 'run_gun_right_up.png',
        runRightDown: 'run_gun_right_down.png',
        runLeftUp: 'run_gun_left_up.png',
        runLeftDown: 'run_gun_left_down.png',

        // Run while shooting - 8 directions (CORRECT: use run_while_shooting_*)
        shootRight: 'run_while_shooting_right.png',
        shootLeft: 'run_while_shooting_left.png',
        shootUp: 'run_while_shooting_up.png',
        shootDown: 'run_while_shooting_down.png',
        shootRightUp: 'run_while_shooting_right_up.png',
        shootRightDown: 'run_while_shooting_right_down.png',
        shootLeftUp: 'run_while_shooting_left_up.png',
        shootLeftDown: 'run_while_shooting_left_down.png',

        // Walk while reloading - 8 directions
        reloadRight: 'walk_while_reloading_right.png',
        reloadLeft: 'walk_while_reloading_left.png',
        reloadUp: 'walk_while_reloading_up.png',
        reloadDown: 'walk_while_reloading_down.png',
        reloadRightUp: 'walk_while_reloading_right_up.png',
        reloadRightDown: 'walk_while_reloading_right_down.png',
        reloadLeftUp: 'walk_while_reloading_left_up.png',
        reloadLeftDown: 'walk_while_reloading_left_down.png',
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
 * Generates a simple 1x1 transparent PNG as base64
 * Note: This is a minimal placeholder - in real use, actual sprite sheets are needed
 */
export function createPlaceholderSprite(
    frameCount: number = 8
): SpriteSheetConfig {
    // 1x1 transparent PNG
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
