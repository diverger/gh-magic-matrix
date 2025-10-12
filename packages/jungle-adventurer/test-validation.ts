#!/usr/bin/env bun
// Test edge cases for input validation

import { generateJungleAdventurerSVG } from './src/index';
import type { ContributionWeek } from './src/index';

console.log('🧪 Testing input validation...\n');

let passed = 0;
let failed = 0;

// Test 1: Empty weeks array
console.log('Test 1: Empty contributionWeeks');
try {
  generateJungleAdventurerSVG([]);
  console.log('❌ FAILED: Should have thrown error for empty array');
  failed++;
} catch (error: any) {
  if (error.message.includes('cannot be empty')) {
    console.log('✅ PASSED:', error.message);
    passed++;
  } else {
    console.log('❌ FAILED: Wrong error:', error.message);
    failed++;
  }
}

// Test 2: Weeks with no days
console.log('\nTest 2: Weeks with no days');
try {
  generateJungleAdventurerSVG([
    { days: [] },
    { days: [] }
  ]);
  console.log('❌ FAILED: Should have thrown error for weeks with no days');
  failed++;
} catch (error: any) {
  if (error.message.includes('at least one week with days')) {
    console.log('✅ PASSED:', error.message);
    passed++;
  } else {
    console.log('❌ FAILED: Wrong error:', error.message);
    failed++;
  }
}

// Test 3: Null/undefined weeks
console.log('\nTest 3: Null contributionWeeks');
try {
  generateJungleAdventurerSVG(null as any);
  console.log('❌ FAILED: Should have thrown error for null');
  failed++;
} catch (error: any) {
  if (error.message.includes('cannot be empty')) {
    console.log('✅ PASSED:', error.message);
    passed++;
  } else {
    console.log('❌ FAILED: Wrong error:', error.message);
    failed++;
  }
}

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
console.log('ℹ️  Note: Full SVG generation tests require sprite assets\n');

if (failed > 0) {
  process.exit(1);
}
