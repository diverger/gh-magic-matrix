#!/bin/bash
# Complete validation script for the snake action implementation
#
# Usage:
#   ./scripts/snake/validate-snake.sh
#
# This script performs comprehensive checks on the snake implementation

set -e

echo "🔍 Snake Action Validation"
echo "=========================="

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "packages/snake" ]; then
    echo "❌ Error: Please run this script from the repository root"
    exit 1
fi

SNAKE_DIR="packages/snake"
ERRORS=0

echo "📁 Checking file structure..."

# Check essential files
REQUIRED_FILES=(
    "$SNAKE_DIR/package.json"
    "$SNAKE_DIR/tsconfig.json"
    "$SNAKE_DIR/action.yml"
    "$SNAKE_DIR/README.md"
    "$SNAKE_DIR/src/index.ts"
    "$SNAKE_DIR/packages/types/snake.ts"
    "$SNAKE_DIR/packages/types/grid.ts"
    "$SNAKE_DIR/packages/types/point.ts"
    "$SNAKE_DIR/packages/solver/snake-solver.ts"
    "$SNAKE_DIR/packages/solver/pathfinder.ts"
    "$SNAKE_DIR/packages/solver/tunnel.ts"
    "$SNAKE_DIR/packages/solver/outside-grid.ts"
    "Dockerfile.snake"
    "snake/action.yml"
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
echo "🔧 Checking TypeScript configuration..."

cd "$SNAKE_DIR"

# Check package.json structure
if jq -e '.scripts.build' package.json > /dev/null 2>&1; then
    echo "  ✅ Build script configured"
else
    echo "  ❌ Build script missing in package.json"
    ERRORS=$((ERRORS + 1))
fi

# Check if TypeScript compiles
echo ""
echo "🔨 Testing Bun build..."

if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    bun install --silent
fi

if bun build src/index.ts --outdir dist --target node; then
    echo "  ✅ Bun build successful"

    # Check build outputs
    if [ -f "dist/index.js" ]; then
        echo "  ✅ Main entry point built"
    else
        echo "  ❌ Main entry point missing"
        ERRORS=$((ERRORS + 1))
    fi

    # Try to build test file too
    if [ -f "src/test.ts" ]; then
        if bun build src/test.ts --outdir dist --target node --silent; then
            echo "  ✅ Test file built"
        else
            echo "  ⚠️  Test file build failed (optional)"
        fi
    else
        echo "  ⚠️  Test file not found (optional)"
    fi
else
    echo "  ❌ Bun build failed"
    ERRORS=$((ERRORS + 1))
fi

cd - > /dev/null

echo ""
echo "📋 Checking action.yml files..."

# Check main action.yml
if grep -q "Snake GitHub Contribution Graph" "$SNAKE_DIR/action.yml"; then
    echo "  ✅ Snake action.yml has correct name"
else
    echo "  ❌ Snake action.yml name issue"
    ERRORS=$((ERRORS + 1))
fi

# Check Docker setup
echo ""
echo "🐳 Checking Docker configuration..."

if [ -f "Dockerfile.snake" ]; then
    if grep -q "packages/snake" "Dockerfile.snake"; then
        echo "  ✅ Dockerfile.snake references correct paths"
    else
        echo "  ⚠️  Dockerfile.snake may have path issues"
    fi
else
    echo "  ❌ Dockerfile.snake missing"
    ERRORS=$((ERRORS + 1))
fi

# Check workflow integration
echo ""
echo "🔄 Checking workflow integration..."

WORKFLOW_FILES=(
    ".github/workflows/ci.yml"
    ".github/workflows/test.yml"
    ".github/workflows/generate.yml"
    ".github/workflows/build-docker.yml"
    ".github/workflows/release.yml"
)

for workflow in "${WORKFLOW_FILES[@]}"; do
    if grep -q "snake" "$workflow" 2>/dev/null; then
        echo "  ✅ $workflow includes snake"
    else
        echo "  ❌ $workflow missing snake integration"
        ERRORS=$((ERRORS + 1))
    fi
done

# Summary
echo ""
echo "📊 Validation Summary"
echo "===================="

if [ $ERRORS -eq 0 ]; then
    echo "🎉 All checks passed! Snake action is ready for use."
    echo ""
    echo "Next steps:"
    echo "  1. Test locally: ./scripts/snake/test-snake.sh"
    echo "  2. Run unit tests: ./scripts/snake/test-snake-units.sh"
    echo "  3. Commit and push to trigger CI/CD"
    exit 0
else
    echo "❌ Found $ERRORS issue(s) that need to be fixed."
    echo ""
    echo "Please address the issues above before using the snake action."
    exit 1
fi