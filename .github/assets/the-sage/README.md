The files are copyrighted by the original authors.

The recommended settings for these sprite sheet are:

```json
images: [
  {
    urlFolder: path.join(REPO_ROOT, ".github/assets/the-sage"),  // Absolute path to assets
    framePattern: "*_{n}.png",
    width: 192,
    height: 48,
    anchorY: 0.9,
    anchorX: 0.42,
    textAnchorY: 1.0,
    spacing: 0,
    sprite: {
      contributionLevels: 5,
      framesPerLevel: [14, 8, 4, 8, 8],  // Variable frames per level
      frameWidth: 192,
      frameHeight: 48,
      layout: "horizontal",
      useSpriteSheetPerLevel: true
      // Note: sprite speed is automatically synced with frameDuration (100ms)
    }
  }
]
```
