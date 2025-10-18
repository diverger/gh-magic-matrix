import type { Point } from "./point";

/**
 * Sprite class for handling PNG sprite sheets with 8 frames in one row.
 */
export class Sprite {
	imagePath: string; // Path or URL to the PNG file
	frameWidth: number;
	frameHeight: number;
	frameCount: number;
	currentFrame: number;

	// Grid position (cell coordinates)
	gridX: number;
	gridY: number;

	// Pixel position (absolute coordinates)
	pixelX: number;
	pixelY: number;

	constructor(
		imagePath: string,
		frameWidth: number,
		frameHeight: number,
		frameCount: number = 8,
		gridX: number = 0,
		gridY: number = 0,
		pixelX: number = 0,
		pixelY: number = 0
	) {
		this.imagePath = imagePath;
		this.frameWidth = frameWidth;
		this.frameHeight = frameHeight;
		this.frameCount = frameCount;
		this.currentFrame = 0;
		this.gridX = gridX;
		this.gridY = gridY;
		this.pixelX = pixelX;
		this.pixelY = pixelY;
	}

	/** Advance to the next frame (loops back to 0) */
	nextFrame() {
		this.currentFrame = (this.currentFrame + 1) % this.frameCount;
	}

	/** Set the current frame index */
	setFrame(frame: number) {
		if (frame >= 0 && frame < this.frameCount) {
			this.currentFrame = frame;
		}
	}

	/** Get the source rectangle for the current frame */
	getFrameRect() {
		return {
			x: this.currentFrame * this.frameWidth,
			y: 0,
			width: this.frameWidth,
			height: this.frameHeight,
		};
	}

	/** Set grid position */
	setGridPosition(x: number, y: number) {
		this.gridX = x;
		this.gridY = y;
	}

	/** Set pixel position */
	setPixelPosition(x: number, y: number) {
		this.pixelX = x;
		this.pixelY = y;
	}

	/** Get grid position */
	getGridPosition() {
		return { x: this.gridX, y: this.gridY };
	}

	/** Get pixel position */
	getPixelPosition() {
		return { x: this.pixelX, y: this.pixelY };
	}

	// Add rendering logic as needed for your environment (e.g., canvas, SVG, etc.)
}
