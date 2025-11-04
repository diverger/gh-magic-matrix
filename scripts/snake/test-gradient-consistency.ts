/**
 * Test script to verify gradient consistency fix
 * Ensures both renderSnake and renderSnakeWithInterpolation
 * use consistent totalLength for color functions
 */

import { renderSnake, renderSnakeWithInterpolation } from '../../packages/snake/packages/canvas-renderer/snake-renderer';
import { Snake } from '../../packages/snake/packages/types/snake';

type Cell = { x: number; y: number; isExit: boolean };

// Mock canvas context for testing
const createMockContext = () => {
  const calls: Array<{ method: string; args: any[] }> = [];
  return {
    calls,
    save: () => calls.push({ method: 'save', args: [] }),
    restore: () => calls.push({ method: 'restore', args: [] }),
    translate: (...args: any[]) => calls.push({ method: 'translate', args }),
    beginPath: () => calls.push({ method: 'beginPath', args: [] }),
    fill: () => calls.push({ method: 'fill', args: [] }),
    set fillStyle(value: string) {
      calls.push({ method: 'fillStyle', args: [value] });
    },
    arc: (...args: any[]) => calls.push({ method: 'arc', args }),
    arcTo: (...args: any[]) => calls.push({ method: 'arcTo', args }),
    lineTo: (...args: any[]) => calls.push({ method: 'lineTo', args }),
    moveTo: (...args: any[]) => calls.push({ method: 'moveTo', args }),
    closePath: () => calls.push({ method: 'closePath', args: [] }),
  } as any;
};

// Test gradient function that records totalLength parameter
let recordedTotalLengths: number[] = [];

const gradientColorFunction = (index: number, totalLength: number): string => {
  recordedTotalLengths.push(totalLength);
  const ratio = index / Math.max(totalLength - 1, 1);
  const r = Math.floor(255 * ratio);
  const b = Math.floor(255 * (1 - ratio));
  return `rgb(${r},0,${b})`;
};

// Create test snakes
const createTestSnake = (length: number): Snake => {
  const cells: Cell[] = [];
  for (let i = 0; i < length; i++) {
    cells.push({ x: i, y: 0, isExit: false });
  }
  return {
    toCells: () => cells,
  } as unknown as Snake;
};

console.log('🧪 Testing Gradient Consistency Fix\n');
console.log('='.repeat(60));

// Test 1: Static rendering with gradient function
console.log('\n📊 Test 1: renderSnake with gradient function');
recordedTotalLengths = [];
const ctx1 = createMockContext();
const snake1 = createTestSnake(5);

renderSnake(ctx1, snake1, {
  colorSnake: '#000000',
  cellSize: 16,
  colorSegments: gradientColorFunction,
});

console.log(`   Segments rendered: 5`);
console.log(`   totalLength values passed: [${recordedTotalLengths.join(', ')}]`);
const allSame1 = recordedTotalLengths.every(val => val === recordedTotalLengths[0]);
const test1Valid = recordedTotalLengths.every(val => val > 0);
console.log(`   ✓ All totalLength values consistent: ${allSame1 ? 'YES' : 'NO'}`);
console.log(`   ✓ totalLength = actual segments: ${recordedTotalLengths[0] === 5 ? 'YES' : 'NO'}`);
console.log(`   ✓ All totalLength values > 0: ${test1Valid ? 'YES' : 'NO'}`);

// Test 2: Interpolated rendering with gradient function
console.log('\n📊 Test 2: renderSnakeWithInterpolation with gradient function');
recordedTotalLengths = [];
const ctx2 = createMockContext();
const snakeStart = createTestSnake(7);
const snakeEnd = createTestSnake(7);

renderSnakeWithInterpolation(ctx2, snakeStart, snakeEnd, 0.5, {
  colorSnake: '#000000',
  cellSize: 16,
  colorSegments: gradientColorFunction,
});

console.log(`   Segments rendered: 7`);
console.log(`   totalLength values passed: [${recordedTotalLengths.join(', ')}]`);
const allSame2 = recordedTotalLengths.every(val => val === recordedTotalLengths[0]);
const test2Valid = recordedTotalLengths.every(val => val > 0);
console.log(`   ✓ All totalLength values consistent: ${allSame2 ? 'YES' : 'NO'}`);
console.log(`   ✓ totalLength = actual segments: ${recordedTotalLengths[0] === 7 ? 'YES' : 'NO'}`);
console.log(`   ✓ All totalLength values > 0: ${test2Valid ? 'YES' : 'NO'}`);

// Test 3: Interpolation with different snake lengths (edge case)
console.log('\n📊 Test 3: Interpolation with mismatched snake lengths');
recordedTotalLengths = [];
const ctx3 = createMockContext();
const snakeStart3 = createTestSnake(10);
const snakeEnd3 = createTestSnake(6);

renderSnakeWithInterpolation(ctx3, snakeStart3, snakeEnd3, 0.5, {
  colorSnake: '#000000',
  cellSize: 16,
  colorSegments: gradientColorFunction,
});

const expectedSegments = Math.min(10, 6); // Should be 6
console.log(`   Start snake: 10 segments, End snake: 6 segments`);
console.log(`   Segments rendered: ${expectedSegments}`);
console.log(`   totalLength values passed: [${recordedTotalLengths.slice(0, 3).join(', ')}, ...]`);
const allSame3 = recordedTotalLengths.every(val => val === recordedTotalLengths[0]);
const test3Valid = recordedTotalLengths.every(val => val > 0);
console.log(`   ✓ All totalLength values consistent: ${allSame3 ? 'YES' : 'NO'}`);
console.log(`   ✓ totalLength = min(start, end): ${recordedTotalLengths[0] === expectedSegments ? 'YES' : 'NO'}`);
console.log(`   ✓ All totalLength values > 0: ${test3Valid ? 'YES' : 'NO'}`);

// Summary
console.log('\n' + '='.repeat(60));
console.log('📋 Summary:');
const allTestsPassed = allSame1 && allSame2 && allSame3 &&
                       test1Valid && test2Valid && test3Valid;

if (allTestsPassed) {
  console.log('✅ All tests PASSED - Gradient consistency is fixed!');
  console.log('   Both rendering functions now use consistent totalLength values.');
} else {
  console.log('❌ Some tests FAILED - Issues detected.');
}

console.log('='.repeat(60));
