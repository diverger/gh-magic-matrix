#!/bin/bash
# Test script for jungle-adventurer

export INPUT_GITHUB_USER_NAME="diverger"
export INPUT_COLOR_SCHEME="jungle"
export INPUT_OUTPUT_PATH="/tmp/jungle-test.svg"

echo "Testing jungle-adventurer with:"
echo "  User: $INPUT_GITHUB_USER_NAME"
echo "  Color scheme: $INPUT_COLOR_SCHEME"
echo "  Output: $INPUT_OUTPUT_PATH"
echo ""

bun dist/jungle-adventurer/index.js

if [ -f "$INPUT_OUTPUT_PATH" ]; then
  echo ""
  echo "✓ SVG generated successfully!"
  echo "File size: $(du -h "$INPUT_OUTPUT_PATH" | cut -f1)"
else
  echo ""
  echo "✗ Failed to generate SVG"
  exit 1
fi
