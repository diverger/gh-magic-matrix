The files are copyrighted by the original authors.

The recommended settings for these sprite sheet are:

```json
images: [
  {
    urlFolder: path.join(REPO_ROOT, ".github/assets/the-tarnished-widow"),  // Absolute path to assets
    framePattern: "*_{n}.png",
    width: 104,
    height: 56,
    anchorY: 0.857,
    anchorX: 0.3,
    textAnchorY: 1.0,
    spacing: 0,
    sprite: {
      contributionLevels: 5,
      framesPerLevel: [19, 12, 12, 12, 12],  // Variable frames per level
      frameWidth: 208,
      frameHeight: 112,
      layout: "horizontal",
      useSpriteSheetPerLevel: true
      // Note: sprite speed is automatically synced with frameDuration (100ms)
    }
  }
]
```
