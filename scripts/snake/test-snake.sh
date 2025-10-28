#!/bin/bash
# Test script for snake action
#
# Usage:
#   ./scripts/snake/test-snake.sh [light|dark]
#
# Examples:
#   ./scripts/snake/test-snake.sh              # Use dark theme (default)
#   ./scripts/snake/test-snake.sh dark         # Use dark theme
#   ./scripts/snake/test-snake.sh light        # Use light theme
#
# Environment variables:
#   GITHUB_USER         - GitHub username (default: diverger)
#
# Example with custom user:
#   GITHUB_USER=octocat ./scripts/snake/test-snake.sh light

set -e

# Show usage if help requested
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    head -20 "$0" | grep "^#" | sed 's/^# \?//'
    exit 0
fi

# Create test-outputs directory if it doesn't exist
TEST_OUTPUT_DIR="$(pwd)/test-outputs"
mkdir -p "$TEST_OUTPUT_DIR"

# Generate filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="$TEST_OUTPUT_DIR/snake-$TIMESTAMP.svg"

# Default test parameters
GITHUB_USER="${GITHUB_USER:-diverger}"

# Color schemes - using palette names for simplicity
if [ "$1" = "light" ]; then
    THEME="github-light"
elif [ "$1" = "dark" ]; then
    THEME="github-dark"
else
    THEME="github-dark"
fi

# Export environment variables for the snake action
export INPUT_GITHUB_USER_NAME="$GITHUB_USER"
export INPUT_GITHUB_TOKEN="${GITHUB_TOKEN:-${INPUT_GITHUB_TOKEN:-}}"
export INPUT_OUTPUTS="$OUTPUT_FILE?palette=$THEME"
export INPUT_SHOW_CONTRIBUTION_COUNTER="true"
export INPUT_COUNTER_PREFIX="🎯 "
export INPUT_COUNTER_SUFFIX=" contributions"

# Check if token is available
if [ -z "$INPUT_GITHUB_TOKEN" ]; then
    echo "⚠️  Warning: GITHUB_TOKEN not set. The action may fail to fetch contribution data."
    echo "   Set GITHUB_TOKEN environment variable or INPUT_GITHUB_TOKEN to use authenticated API."
    echo ""
fi

echo "🐍 Testing Snake GitHub Action"
echo "================================"
echo "  User: $INPUT_GITHUB_USER_NAME"
echo "  Theme: $THEME"
echo "  Output: $OUTPUT_FILE"
echo ""

# Check if snake package exists and build it
SNAKE_ACTION_DIR="packages/snake/packages/action"
if [ ! -d "$SNAKE_ACTION_DIR" ]; then
    echo "❌ Error: Snake action directory not found at $SNAKE_ACTION_DIR"
    echo "   Please run this script from the repository root."
    exit 1
fi

echo "📦 Building snake action package..."
cd "$SNAKE_ACTION_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    bun install
fi

# Build with ncc (matches our package.json)
echo "🔨 Building with ncc..."
bun run build

if [ ! -f "../../../../dist/snake/index.js" ]; then
    echo "❌ Error: Build failed - ../../../../dist/snake/index.js not found"
    exit 1
fi

echo "✅ Build completed successfully"
echo ""

# Run the snake action
echo "🚀 Running snake action..."
bun ../../../../dist/snake/index.js

# Return to original directory
cd - > /dev/null

# Check if output was generated
if [ -f "$OUTPUT_FILE" ]; then
  echo ""
  echo "✅ Snake animation generated successfully!"
  echo "📁 Saved to: $OUTPUT_FILE"
  echo "📊 File size: $(du -h "$OUTPUT_FILE" | cut -f1)"

  # Get file info
  LINES=$(wc -l < "$OUTPUT_FILE")
  echo "📄 Lines: $LINES"

  # Check if it contains expected SVG elements
  if grep -q "<svg" "$OUTPUT_FILE" && grep -q "</svg>" "$OUTPUT_FILE"; then
    echo "🎨 SVG structure: Valid"
  else
    echo "⚠️  SVG structure: May be invalid"
  fi

  # Check for animation elements
  if grep -q "animateMotion\|animate" "$OUTPUT_FILE"; then
    echo "🎬 Animation: Detected"
  else
    echo "⚠️  Animation: Not detected"
  fi

  # Also create a "latest" symlink for quick access
  LATEST_LINK="$TEST_OUTPUT_DIR/snake-latest.svg"
  ln -sf "$(basename "$OUTPUT_FILE")" "$LATEST_LINK"
  echo "🔗 Latest: $LATEST_LINK"

  echo ""
  echo "🎯 Test completed successfully!"
  echo "   You can open the SVG in a browser to view the animation:"
  echo "   file://$(realpath "$OUTPUT_FILE")"
else
  echo ""
  echo "❌ Failed to generate SVG"
  echo "   Output file not found: $OUTPUT_FILE"
  exit 1
fi
