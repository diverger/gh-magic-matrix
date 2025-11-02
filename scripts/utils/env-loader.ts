/**
 * Environment configuration loader
 *
 * Loads environment variables from .env file if present
 * Provides utility functions for accessing configuration
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Load .env file from the repository root
 * This is a simple implementation that doesn't require external dependencies
 */
export function loadEnvFile(repoRoot: string): void {
  const envPath = path.join(repoRoot, '.env');

  if (!fs.existsSync(envPath)) {
    // .env file doesn't exist, rely on system environment variables
    return;
  }

  try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');

    for (const line of lines) {
      // Skip empty lines and comments
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // Parse KEY=VALUE format
      const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (match) {
        const [, key, value] = match;
        // Only set if not already defined in environment
        if (!process.env[key]) {
          // Remove surrounding quotes if present
          const cleanValue = value.replace(/^["']|["']$/g, '');
          process.env[key] = cleanValue;
        }
      }
    }
  } catch (error) {
    console.warn('Warning: Failed to load .env file:', error);
  }
}

/**
 * Load GitHub token from environment variables
 *
 * Checks multiple environment variable names for compatibility:
 * 1. GITHUB_TOKEN (preferred, used by GitHub Actions)
 * 2. GH_TOKEN (GitHub CLI convention)
 * 3. GITHUB_PAT (Personal Access Token)
 *
 * @param repoRoot - Path to repository root (for error messages)
 * @returns GitHub token
 * @throws Exit process if no valid token found
 */
export function loadGitHubToken(repoRoot: string): string {
  // First, try to load from .env file
  loadEnvFile(repoRoot);

  // Check multiple environment variable names for compatibility
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_PAT;

  if (token && token.trim() && !token.includes('your_github_token_here')) {
    return token.trim();
  }

  // No valid token found - show helpful error message
  console.error("❌ Error: GitHub token is required");
  console.error("");
  console.error("Please provide a token using one of these methods:");
  console.error("");
  console.error("Option 1: Use .env file (recommended for local development)");
  console.error("  1. Copy .env.example to .env:");
  console.error("     cp .env.example .env");
  console.error("  2. Edit .env and add your GitHub token:");
  console.error("     GITHUB_TOKEN=ghp_your_actual_token_here");
  console.error("  3. Run the script again");
  console.error("");
  console.error("Option 2: Set environment variable directly");
  console.error("  Windows (PowerShell):");
  console.error("    $env:GITHUB_TOKEN=\"ghp_xxxxx\"; bun scripts/...");
  console.error("  Unix/Mac/Linux:");
  console.error("    export GITHUB_TOKEN=ghp_xxxxx");
  console.error("    bun scripts/...");
  console.error("");
  console.error("How to create a GitHub token:");
  console.error("  https://github.com/settings/tokens");
  console.error("  Required scopes: none for public repos, 'repo' for private repos");
  console.error("");
  process.exit(1);
}

/**
 * Get an environment variable with a fallback value
 */
export function getEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

/**
 * Check if running in CI environment
 */
export function isCI(): boolean {
  return process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
}
