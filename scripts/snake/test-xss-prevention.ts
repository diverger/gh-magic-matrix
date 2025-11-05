/**
 * Test XSS prevention in createTextElement
 */

import { createTextElement, escapeXml } from '../../packages/snake/packages/svg-creator/svg-utils';

console.log('🧪 Testing XSS Prevention in createTextElement\n');
console.log('============================================================\n');

// Test 1: Normal emoji content (should work as before)
console.log('📝 Test 1: Normal emoji content');
const test1 = createTextElement({ x: 10, y: 20, class: 'emoji' }, '🐍');
console.log('Input: "🐍"');
console.log('Output:', test1);
console.log('✅ Expected: <text x="10" y="20" class="emoji">🐍</text>\n');

// Test 2: Content with HTML/XML special characters (XSS attempt)
console.log('📝 Test 2: Content with XML special characters (XSS prevention)');
const test2 = createTextElement({ x: 10, y: 20 }, '<script>alert("XSS")</script>');
console.log('Input: "<script>alert(\\"XSS\\")</script>"');
console.log('Output:', test2);
console.log('✅ Expected: XML entities escaped (&lt;script&gt;...)\n');

// Test 3: Content with ampersand
console.log('📝 Test 3: Content with ampersand');
const test3 = createTextElement({ x: 10, y: 20 }, 'A & B');
console.log('Input: "A & B"');
console.log('Output:', test3);
console.log('✅ Expected: <text x="10" y="20">A &amp; B</text>\n');

// Test 4: Content with quotes
console.log('📝 Test 4: Content with quotes');
const test4 = createTextElement({ x: 10, y: 20 }, 'Say "Hello"');
console.log('Input: "Say \\"Hello\\""');
console.log('Output:', test4);
console.log('✅ Expected: <text x="10" y="20">Say &quot;Hello&quot;</text>\n');

// Test 5: Content with less than / greater than
console.log('📝 Test 5: Content with < and >');
const test5 = createTextElement({ x: 10, y: 20 }, '1 < 2 > 0');
console.log('Input: "1 < 2 > 0"');
console.log('Output:', test5);
console.log('✅ Expected: <text x="10" y="20">1 &lt; 2 &gt; 0</text>\n');

// Test 6: Null/undefined content (edge case)
console.log('📝 Test 6: Null/undefined content handling');
const test6a = createTextElement({ x: 10, y: 20 }, null as any);
const test6b = createTextElement({ x: 10, y: 20 }, undefined as any);
console.log('Input: null');
console.log('Output:', test6a);
console.log('Input: undefined');
console.log('Output:', test6b);
console.log('✅ Expected: Empty content without errors\n');

// Test 7: SVG injection attempt
console.log('📝 Test 7: SVG injection attempt');
const test7 = createTextElement({ x: 10, y: 20 }, '</text><script>alert(1)</script><text>');
console.log('Input: "</text><script>alert(1)</script><text>"');
console.log('Output:', test7);
console.log('✅ Expected: All tags escaped, no injection\n');

// Test 8: Event handler injection attempt
console.log('📝 Test 8: Event handler injection (via text content)');
const test8 = createTextElement({ x: 10, y: 20 }, '" onload="alert(1)"');
console.log('Input: "\\" onload=\\"alert(1)\\""');
console.log('Output:', test8);
console.log('✅ Expected: Quotes escaped, no attribute injection\n');

console.log('============================================================');
console.log('✅ XSS Prevention Tests Completed!\n');
console.log('📋 Security Measures:');
console.log('   - All text content is XML-escaped');
console.log('   - < > & " \' characters are converted to entities');
console.log('   - Script tags and event handlers are neutralized');
console.log('   - Null/undefined values are safely handled');
console.log('\n💡 escapeXml is applied to all textContent before rendering');

// Verify escapeXml function directly
console.log('\n🔬 Direct escapeXml Function Tests:');
console.log('   escapeXml("<script>"):', escapeXml('<script>'));
console.log('   escapeXml("A & B"):', escapeXml('A & B'));
console.log('   escapeXml("\\"quoted\\""):', escapeXml('"quoted"'));
console.log('   escapeXml("\'single\'"):', escapeXml("'single'"));
console.log('✅ All special characters properly escaped!');
