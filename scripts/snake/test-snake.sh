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
#   SNAKE_LENGTH        - Snake length in segments (default: 6)
#   ANIMATION_DURATION  - Animation duration in seconds (default: 20)
#   SVG_WIDTH          - Canvas width (default: 800)
#   SVG_HEIGHT         - Canvas height (default: 200)
#   CELL_SIZE          - Cell size in pixels (default: 12)
#   CELL_GAP           - Gap between cells (default: 2)
#   CELL_RADIUS        - Cell border radius (default: 2)
#
# Example with custom parameters:
#   GITHUB_USER=octocat SNAKE_LENGTH=8 ./scripts/snake/test-snake.sh light

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
SNAKE_LENGTH="${SNAKE_LENGTH:-6}"
ANIMATION_DURATION="${ANIMATION_DURATION:-20}"
SVG_WIDTH="${SVG_WIDTH:-800}"
SVG_HEIGHT="${SVG_HEIGHT:-200}"
CELL_SIZE="${CELL_SIZE:-12}"
CELL_GAP="${CELL_GAP:-2}"
CELL_RADIUS="${CELL_RADIUS:-2}"

# Color schemes
if [ "$1" = "light" ]; then
    COLORS="#ebedf0,#9be9a8,#40c463,#30a14e,#216e39"
    THEME="light"
elif [ "$1" = "dark" ]; then
    COLORS="#161b22,#0e4429,#006d32,#26a641,#39d353"
    THEME="dark"
else
    COLORS="#161b22,#0e4429,#006d32,#26a641,#39d353"
    THEME="dark"
fi

# Export environment variables for the snake action
export INPUT_GITHUB_USER_NAME="$GITHUB_USER"
export INPUT_OUTPUT_PATH="$OUTPUT_FILE"
export INPUT_SVG_WIDTH="$SVG_WIDTH"
export INPUT_SVG_HEIGHT="$SVG_HEIGHT"
export INPUT_CELL_SIZE="$CELL_SIZE"
export INPUT_CELL_GAP="$CELL_GAP"
export INPUT_CELL_RADIUS="$CELL_RADIUS"
export INPUT_SNAKE_LENGTH="$SNAKE_LENGTH"
export INPUT_ANIMATION_DURATION="$ANIMATION_DURATION"
export INPUT_COLORS="$COLORS"

echo "🐍 Testing Snake GitHub Action"
echo "================================"
echo "  User: $INPUT_GITHUB_USER_NAME"
echo "  Theme: $THEME"
echo "  Snake Length: $INPUT_SNAKE_LENGTH"
echo "  Animation Duration: ${INPUT_ANIMATION_DURATION}s"
echo "  Canvas Size: ${INPUT_SVG_WIDTH}x${INPUT_SVG_HEIGHT}"
echo "  Cell Size: ${INPUT_CELL_SIZE}px (gap: ${INPUT_CELL_GAP}px)"
echo "  Colors: $INPUT_COLORS"
echo "  Output: $OUTPUT_FILE"
echo ""

# Check if snake package exists and build it
SNAKE_DIR="packages/snake"
if [ ! -d "$SNAKE_DIR" ]; then
    echo "❌ Error: Snake package directory not found at $SNAKE_DIR"
    echo "   Please run this script from the repository root."
    exit 1
fi

echo "📦 Building snake package..."
cd "$SNAKE_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    bun install
fi

# Build with Bun
echo "🔨 Building with Bun..."
bun build src/index.ts --outdir dist --target node

if [ ! -f "dist/index.js" ]; then
    echo "❌ Error: Build failed - dist/index.js not found"
    exit 1
fi

echo "✅ Build completed successfully"
echo ""

# Run the snake action
echo "🚀 Running snake action..."
bun dist/index.js

# Run the snake action
echo "🚀 Running snake action..."
node dist/index.js

# Return to original directory
cd - > /dev/null

# Check if output was generated
if [ -f "$INPUT_OUTPUT_PATH" ]; then
  echo ""
  echo "✅ Snake animation generated successfully!"
  echo "📁 Saved to: $OUTPUT_FILE"
  echo "📊 File size: $(du -h "$INPUT_OUTPUT_PATH" | cut -f1)"

  # Get file info
  LINES=$(wc -l < "$INPUT_OUTPUT_PATH")
  echo "📄 Lines: $LINES"

  # Check if it contains expected SVG elements
  if grep -q "<svg" "$INPUT_OUTPUT_PATH" && grep -q "</svg>" "$INPUT_OUTPUT_PATH"; then
    echo "🎨 SVG structure: Valid"
  else
    echo "⚠️  SVG structure: May be invalid"
  fi

  # Check for animation elements
  if grep -q "animateMotion\|animate" "$INPUT_OUTPUT_PATH"; then
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
  echo "   Output file not found: $INPUT_OUTPUT_PATH"
  exit 1
fi
