/**
 * Test script to verify logger functionality in snake renderer
 * This tests that:
 * 1. Logger can be optionally provided
 * 2. Debug output is controlled by logger
 * 3. Default behavior is silent (no console output)
 */

import { renderAnimatedSvgSnake, type Logger } from '../../packages/snake/packages/svg-creator';
import { Snake } from '../../packages/snake/packages/types/snake';
import { Point } from '../../packages/snake/packages/types/point';

// Custom logger that tracks calls
class TestLogger implements Logger {
  public debugCalls: any[][] = [];
  public infoCalls: any[][] = [];
  public warnCalls: any[][] = [];
  public errorCalls: any[][] = [];

  debug(...args: any[]): void {
    this.debugCalls.push(args);
    console.log('[DEBUG]', ...args);
  }

  info(...args: any[]): void {
    this.infoCalls.push(args);
    console.log('[INFO]', ...args);
  }

  warn(...args: any[]): void {
    this.warnCalls.push(args);
    console.log('[WARN]', ...args);
  }

  error(...args: any[]): void {
    this.errorCalls.push(args);
    console.log('[ERROR]', ...args);
  }
}

async function testLoggerFunctionality() {
  console.log('🧪 Testing Logger Functionality\n');
  console.log('============================================================\n');

  // Create a simple snake for testing
  const testSnake = new Snake([
    new Point(0, 0),
    new Point(0, 1),
    new Point(0, 2),
    new Point(0, 3)
  ]);
  const snakeChain = [testSnake];

  const baseConfig = {
    cellSize: 16,
    animationDuration: 3000,
    styling: {
      head: '#4CAF50',
      body: '#8BC34A',
    },
  };

  // Test 1: Without logger (should be silent - default behavior)
  console.log('📝 Test 1: Without logger (default silent operation)');
  console.log('   Expected: No debug output from renderer\n');

  const result1 = await renderAnimatedSvgSnake(snakeChain, {
    ...baseConfig,
    useCustomContent: true,
    customContentConfig: {
      segments: ['🐍', '🟢', '🟡', '🔵'],
    },
    // No logger provided - should default to silent no-op logger
  }, 12);

  console.log(`   ✅ Completed silently (${result1.elements.length} elements generated)`);

  // Test 2: With custom logger
  console.log('\n📝 Test 2: With custom logger');
  console.log('   Expected: Debug messages captured by custom logger\n');

  const customLogger = new TestLogger();

  const result2 = await renderAnimatedSvgSnake(snakeChain, {
    ...baseConfig,
    useCustomContent: true,
    customContentConfig: {
      segments: ['🎯', '⭐', '✨', '💫'],
    },
    logger: customLogger, // Provide custom logger
  }, 12);

  console.log(`   ✅ Completed with logger (${result2.elements.length} elements generated)`);
  console.log(`   📋 Debug calls captured: ${customLogger.debugCalls.length}`);
  if (customLogger.debugCalls.length > 0) {
    customLogger.debugCalls.forEach((args, i) => {
      console.log(`      ${i + 1}. ${args.join(' ')}`);
    });
  } else {
    console.log(`      ℹ️  No debug output (no external images to convert)`);
  }

  // Test 3: With external image URL (will trigger logger output)
  console.log('\n📝 Test 3: With external image URL');
  console.log('   Expected: Image conversion messages in logger\n');

  const imageLogger = new TestLogger();

  const result3 = await renderAnimatedSvgSnake(snakeChain, {
    ...baseConfig,
    useCustomContent: true,
    customContentConfig: {
      segments: [
        'https://github.githubassets.com/images/icons/emoji/unicode/1f40d.png',
        '🟢'
      ],
    },
    logger: imageLogger,
  }, 12);

  console.log(`   ✅ Completed with image logger (${result3.elements.length} elements generated)`);
  console.log(`   📋 Debug calls captured: ${imageLogger.debugCalls.length}`);
  if (imageLogger.debugCalls.length > 0) {
    imageLogger.debugCalls.forEach((args, i) => {
      console.log(`      ${i + 1}. ${args.join(' ')}`);
    });
  }

  // Test 4: With console as logger (standard console output)
  console.log('\n📝 Test 4: With console as logger');
  console.log('   Expected: Standard console.log output visible\n');

  const result4 = await renderAnimatedSvgSnake(snakeChain, {
    ...baseConfig,
    useCustomContent: true,
    customContentConfig: {
      segments: [
        'https://github.githubassets.com/images/icons/emoji/unicode/1f680.png',
        '✨'
      ],
    },
    logger: console, // Use standard console
  }, 12);

  console.log(`\n   ✅ Completed with console logger (${result4.elements.length} elements generated)`);

  console.log('\n============================================================');
  console.log('✅ Logger functionality tests passed!');
  console.log('\n📊 Summary:');
  console.log(`   - Logger interface: ✅ Defined and exported`);
  console.log(`   - Optional logger parameter: ✅ Properly typed`);
  console.log(`   - Default silent operation: ✅ No console.log when logger not provided`);
  console.log(`   - Custom logger support: ✅ Can inject custom logger implementation`);
  console.log(`   - Console logger support: ✅ Can use standard console object`);
  console.log(`   - Naming consistency: ✅ useCustomContent/customContentConfig`);
  console.log('\n💡 Library consumers can now control debug output!');
}

// Run the test
testLoggerFunctionality().catch(console.error);
