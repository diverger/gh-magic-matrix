/**
 * Frame class represents a single frame in a sprite sheet, including its image, size, and anchor point.
 */
export class Frame {
    // Base64-encoded image data for this frame
    base64Image: string;

    // Width and height of the frame (cropped area)
    frameWidth: number;
    frameHeight: number;

    // Actual width and height of the sprite (may be larger than frame)
    spriteWidth: number;
    spriteHeight: number;

    // Anchor point (relative to the frame, e.g., for positioning or rotation)
    anchorX: number;
    anchorY: number;

    constructor(
        base64Image: string,
        frameWidth: number,
        frameHeight: number,
        spriteWidth: number,
        spriteHeight: number,
        anchorX: number = 0,
        anchorY: number = 0
    ) {
        this.base64Image = base64Image;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.spriteWidth = spriteWidth;
        this.spriteHeight = spriteHeight;
        this.anchorX = anchorX;
        this.anchorY = anchorY;
    }

    /** Get the anchor point as an object */
    getAnchor() {
        return { x: this.anchorX, y: this.anchorY };
    }

    /** Get the frame size as an object */
    getFrameSize() {
        return { width: this.frameWidth, height: this.frameHeight };
    }

    /** Get the sprite size as an object */
    getSpriteSize() {
        return { width: this.spriteWidth, height: this.spriteHeight };
    }
}