#!/bin/bash
# Complete validation script for the breathing-contrib action implementation
#
# Usage:
#   ./scripts/breathing-contrib/validate-breathing.sh
#
# This script performs comprehensive checks on the breathing implementation

set -e

echo "🔍 Breathing Action Validation"
echo "=============================="

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "packages/breathing-contrib" ]; then
    echo "❌ Error: Please run this script from the repository root"
    exit 1
fi

set +e

BREATHING_DIR="packages/breathing-contrib"
ERRORS=0

echo "📁 Checking file structure..."

# Check essential files
REQUIRED_FILES=(
    "$BREATHING_DIR/package.json"
    "$BREATHING_DIR/tsconfig.json"
    "$BREATHING_DIR/src/index.ts"
    "$BREATHING_DIR/action.yml"
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

cd "$BREATHING_DIR"

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
if grep -q "Breathing" "$BREATHING_DIR/action.yml"; then
    echo "  ✅ Breathing action.yml has correct name"
else
    echo "  ❌ Breathing action.yml name issue"
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
    if grep -q "breathing" "$workflow" 2>/dev/null; then
        echo "  ✅ $workflow includes breathing"
    else
        echo "  ❌ $workflow missing breathing integration"
        ERRORS=$((ERRORS + 1))
    fi
done

# Summary
echo ""
echo "📊 Validation Summary"
echo "===================="

if [ $ERRORS -eq 0 ]; then
    echo "🎉 All checks passed! Breathing action is ready for use."
    echo ""
    echo "Next steps:"
    echo "  1. Test locally: ./scripts/breathing-contrib/test-breathing.sh"
    echo "  2. Commit and push to trigger CI/CD"
    exit 0
else
    echo "❌ Found $ERRORS issue(s) that need to be fixed."
    echo ""
    echo "Please address the issues above before using the breathing action."
    exit 1
fi