#!/bin/bash
# Test script for breathing-contrib action
#
# Usage:
#   ./scripts/breathing-contrib/test-breathing.sh [light|dark]
#
# Examples:
#   ./scripts/breathing-contrib/test-breathing.sh              # Use dark theme (default)
#   ./scripts/breathing-contrib/test-breathing.sh dark         # Use dark theme
#   ./scripts/breathing-contrib/test-breathing.sh light        # Use light theme
#
# Environment variables:
#   GITHUB_USER         - GitHub username (default: diverger)
#   PERIOD              - Breathing cycle duration in seconds (default: 6)
#   CELL_SIZE          - Cell size in pixels (default: 12)
#   CELL_GAP           - Gap between cells (default: 2)
#   CELL_RADIUS        - Cell border radius (default: 2)
#
# Example with custom parameters:
#   GITHUB_USER=octocat PERIOD=4 ./scripts/breathing-contrib/test-breathing.sh light

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
OUTPUT_FILE="$TEST_OUTPUT_DIR/breathing-$TIMESTAMP.svg"

# Default test parameters
GITHUB_USER="${GITHUB_USER:-diverger}"
PERIOD="${PERIOD:-6}"
CELL_SIZE="${CELL_SIZE:-12}"
CELL_GAP="${CELL_GAP:-2}"
CELL_RADIUS="${CELL_RADIUS:-2}"

# Color schemes
if [ "$1" = "light" ]; then
    COLOR_LEVELS="#ebedf0,#9be9a8,#40c463,#30a14e,#216e39"
    THEME="light"
elif [ "$1" = "dark" ]; then
    COLOR_LEVELS="#161b22,#0e4429,#006d32,#26a641,#39d353"
    THEME="dark"
else
    COLOR_LEVELS="#161b22,#0e4429,#006d32,#26a641,#39d353"
    THEME="dark"
fi

# Export environment variables for the breathing action
export INPUT_GITHUB_USER_NAME="$GITHUB_USER"
export INPUT_OUTPUT_PATH="$OUTPUT_FILE"
export INPUT_CELL_SIZE="$CELL_SIZE"
export INPUT_CELL_GAP="$CELL_GAP"
export INPUT_CELL_RADIUS="$CELL_RADIUS"
export INPUT_PERIOD="$PERIOD"
export INPUT_COLOR_LEVELS="$COLOR_LEVELS"

echo "🌊 Testing Breathing GitHub Action"
echo "==================================="
echo "  User: $INPUT_GITHUB_USER_NAME"
echo "  Theme: $THEME"
echo "  Period: ${INPUT_PERIOD}s"
echo "  Cell Size: ${INPUT_CELL_SIZE}px (gap: ${INPUT_CELL_GAP}px)"
echo "  Colors: $INPUT_COLOR_LEVELS"
echo "  Output: $OUTPUT_FILE"
echo ""

# Check if breathing package exists and build it
BREATHING_DIR="packages/breathing-contrib"
if [ ! -d "$BREATHING_DIR" ]; then
    echo "❌ Error: Breathing package directory not found at $BREATHING_DIR"
    echo "   Please run this script from the repository root."
    exit 1
fi

echo "📦 Building breathing package..."
cd "$BREATHING_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install
fi

# Build the package
echo "🔨 Building with npm..."
npm run build

if [ ! -f "dist/index.js" ]; then
    echo "❌ Error: Build failed - dist/index.js not found"
    exit 1
fi

echo "✅ Build completed successfully"
echo ""

# Run the breathing action
echo "🚀 Running breathing action..."
node dist/index.js

# Return to original directory
cd - > /dev/null

# Check if output was generated
if [ -f "$INPUT_OUTPUT_PATH" ]; then
  echo ""
  echo "✅ Breathing animation generated successfully!"
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
  if grep -q "animateTransform\|animate" "$INPUT_OUTPUT_PATH"; then
    echo "🎬 Animation: Detected"
  else
    echo "⚠️  Animation: Not detected"
  fi

  # Also create a "latest" symlink for quick access
  LATEST_LINK="$TEST_OUTPUT_DIR/breathing-latest.svg"
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