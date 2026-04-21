// ============================================================
// main.js
// Entry point. Boots the Game on the canvas element.
// ============================================================

import { Game } from "./core/Game.js";
import { generateSprites } from "./systems/Sprite.js";
import { validateConfigs } from "./systems/ConfigValidation.js";

// Build all procedural sprites to offscreen canvases.
// MUST run before any entity tries to render.
generateSprites();
validateConfigs();

const canvas = document.getElementById("game");
const game = new Game(canvas);
game.start();

// Expose for debugging in console
window.__game = game;
