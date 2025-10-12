#!/bin/bash
# Test script for jungle-adventurer

# Create test-outputs directory if it doesn't exist
TEST_OUTPUT_DIR="$(pwd)/test-outputs"
mkdir -p "$TEST_OUTPUT_DIR"

# Generate filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="$TEST_OUTPUT_DIR/jungle-adventurer-$TIMESTAMP.svg"

export INPUT_GITHUB_USER_NAME="diverger"
# export INPUT_COLOR_SCHEME="jungle"  # Commented out to test default (github-light)
export INPUT_OUTPUT_PATH="$OUTPUT_FILE"

echo "Testing jungle-adventurer with:"
echo "  User: $INPUT_GITHUB_USER_NAME"
echo "  Color scheme: (default - github-light)"
echo "  Output: $OUTPUT_FILE"
echo ""

bun dist/jungle-adventurer/index.js

if [ -f "$INPUT_OUTPUT_PATH" ]; then
  echo ""
  echo "✓ SVG generated successfully!"
  echo "📁 Saved to: $OUTPUT_FILE"
  echo "📊 File size: $(du -h "$INPUT_OUTPUT_PATH" | cut -f1)"

  # Also create a "latest" symlink for quick access
  LATEST_LINK="$TEST_OUTPUT_DIR/jungle-adventurer-latest.svg"
  ln -sf "$(basename "$OUTPUT_FILE")" "$LATEST_LINK"
  echo "🔗 Latest: $LATEST_LINK"
else
  echo ""
  echo "✗ Failed to generate SVG"
  exit 1
fi
