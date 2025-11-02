#!/usr/bin/env bun
/**
 * Test script to verify wildcard validation
 * Tests that patterns with multiple wildcards are properly rejected
 */

import { generateLevelFrameUrl } from './svg-stack-renderer';

console.log('🧪 Testing Wildcard Validation\n');

const testCases = [
  {
    name: 'Valid: Single wildcard - exact match',
    pattern: 'sprite_{n}.png',
    shouldThrow: false
  },
  {
    name: 'Valid: Single wildcard - sprite sheet per level',
    pattern: '*_{n}.png',
    shouldThrow: false
  },
  {
    name: 'Valid: Single wildcard - level frames',
    pattern: '*_{n}-{n}.png',
    shouldThrow: false
  },
  {
    name: 'Invalid: Multiple wildcards',
    pattern: '*_sprite_{n}*.png',
    shouldThrow: true
  },
  {
    name: 'Invalid: Three wildcards',
    pattern: '*_*_{n}_*.png',
    shouldThrow: true
  }
];

let passed = 0;
let failed = 0;

for (const test of testCases) {
  try {
    const result = generateLevelFrameUrl('./assets', test.pattern, 1, 0);

    if (test.shouldThrow) {
      console.log(`❌ FAIL: ${test.name}`);
      console.log(`   Expected: Error to be thrown`);
      console.log(`   Got: "${result}"`);
      failed++;
    } else {
      console.log(`✅ PASS: ${test.name}`);
      console.log(`   Pattern: "${test.pattern}" → "${result}"`);
      passed++;
    }
  } catch (error) {
    if (test.shouldThrow) {
      console.log(`✅ PASS: ${test.name}`);
      console.log(`   Error (expected): ${error instanceof Error ? error.message : String(error)}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${test.name}`);
      console.log(`   Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
      failed++;
    }
  }
  console.log();
}

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
