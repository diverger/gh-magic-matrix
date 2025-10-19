#!/bin/bash
# Test script for blinking-contrib action
#
# Usage:
#   ./scripts/blinking-contrib/test-blinking.sh [light|dark] [smooth|fast]
#
# Examples:
#   ./scripts/blinking-contrib/test-blinking.sh              # Use dark theme, smooth transitions (default)
#   ./scripts/blinking-contrib/test-blinking.sh dark         # Use dark theme, smooth transitions
#   ./scripts/blinking-contrib/test-blinking.sh light fast   # Use light theme, fast blinking
#   ./scripts/blinking-contrib/test-blinking.sh dark smooth  # Use dark theme, smooth transitions
#
# Environment variables:
#   GITHUB_USER           - GitHub username (default: diverger)
#   FRAME_DURATION        - How long each year stays visible in seconds (default: 3 for smooth, 0.5 for fast)
#   TRANSITION_DURATION   - Fade transition duration in seconds (default: 0.8 for smooth, 0 for fast)
#   TEXT_FRAME_DURATION   - Duration for ending text frame in seconds (default: 6)
#   ENDING_TEXT           - Pixel art text at end (default: username)
#   FONT_SIZE             - Font size: 3x5 or 5x7 (default: 3x5)
#   CELL_SIZE            - Cell size in pixels (default: 12)
#   CELL_GAP             - Gap between cells (default: 2)
#   CELL_RADIUS          - Cell border radius (default: 2)
#
# Example with custom parameters:
#   GITHUB_USER=octocat ENDING_TEXT="HELLO" ./scripts/blinking-contrib/test-blinking.sh light fast

set -e

# Show usage if help requested
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    head -25 "$0" | grep "^#" | sed 's/^# \?//'
    exit 0
fi

# Create test-outputs directory if it doesn't exist
TEST_OUTPUT_DIR="$(pwd)/test-outputs"
mkdir -p "$TEST_OUTPUT_DIR"

# Generate filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Parse arguments
THEME="dark"
EFFECT="smooth"

for arg in "$@"; do
    case $arg in
        light|dark)
            THEME="$arg"
            ;;
        smooth|fast)
            EFFECT="$arg"
            ;;
    esac
done

OUTPUT_FILE="$TEST_OUTPUT_DIR/blinking-$THEME-$EFFECT-$TIMESTAMP.svg"

# Default test parameters
GITHUB_USER="${GITHUB_USER:-diverger}"
CELL_SIZE="${CELL_SIZE:-12}"
CELL_GAP="${CELL_GAP:-2}"
CELL_RADIUS="${CELL_RADIUS:-2}"
ENDING_TEXT="${ENDING_TEXT:-$GITHUB_USER}"
FONT_SIZE="${FONT_SIZE:-3x5}"

# Effect-specific defaults
if [ "$EFFECT" = "fast" ]; then
    FRAME_DURATION="${FRAME_DURATION:-0.5}"
    TRANSITION_DURATION="${TRANSITION_DURATION:-0}"
    TEXT_FRAME_DURATION="${TEXT_FRAME_DURATION:-3}"
else
    FRAME_DURATION="${FRAME_DURATION:-3}"
    TRANSITION_DURATION="${TRANSITION_DURATION:-0.8}"
    TEXT_FRAME_DURATION="${TEXT_FRAME_DURATION:-6}"
fi

# Color schemes
if [ "$THEME" = "light" ]; then
    COLOR_LEVELS="#ebedf0,#9be9a8,#40c463,#30a14e,#216e39"
else
    COLOR_LEVELS="#161b22,#0e4429,#006d32,#26a641,#39d353"
fi

# Export environment variables for the blinking action
export INPUT_GITHUB_USER_NAME="$GITHUB_USER"
export INPUT_OUTPUT_PATH="$OUTPUT_FILE"
export INPUT_CELL_SIZE="$CELL_SIZE"
export INPUT_CELL_GAP="$CELL_GAP"
export INPUT_CELL_RADIUS="$CELL_RADIUS"
export INPUT_FRAME_DURATION="$FRAME_DURATION"
export INPUT_FADE_IN_DURATION="$TRANSITION_DURATION"
export INPUT_FADE_OUT_DURATION="$TRANSITION_DURATION"
export INPUT_TEXT_FRAME_DURATION="$TEXT_FRAME_DURATION"
export INPUT_ENDING_TEXT="$ENDING_TEXT"
export INPUT_FONT_SIZE="$FONT_SIZE"
export INPUT_COLOR_LEVELS="$COLOR_LEVELS"

echo "✨ Testing Blinking GitHub Action"
echo "================================="
echo "  User: $INPUT_GITHUB_USER_NAME"
echo "  Theme: $THEME"
echo "  Effect: $EFFECT"
echo "  Frame Duration: ${INPUT_FRAME_DURATION}s"
echo "  Transition Duration: ${INPUT_FADE_IN_DURATION}s"
echo "  Text Duration: ${INPUT_TEXT_FRAME_DURATION}s"
echo "  Ending Text: $INPUT_ENDING_TEXT"
echo "  Font Size: $INPUT_FONT_SIZE"
echo "  Cell Size: ${INPUT_CELL_SIZE}px (gap: ${INPUT_CELL_GAP}px)"
echo "  Colors: $INPUT_COLOR_LEVELS"
echo "  Output: $OUTPUT_FILE"
echo ""

# Check if blinking package exists and build it
BLINKING_DIR="packages/blinking-contrib"
if [ ! -d "$BLINKING_DIR" ]; then
    echo "❌ Error: Blinking package directory not found at $BLINKING_DIR"
    echo "   Please run this script from the repository root."
    exit 1
fi

echo "📦 Building blinking package..."
cd "$BLINKING_DIR"

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

# Run the blinking action
echo "🚀 Running blinking action..."
node dist/index.js

# Return to original directory
cd - > /dev/null

# Check if output was generated
if [ -f "$INPUT_OUTPUT_PATH" ]; then
  echo ""
  echo "✅ Blinking animation generated successfully!"
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
  if grep -q "animate" "$INPUT_OUTPUT_PATH"; then
    echo "🎬 Animation: Detected"
  else
    echo "⚠️  Animation: Not detected"
  fi

  # Check for text elements if ending text is specified
  if [ "$INPUT_ENDING_TEXT" != "" ] && grep -q "text\|rect.*class.*text" "$INPUT_OUTPUT_PATH"; then
    echo "📝 Text Elements: Detected"
  fi

  # Also create a "latest" symlink for quick access
  LATEST_LINK="$TEST_OUTPUT_DIR/blinking-latest.svg"
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