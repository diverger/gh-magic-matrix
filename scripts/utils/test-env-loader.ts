#!/usr/bin/env bun
/**
 * Test the environment loader utility
 *
 * This script verifies that the env-loader correctly:
 * 1. Loads .env file from repository root
 * 2. Checks multiple environment variable names
 * 3. Provides helpful error messages
 *
 * Run: bun scripts/utils/test-env-loader.ts
 */

import * as path from "path";
import { loadEnvFile, loadGitHubToken, getEnv, isCI } from "./env-loader.js";

const REPO_ROOT = path.resolve(process.cwd());

console.log("🧪 Testing Environment Loader");
console.log("=".repeat(60));
console.log("");

// Test 1: Load .env file
console.log("Test 1: Loading .env file...");
loadEnvFile(REPO_ROOT);
console.log("✅ .env file loading completed (if file exists)");
console.log("");

// Test 2: Check environment detection
console.log("Test 2: CI environment detection...");
console.log(`   Is CI: ${isCI()}`);
console.log(`   CI env var: ${process.env.CI || 'not set'}`);
console.log(`   GITHUB_ACTIONS env var: ${process.env.GITHUB_ACTIONS || 'not set'}`);
console.log("");

// Test 3: Test getEnv with defaults
console.log("Test 3: Getting environment variables with defaults...");
console.log(`   NODE_ENV: ${getEnv('NODE_ENV', 'development')}`);
console.log(`   CUSTOM_VAR: ${getEnv('CUSTOM_VAR', 'default_value')}`);
console.log("");

// Test 4: Check which token variable is set (if any)
console.log("Test 4: Checking for GitHub tokens...");
const tokenVars = ['GITHUB_TOKEN', 'GH_TOKEN', 'GITHUB_PAT'];
let foundToken = false;

for (const varName of tokenVars) {
  const value = process.env[varName];
  if (value && value.trim() && !value.includes('your_github_token_here')) {
    console.log(`   ✅ ${varName}: Found (masked: ${value.substring(0, 7)}...)`);
    foundToken = true;
  } else {
    console.log(`   ⚪ ${varName}: Not set`);
  }
}

console.log("");

if (!foundToken) {
  console.log("⚠️  No GitHub token found in environment");
  console.log("   This is normal if you haven't set up authentication yet.");
  console.log("   See SECURITY.md for setup instructions.");
  console.log("");
} else {
  console.log("✅ GitHub token detected");
  console.log("");

  // Test 5: Try loading token
  console.log("Test 5: Loading GitHub token via loadGitHubToken()...");
  try {
    const token = loadGitHubToken(REPO_ROOT);
    console.log(`   ✅ Token loaded successfully (${token.substring(0, 7)}...)`);
  } catch (error) {
    console.log(`   ❌ Failed to load token: ${error}`);
  }
}

console.log("");
console.log("=".repeat(60));
console.log("🎉 Environment loader test completed!");
