#!/bin/bash
# Quick test runner for snake TypeScript classes
#
# Usage:
#   ./scripts/snake/test-snake-units.sh
#
# This script builds and runs the basic unit tests for the snake implementation

set -e

echo "🧪 Running Snake Unit Tests"
echo "============================"

SNAKE_DIR="packages/snake"
cd "$SNAKE_DIR"

echo "📦 Installing dependencies..."
if [ ! -d "node_modules" ]; then
    bun install
fi

echo "🔨 Building with Bun..."
bun build src/test.ts --outdir dist --target node

if [ ! -f "dist/test.js" ]; then
    echo "❌ Error: Test build not found at dist/test.js"
    echo "   Make sure src/test.ts exists and builds correctly"
    exit 1
fi

echo "🚀 Running unit tests..."
bun dist/test.js

echo ""
echo "✅ Unit tests completed!"