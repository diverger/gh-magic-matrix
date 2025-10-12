#!/bin/bash
# Test script for jungle-adventurer

export INPUT_github_user_name="diverger"
export INPUT_color_scheme="jungle"
export INPUT_output_path="/tmp/jungle-test.svg"

echo "Testing jungle-adventurer with:"
echo "  User: $INPUT_github_user_name"
echo "  Color scheme: $INPUT_color_scheme"
echo "  Output: $INPUT_output_path"
echo ""

bun dist/jungle-adventurer/index.js

if [ -f "$INPUT_output_path" ]; then
  echo ""
  echo "✓ SVG generated successfully!"
  echo "File size: $(du -h "$INPUT_output_path" | cut -f1)"
else
  echo ""
  echo "✗ Failed to generate SVG"
  exit 1
fi
