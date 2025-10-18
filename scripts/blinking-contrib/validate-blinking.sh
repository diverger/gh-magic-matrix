#!/bin/bash
# Complete validation script for the blinking-contrib action implementation
#
# Usage:
#   ./scripts/blinking-contrib/validate-blinking.sh
#
# This script performs comprehensive checks on the blinking implementation

set -e

echo "🔍 Blinking Action Validation"
echo "============================="

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "packages/blinking-contrib" ]; then
    echo "❌ Error: Please run this script from the repository root"
    exit 1
fi

BLINKING_DIR="packages/blinking-contrib"
ERRORS=0

echo "📁 Checking file structure..."

# Check essential files
REQUIRED_FILES=(
    "$BLINKING_DIR/package.json"
    "$BLINKING_DIR/tsconfig.json"
    "$BLINKING_DIR/src/index.ts"
    "$BLINKING_DIR/FONT_GUIDE.md"
    "blinking-contrib/action.yml"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (missing)"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
echo "🔧 Checking package configuration..."

cd "$BLINKING_DIR"

# Check package.json structure
if jq -e '.scripts.build' package.json > /dev/null 2>&1; then
    echo "  ✅ Build script configured"
else
    echo "  ❌ Build script missing in package.json"
    ERRORS=$((ERRORS + 1))
fi

# Check if TypeScript compiles
echo ""
echo "🔨 Testing build..."

if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install --silent
fi

if npm run build --silent; then
    echo "  ✅ Build successful"

    # Check build outputs
    if [ -f "dist/index.js" ]; then
        echo "  ✅ Main entry point built"
    else
        echo "  ❌ Main entry point missing"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "  ❌ Build failed"
    ERRORS=$((ERRORS + 1))
fi

cd - > /dev/null

echo ""
echo "📋 Checking action.yml..."

# Check main action.yml
if grep -q "Blinking" "blinking-contrib/action.yml"; then
    echo "  ✅ Blinking action.yml has correct name"
else
    echo "  ❌ Blinking action.yml name issue"
    ERRORS=$((ERRORS + 1))
fi

# Check for font configuration
if grep -q "font_size" "blinking-contrib/action.yml"; then
    echo "  ✅ Font configuration present"
else
    echo "  ❌ Font configuration missing"
    ERRORS=$((ERRORS + 1))
fi

# Check workflow integration
echo ""
echo "🔄 Checking workflow integration..."

WORKFLOW_FILES=(
    ".github/workflows/ci.yml"
    ".github/workflows/test.yml"
    ".github/workflows/generate.yml"
)

for workflow in "${WORKFLOW_FILES[@]}"; do
    if grep -q "blinking" "$workflow" 2>/dev/null; then
        echo "  ✅ $workflow includes blinking"
    else
        echo "  ❌ $workflow missing blinking integration"
        ERRORS=$((ERRORS + 1))
    fi
done

# Summary
echo ""
echo "📊 Validation Summary"
echo "===================="

if [ $ERRORS -eq 0 ]; then
    echo "🎉 All checks passed! Blinking action is ready for use."
    echo ""
    echo "Next steps:"
    echo "  1. Test smooth animation: ./scripts/blinking-contrib/test-blinking.sh dark smooth"
    echo "  2. Test fast blinking: ./scripts/blinking-contrib/test-blinking.sh light fast"
    echo "  3. Commit and push to trigger CI/CD"
    exit 0
else
    echo "❌ Found $ERRORS issue(s) that need to be fixed."
    echo ""
    echo "Please address the issues above before using the blinking action."
    exit 1
fi