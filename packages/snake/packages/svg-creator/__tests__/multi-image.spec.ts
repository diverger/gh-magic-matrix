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
it('should generate URLs with default pattern', () => {
  const urls = generateFrameUrls('images/character', undefined, 3);
  expect(urls).toEqual([
    'images/character/frame-0.png',
    'images/character/frame-1.png',
    'images/character/frame-2.png',
  ]);
});

it('should generate URLs with custom pattern', () => {
  const urls = generateFrameUrls('assets/sprite', 'img_{n}.gif', 4);
  expect(urls).toEqual([
    'assets/sprite/img_0.gif',
    'assets/sprite/img_1.gif',
    'assets/sprite/img_2.gif',
    'assets/sprite/img_3.gif',
  ]);
});

it('should handle folder paths with trailing slash', () => {
  const urls = generateFrameUrls('images/char/', 'frame-{n}.png', 2);
  expect(urls).toEqual([
    'images/char/frame-0.png',
    'images/char/frame-1.png',
  ]);
});

it('should handle zero frames', () => {
  const urls = generateFrameUrls('images/test', 'frame-{n}.png', 0);
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

it('should validate config with urlFolder and sprite.frames', () => {
  const config: CounterImageConfig = {
    urlFolder: 'images/character',
    width: 32,
    height: 32,
    sprite: {
      frames: 5,
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

it('should reject urlFolder without sprite.frames', () => {
  const config: CounterImageConfig = {
    urlFolder: 'images/character',
    width: 32,
    height: 32,
  };
  expect(validateImageConfig(config)).toBe(false);
});

it('should reject urlFolder with sprite but no frames', () => {
  const config: CounterImageConfig = {
    urlFolder: 'images/character',
    width: 32,
    height: 32,
    sprite: {
      mode: 'sync',
    } as any,
  };
  expect(validateImageConfig(config)).toBe(false);
});

// resolveImageMode tests
it('should resolve single image mode', () => {
  const config: CounterImageConfig = {
    url: 'image.png',
    width: 32,
    height: 32,
  };
  const result = resolveImageMode(config);
  expect(result.mode).toBe('single');
  expect(result.spriteUrl).toBe('image.png');
  expect(result.frameUrls).toBeUndefined();
});

it('should resolve sprite sheet mode', () => {
  const config: CounterImageConfig = {
    url: 'sprite.png',
    width: 160,
    height: 32,
    sprite: {
      frames: 5,
      layout: 'horizontal',
    },
  };
  const result = resolveImageMode(config);
  expect(result.mode).toBe('sprite-sheet');
  expect(result.spriteUrl).toBe('sprite.png');
  expect(result.frameUrls).toBeUndefined();
});

it('should resolve multi-file mode with default pattern', () => {
  const config: CounterImageConfig = {
    urlFolder: 'images/character',
    width: 32,
    height: 32,
    sprite: {
      frames: 3,
    },
  };
  const result = resolveImageMode(config);
  expect(result.mode).toBe('multi-file');
  expect(result.spriteUrl).toBeUndefined();
  expect(result.frameUrls).toEqual([
    'images/character/frame-0.png',
    'images/character/frame-1.png',
    'images/character/frame-2.png',
  ]);
});

it('should resolve multi-file mode with custom pattern', () => {
  const config: CounterImageConfig = {
    urlFolder: 'assets/anim',
    framePattern: 'walk_{n}.gif',
    width: 32,
    height: 32,
    sprite: {
      frames: 4,
    },
  };
  const result = resolveImageMode(config);
  expect(result.mode).toBe('multi-file');
  expect(result.frameUrls).toEqual([
    'assets/anim/walk_0.gif',
    'assets/anim/walk_1.gif',
    'assets/anim/walk_2.gif',
    'assets/anim/walk_3.gif',
  ]);
});

it('should throw error for invalid config', () => {
  const config: CounterImageConfig = {
    width: 32,
    height: 32,
  };
  expect(() => resolveImageMode(config)).toThrow('Invalid CounterImageConfig');
});

// Integration scenarios
it('should support loop mode with multi-file', () => {
  const config: CounterImageConfig = {
    urlFolder: 'images/run',
    width: 32,
    height: 32,
    sprite: {
      frames: 8,
      mode: 'loop',
      fps: 10,
    },
  };

  expect(validateImageConfig(config)).toBe(true);
  const result = resolveImageMode(config);
  expect(result.mode).toBe('multi-file');
  expect(result.frameUrls?.length).toBe(8);
});

it('should support sync mode with multi-file', () => {
  const config: CounterImageConfig = {
    urlFolder: 'images/walk',
    framePattern: 'step{n}.png',
    width: 48,
    height: 48,
    sprite: {
      frames: 6,
      mode: 'sync',
    },
  };

  expect(validateImageConfig(config)).toBe(true);
  const result = resolveImageMode(config);
  expect(result.mode).toBe('multi-file');
  expect(result.frameUrls).toEqual([
    'images/walk/step0.png',
    'images/walk/step1.png',
    'images/walk/step2.png',
    'images/walk/step3.png',
    'images/walk/step4.png',
    'images/walk/step5.png',
  ]);
});
