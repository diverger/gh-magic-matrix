# Snake Test Scripts

This directory contains test and verification scripts for the Snake contribution graph.

## 🧪 Main Test Suite

### test-all-mode-combinations.ts
**Complete test suite** with 9 test configurations covering all position mode × time mode combinations.

```bash
bun scripts/snake/test-all-mode-combinations.ts
```

**Test Configurations**:
1. `free-sync` - Uniform movement + frame advance per step (uses `index`, no sliding)
2. `free-loop-spritesheet` - Uniform movement + independent loop (sprite sheet, 8 frames)
3. `free-loop-multifile-time` - Uniform movement + time-based loop (may skip frames)
4. `free-loop-multifile-smooth` - Uniform movement + index-based loop (no frame skipping)
5. `free-level` - Uniform movement + L0-L4 level switching
6. `follow-level` - Follow progress bar + L0-L4 level switching
7. `follow-sync` - Follow progress bar + sync frame advance (uses `contributionCellsEaten`)
8. `top-left-sync` - Fixed position + sync frame advance
9. `multi-display-combo` - Multiple counter combination showcase

**Output**: `test-outputs/*.svg` (9 files, ~8 MB estimated; measured on 2025-11-01)

> ⚠️ **Note**: Size is an estimate and may vary. Run tests to verify current disk usage.

---

## 🎨 Emoji Snake Test Suite

### test-emoji-snake.ts
**Emoji snake test suite** with 9 emoji configurations showcasing different emoji themes.

```bash
bun scripts/snake/test-emoji-snake.ts
```

**Test Configurations**:
1. `default-emoji` - Default emoji (🐍 head, 🟢 body)
2. `rainbow-snake` - Rainbow colored emoji (🐍 🔴 🟠 🟡 🟢 🔵 🟣)
3. `fire-dragon` - Fire dragon theme (🐲 🔥)
4. `starry-snake` - Starry space theme with cycling stars (⭐ ✨ 💫 🌟)
5. `food-chain` - Food chain theme (🍎 🍊 🍋 🍇 🍓)
6. `heart-gradient` - Heart gradient theme (❤️ 🧡 💛 💚 💙 💜)
7. `space-snake` - Space theme (🌍 🌙 ⭐ 🪐 🌟 ☄️)
8. `gradient-circles` - Gradient circles (🟢 🟡 ⚪)
9. `traditional-rect` - Traditional rectangles (for comparison)

**Output**: `test-outputs/emoji-snake/*.svg` (9 files)

**Features**:
- Array-based emoji configuration
- Function-based dynamic emoji generation
- Comparison with traditional rectangle mode
- Full GitHub README compatibility

---

## 🌈 Colorful Snake Test Suite

### test-colorful-snake.ts
**Per-segment color test suite** with 9 configurations showcasing different color patterns for traditional snake rendering.

```bash
bun scripts/snake/test-colorful-snake.ts
```

**Test Configurations**:
1. `rainbow-segments` - Rainbow colored segments (array)
2. `gradient-purple-pink` - Purple to pink gradient (function)
3. `hue-rotation` - Full HSL hue rotation (function)
4. `fire-gradient` - Fire gradient from yellow to red (function)
5. `ocean-gradient` - Ocean gradient from cyan to blue (function)
6. `traffic-light` - Repeating red/yellow/green pattern (function)
7. `fade-to-transparent` - Fading opacity (function)
8. `neon-alternating` - Alternating neon colors (array)
9. `default-single-color` - Single color (for comparison)

**Output**: `test-outputs/colorful-snake/*.svg` (9 files)

**Features**:
- Array-based color configuration
- Function-based dynamic color generation
- Gradient effects (linear, hue rotation, fade)
- Pattern effects (traffic light, alternating)
- Comparison with single-color mode

---

## ✅ Verification Scripts

### verify-sync-logic.ts
Verifies the frame advance logic for **free-sync mode**.

```bash
bun scripts/snake/verify-sync-logic.ts
```

**Verification**:
- Checks if frame advances every step (uses `index`)
- Detects sliding phenomenon (X position changes but frame stays same)
- Expected result: 0% sliding rate

---

### verify-follow-sync.ts
Verifies the frame advance logic for **follow-sync mode**.

```bash
bun scripts/snake/verify-follow-sync.ts
```

**Verification**:
- Checks if frame advances only on colored cells (uses `contributionCellsEaten`)
- Verifies frame pauses when progress bar pauses
- Expected result: 0 sliding instances, perfect sync between progress bar and animation

---

## 📊 Analysis Scripts

### compare-loop-modes.ts
Compares the performance of two **loop mode** implementations.

```bash
bun scripts/snake/compare-loop-modes.ts
```

**Comparison**:
- **Time-based** (uses `fps` parameter): Time-based calculation, may skip frames
- **Index-based** (uses `loopSpeed` parameter): Index-based calculation, no frame skipping

**Performance Metrics**:
- Frame distribution uniformity (standard deviation)
- Frame usage frequency statistics
- Recommends index-based (loopSpeed) for smoother animation

---

### check-frame-distribution.ts
Checks the **frame distribution uniformity** of sprite animation.

```bash
bun scripts/snake/check-frame-distribution.ts
```

**Analysis**:
- Counts usage frequency for each frame
- Calculates distribution standard deviation and coefficient of variation
- Detects frame jumping or duplicate usage

---

## 📝 Usage Guide

### Quick Testing
```bash
# Run complete test suite
bun scripts/snake/test-all-mode-combinations.ts

# Verify free-sync mode
bun scripts/snake/verify-sync-logic.ts

# Verify follow-sync mode
bun scripts/snake/verify-follow-sync.ts
```

### Performance Analysis
```bash
# Compare loop mode performance
bun scripts/snake/compare-loop-modes.ts

# Check frame distribution
bun scripts/snake/check-frame-distribution.ts
```

### View Results
Generated SVG files are in the `test-outputs/` directory and can be opened directly in a browser to view the animations.

---

## 🎯 Key Concepts

### Position Modes
- **free**: Uniform movement from left to right (`x = t * width`)
- **follow**: Follow progress bar head
- **top-left/top-right/bottom-left/bottom-right**: Fixed positions

### Time Modes
- **sync**: Synchronized frame advance
  - Free mode: Uses `index` (advance every step)
  - Follow mode: Uses `contributionCellsEaten` (advance only on colored cells)
- **loop**: Independent loop animation
  - Time-based: Uses `fps` parameter
  - Index-based: Uses `loopSpeed` parameter (recommended)
- **level**: Switch between L0-L4 levels based on contribution value

### Sliding Phenomenon
When position moves but frame stays the same, the sprite appears to "slide".

- **Free-sync**: Uses `index` to prevent sliding
- **Follow-sync**: Uses `contributionCellsEaten`, animation pauses when progress bar pauses (correct behavior)

---
