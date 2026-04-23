// ============================================================
// Input.js
// Tracks keyboard state. Separates "held" from "just pressed"
// so the player can detect single-frame presses (jump, attack).
// Also bootstraps Web Audio on the first keydown — browsers
// require a user gesture before AudioContext can start.
// ============================================================

import { audio } from "../systems/Audio.js";

export class Input {
  constructor() {
    this.keys = new Set();        // currently held
    this.justPressed = new Set(); // pressed this frame only

    window.addEventListener("keydown", (e) => {
      // First user gesture — safe to spin up the AudioContext
      audio.ensureInit();

      const k = e.key.toLowerCase();
      if (!this.keys.has(k)) this.justPressed.add(k);
      this.keys.add(k);

      // Prevent browser defaults that collide with game inputs:
      // space/arrows scroll the page; F5 reloads (races with F5-to-save);
      // F3 opens Firefox "Find next". F8 is listed for symmetry.
      if (
        [" ", "arrowup", "arrowdown", "arrowleft", "arrowright",
         "f3", "f5", "f8"].includes(k)
      ) {
        e.preventDefault();
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys.delete(e.key.toLowerCase());
    });

    // Clear keys when window loses focus (prevents stuck keys and
    // stale just-pressed events firing after Alt-Tab).
    window.addEventListener("blur", () => {
      this.keys.clear();
      this.justPressed.clear();
    });
  }

  isDown(...keys) {
    return keys.some((k) => this.keys.has(k.toLowerCase()));
  }

  wasPressed(...keys) {
    return keys.some((k) => this.justPressed.has(k.toLowerCase()));
  }

  // Called at end of frame to reset single-press state
  endFrame() {
    this.justPressed.clear();
  }
}
