The files are copyrighted by the original authors.

The recommended settings for these sprite sheet are:

```json
images: [
  {
    urlFolder: path.join(REPO_ROOT, ".github/assets/sci-fi-samurai"),  // Absolute path to assets
    framePattern: "*_{n}.png",
    width: 192,
    height: 64,
    anchorY: 1,
    anchorX: 0.5,
    textAnchorY: 1.0,
    spacing: 0,
    sprite: {
      contributionLevels: 5,
      framesPerLevel: [19, 8, 8, 8, 8],  // Variable frames per level
      frameWidth: 192,
      frameHeight: 64,
      layout: "horizontal",
      useSpriteSheetPerLevel: true
    }
  }
]
```
