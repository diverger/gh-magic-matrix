/**
 * Tests for multi-image animation support
 */

import { it, expect } from 'bun:test';
import {
  generateFrameUrls,
  validateImageConfig,
  resolveImageMode,
  type CounterImageConfig,
} from '../svg-stack-renderer';

// generateFrameUrls tests
it('should generate URLs with default pattern', async () => {
  const urls = await generateFrameUrls('images/character', undefined, 3);
  expect(urls).toEqual([
    'images/character/frame-0.png',
    'images/character/frame-1.png',
    'images/character/frame-2.png',
  ]);
});

it('should generate URLs with custom pattern', async () => {
  const urls = await generateFrameUrls('assets/sprite', 'img-{n}.gif', 4);
  expect(urls).toEqual([
    'assets/sprite/img-0.gif',
    'assets/sprite/img-1.gif',
    'assets/sprite/img-2.gif',
    'assets/sprite/img-3.gif',
  ]);
});

it('should handle folder paths with trailing slash', async () => {
  const urls = await generateFrameUrls('images/char/', 'frame-{n}.png', 2);
  expect(urls).toEqual([
    'images/char/frame-0.png',
    'images/char/frame-1.png',
  ]);
});

it('should handle zero frames', async () => {
  const urls = await generateFrameUrls('images/test', 'frame-{n}.png', 0);
  expect(urls).toEqual([]);
});

// validateImageConfig tests
it('should validate config with url', () => {
  const config: CounterImageConfig = {
    url: 'image.png',
    width: 32,
    height: 32,
  };
  expect(validateImageConfig(config)).toBe(true);
});

it('should validate config with urlFolder and sprite.framesPerLevel', () => {
  const config: CounterImageConfig = {
    urlFolder: 'images/character',
    width: 32,
    height: 32,
    sprite: {
      framesPerLevel: 5,
    },
  };
  expect(validateImageConfig(config)).toBe(true);
});

it('should reject config without url or urlFolder', () => {
  const config: CounterImageConfig = {
    width: 32,
    height: 32,
  };
  expect(validateImageConfig(config)).toBe(false);
});

it('should reject config with both url and urlFolder', () => {
  const config: CounterImageConfig = {
    url: 'sprite.png',
    urlFolder: 'images/character',
    width: 32,
    height: 32,
  };
  expect(validateImageConfig(config)).toBe(false);
});

it('should accept urlFolder without sprite.framesPerLevel (defaults to 1 for static images)', () => {
  const config: CounterImageConfig = {
    urlFolder: 'images/character',
    width: 32,
    height: 32,
  };
  expect(validateImageConfig(config)).toBe(true);
});

it('should accept urlFolder with sprite but no framesPerLevel (defaults to 1)', () => {
  const config: CounterImageConfig = {
    urlFolder: 'images/character',
    width: 32,
    height: 32,
    sprite: {
      mode: 'sync',
    } as any,
  };
  expect(validateImageConfig(config)).toBe(true);
});

// resolveImageMode tests
it('should resolve single image mode', async () => {
  const config: CounterImageConfig = {
    url: 'image.png',
    width: 32,
    height: 32,
  };
  const result = await resolveImageMode(config);
  expect(result.mode).toBe('single');
  expect(result.spriteUrl).toBe('image.png');
  expect(result.frameUrls).toBeUndefined();
});

it('should resolve sprite sheet mode', async () => {
  const config: CounterImageConfig = {
    url: 'sprite.png',
    width: 160,
    height: 32,
    sprite: {
      framesPerLevel: 5,
      layout: 'horizontal',
    },
  };
  const result = await resolveImageMode(config);
  expect(result.mode).toBe('sprite-sheet');
  expect(result.spriteUrl).toBe('sprite.png');
  expect(result.frameUrls).toBeUndefined();
});

it('should resolve multi-file mode with default pattern', async () => {
  const config: CounterImageConfig = {
    urlFolder: 'images/character',
    width: 32,
    height: 32,
    sprite: {
      framesPerLevel: 3,
    },
  };
  const result = await resolveImageMode(config);
  expect(result.mode).toBe('multi-file');
  expect(result.spriteUrl).toBeUndefined();
  expect(result.frameUrls).toEqual([
    'images/character/frame-0.png',
    'images/character/frame-1.png',
    'images/character/frame-2.png',
  ]);
});

it('should resolve multi-file mode with custom pattern', async () => {
  const config: CounterImageConfig = {
    urlFolder: 'assets/anim',
    framePattern: 'walk-{n}.gif',
    width: 32,
    height: 32,
    sprite: {
      framesPerLevel: 4,
    },
  };
  const result = await resolveImageMode(config);
  expect(result.mode).toBe('multi-file');
  expect(result.frameUrls).toEqual([
    'assets/anim/walk-0.gif',
    'assets/anim/walk-1.gif',
    'assets/anim/walk-2.gif',
    'assets/anim/walk-3.gif',
  ]);
});

it('should throw error for invalid config', async () => {
  const config: CounterImageConfig = {
    width: 32,
    height: 32,
  };
  await expect(resolveImageMode(config)).rejects.toThrow('Invalid CounterImageConfig');
});

// Integration scenarios
it('should support multi-file with multiple frames', async () => {
  const config: CounterImageConfig = {
    urlFolder: 'images/run',
    width: 32,
    height: 32,
    sprite: {
      framesPerLevel: 8,
      fps: 10,
    },
  };

  expect(validateImageConfig(config)).toBe(true);
  const result = await resolveImageMode(config);
  expect(result.mode).toBe('multi-file');
  expect(result.frameUrls?.length).toBe(8);
});

it('should support multi-file with custom frame pattern', async () => {
  const config: CounterImageConfig = {
    urlFolder: 'images/walk',
    framePattern: 'step-{n}.png',
    width: 48,
    height: 48,
    sprite: {
      framesPerLevel: 6,
    },
  };

  expect(validateImageConfig(config)).toBe(true);
  const result = await resolveImageMode(config);
  expect(result.mode).toBe('multi-file');
  expect(result.frameUrls).toEqual([
    'images/walk/step-0.png',
    'images/walk/step-1.png',
    'images/walk/step-2.png',
    'images/walk/step-3.png',
    'images/walk/step-4.png',
    'images/walk/step-5.png',
  ]);
});
