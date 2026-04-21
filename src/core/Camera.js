// ============================================================
// Camera.js
// Smooth-follow camera with world bounds clamping.
// Apply camera.x / camera.y as a translate before rendering
// world-space entities.
// ============================================================

import { WORLD } from "../config/Constants.js";

export class Camera {
  constructor(viewW, viewH) {
    this.x = 0;
    this.y = 0;
    this.viewW = viewW;
    this.viewH = viewH;
    this.smoothing = 0.1; // higher = snappier
    // Per-map width; Game sets this whenever a map is loaded
    this.worldWidth = WORLD.WIDTH;
    // Small screen shake for hit impact
    this.shakeTime = 0;
    this.shakeMag = 0;
  }

  follow(target) {
    // Center the camera on the target horizontally, keep vertical fixed
    const targetX = target.x + target.width / 2 - this.viewW / 2;
    this.x += (targetX - this.x) * this.smoothing;

    // Clamp to world bounds
    const maxX = (this.worldWidth ?? WORLD.WIDTH) - this.viewW;
    this.x = Math.max(0, Math.min(this.x, maxX));
    this.y = 0;
  }

  shake(magnitude, frames) {
    this.shakeMag = Math.max(this.shakeMag, magnitude);
    this.shakeTime = Math.max(this.shakeTime, frames);
  }

  getOffset() {
    let sx = 0, sy = 0;
    if (this.shakeTime > 0) {
      sx = (Math.random() - 0.5) * this.shakeMag * 2;
      sy = (Math.random() - 0.5) * this.shakeMag * 2;
      this.shakeTime--;
      this.shakeMag *= 0.9;
    }
    return { x: Math.floor(this.x + sx), y: Math.floor(this.y + sy) };
  }
}
