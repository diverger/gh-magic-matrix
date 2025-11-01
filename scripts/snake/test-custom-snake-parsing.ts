/**
 * Test custom snake configuration parsing from query parameters
 */

import { parseEntry } from '../../packages/snake/src/outputs-options';

console.log('🧪 Testing Custom Snake Config Parsing\n');
console.log('============================================================\n');

// Test 1: Basic custom snake with segments
console.log('📝 Test 1: Basic custom snake with emoji segments');
const test1 = parseEntry('output.svg?use_custom_snake=true&custom_snake_segments=🐍,🟢,🟡,🔵');
console.log('Input: output.svg?use_custom_snake=true&custom_snake_segments=🐍,🟢,🟡,🔵');
console.log('Result:', {
  useCustomSnake: test1?.drawOptions.useCustomSnake,
  segments: test1?.drawOptions.customSnakeConfig?.segments,
  defaultContent: test1?.drawOptions.customSnakeConfig?.defaultContent
});
console.log('✅ Expected: useCustomSnake=true, segments=[🐍,🟢,🟡,🔵], defaultContent=🟢\n');

// Test 2: Custom snake with default content override
console.log('📝 Test 2: Custom snake with custom default content');
const test2 = parseEntry('output.svg?use_custom_snake=1&custom_snake_segments=A,B,C&custom_snake_default=X');
console.log('Input: output.svg?use_custom_snake=1&custom_snake_segments=A,B,C&custom_snake_default=X');
console.log('Result:', {
  useCustomSnake: test2?.drawOptions.useCustomSnake,
  segments: test2?.drawOptions.customSnakeConfig?.segments,
  defaultContent: test2?.drawOptions.customSnakeConfig?.defaultContent
});
console.log('✅ Expected: useCustomSnake=true, segments=[A,B,C], defaultContent=X\n');

// Test 3: Custom snake enabled without segments (should use defaults)
console.log('📝 Test 3: Custom snake enabled without segments');
const test3 = parseEntry('output.svg?use_custom_snake=true');
console.log('Input: output.svg?use_custom_snake=true');
console.log('Result:', {
  useCustomSnake: test3?.drawOptions.useCustomSnake,
  segments: test3?.drawOptions.customSnakeConfig?.segments,
  defaultContent: test3?.drawOptions.customSnakeConfig?.defaultContent
});
console.log('✅ Expected: useCustomSnake=true, segments=undefined, defaultContent=🟢\n');

// Test 4: Custom snake disabled (default behavior)
console.log('📝 Test 4: Custom snake not enabled (default)');
const test4 = parseEntry('output.svg');
console.log('Input: output.svg');
console.log('Result:', {
  useCustomSnake: test4?.drawOptions.useCustomSnake,
  customSnakeConfig: test4?.drawOptions.customSnakeConfig
});
console.log('✅ Expected: useCustomSnake=undefined, customSnakeConfig=undefined\n');

// Test 5: JSON format with custom snake
console.log('📝 Test 5: JSON format configuration');
const test5 = parseEntry('output.svg {"use_custom_snake": true, "custom_snake_segments": "🎯,⭐,✨,💫"}');
console.log('Input: output.svg {"use_custom_snake": true, "custom_snake_segments": "🎯,⭐,✨,💫"}');
console.log('Result:', {
  useCustomSnake: test5?.drawOptions.useCustomSnake,
  segments: test5?.drawOptions.customSnakeConfig?.segments,
  defaultContent: test5?.drawOptions.customSnakeConfig?.defaultContent
});
console.log('✅ Expected: useCustomSnake=true, segments=[🎯,⭐,✨,💫], defaultContent=🟢\n');

// Test 6: Segments with whitespace (should be trimmed)
console.log('📝 Test 6: Segments with whitespace');
const test6 = parseEntry('output.svg?use_custom_snake=true&custom_snake_segments=🐍 , 🟢 , 🟡 , 🔵');
console.log('Input: output.svg?use_custom_snake=true&custom_snake_segments=🐍 , 🟢 , 🟡 , 🔵');
console.log('Result:', {
  useCustomSnake: test6?.drawOptions.useCustomSnake,
  segments: test6?.drawOptions.customSnakeConfig?.segments,
});
console.log('✅ Expected: segments=[🐍,🟢,🟡,🔵] (whitespace trimmed)\n');

// Test 7: Image URLs in segments
console.log('📝 Test 7: Image URLs in segments');
const test7 = parseEntry('output.svg?use_custom_snake=true&custom_snake_segments=https://example.com/snake.png,🟢,🟡');
console.log('Input: output.svg?use_custom_snake=true&custom_snake_segments=https://example.com/snake.png,🟢,🟡');
console.log('Result:', {
  useCustomSnake: test7?.drawOptions.useCustomSnake,
  segments: test7?.drawOptions.customSnakeConfig?.segments,
});
console.log('✅ Expected: segments=[https://example.com/snake.png,🟢,🟡]\n');

// Test 8: use_custom_snake with empty string (should enable)
console.log('📝 Test 8: use_custom_snake with empty value');
const test8 = parseEntry('output.svg?use_custom_snake&custom_snake_segments=A,B,C');
console.log('Input: output.svg?use_custom_snake&custom_snake_segments=A,B,C');
console.log('Result:', {
  useCustomSnake: test8?.drawOptions.useCustomSnake,
  segments: test8?.drawOptions.customSnakeConfig?.segments,
});
console.log('✅ Expected: useCustomSnake=true (empty string treated as true)\n');

console.log('============================================================');
console.log('✅ Custom snake config parsing tests completed!');
console.log('\n📋 Supported Query Parameters:');
console.log('   - use_custom_snake: true/false/1/0 (or empty for true)');
console.log('   - custom_snake_segments: comma-separated content list');
console.log('   - custom_snake_default: default content for unspecified segments');
console.log('\n💡 Note: Function-based segments are only available programmatically');
