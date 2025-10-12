# Jungle Adventurer Sprites

这个目录用于存放 Jungle Adventurer 的 sprite sheet 素材。

## 📋 素材规格

### Sprite Sheet 要求
- **格式**: PNG（推荐带透明背景）
- **帧数**: 8 帧
- **单帧尺寸**: 48 × 64 像素
- **布局**: 水平排列（推荐）或垂直排列
- **总尺寸**:
  - 水平: 384 × 64 像素
  - 垂直: 48 × 512 像素

### Sprite 内容尺寸
- **实际角色大小**: 16 × 32 像素（在 48×64 帧内居中）
- **留白**: 每帧四周应有适当留白，方便动画

## 📂 应该放置的文件

```
assets/sprites/
├── hero_run.png      # 跑动动画（必需）
├── hero_walk.png     # 走动动画（可选）
├── hero_shoot.png    # 射击动画（可选）
└── README.md         # 本文件
```

## 🎯 推荐的位置

**正确的位置** ✅：
```
packages/jungle-adventurer/
└── assets/
    └── sprites/
        ├── hero_run.png      ← 你的跑动素材放这里
        ├── hero_shoot.png    ← 你的射击素材放这里
        └── README.md
```

**完整路径**：
```
/home/diverger/work/magic-matrix/gh-magic-matrix/packages/jungle-adventurer/assets/sprites/
```

## 📥 如何添加你的素材

### 方法 1: 命令行
```bash
# 进入 jungle-adventurer 目录
cd packages/jungle-adventurer

# 复制你的 sprite sheets
cp /path/to/your/hero_run.png assets/sprites/
cp /path/to/your/hero_shoot.png assets/sprites/
```

### 方法 2: 直接拖拽
在文件管理器中：
1. 打开 `packages/jungle-adventurer/assets/sprites/`
2. 把你的 PNG 文件拖进去

### 方法 3: Git 提交
```bash
git add packages/jungle-adventurer/assets/
git commit -m "Add sprite sheets"
git push
```

## 🔍 验证素材

```bash
# 检查文件
ls -lh packages/jungle-adventurer/assets/sprites/

# 验证尺寸
file packages/jungle-adventurer/assets/sprites/hero_run.png
# 应该显示: PNG image data, 384 x 64, 8-bit/color RGBA
```

## 🎯 在代码中引用

在 `src/action.ts` 中，素材路径是相对于包目录的：

```typescript
// 本地开发
const spritePath = path.join(__dirname, '../assets/sprites/hero_run.png');

// 或使用环境变量
const spritePath = process.env.SPRITE_RUN ||
                   path.join(__dirname, '../assets/sprites/hero_run.png');
```

在 workflow 中：

```yaml
- uses: diverger/gh-magic-matrix/jungle-adventurer@main
  with:
    # 相对于仓库根目录
    sprite_run: 'packages/jungle-adventurer/assets/sprites/hero_run.png'

    # 或者如果素材在用户仓库中
    sprite_run: 'my-sprites/hero_run.png'
```

## 💡 内置默认素材（可选）

你可以提供一些默认素材：

```
assets/
├── sprites/
│   ├── default_hero_run.png      # 默认素材
│   ├── default_hero_shoot.png
│   └── README.md
└── examples/                      # 示例素材
    ├── ninja_run.png
    ├── knight_run.png
    └── README.md
```

这样用户可以：
1. 使用默认素材快速开始
2. 参考示例制作自己的素材
3. 替换为自定义素材

## 📚 相关文档

- **快速开始**: `../../QUICK_START.md`
- **详细使用**: `../../SPRITE_USAGE.md`
- **可视化指南**: `../../VISUAL_GUIDE.md`

---

**现在就把你的 sprite sheets 放到这个目录，开始创造你的冒险动画吧！** 🎮✨
