// ============================================================
// Sprite.js
// Procedural pixel-art sprite generator + renderer.
// Instead of shipping PNGs, we paint sprites onto offscreen
// canvases at startup. This keeps the project self-contained.
// Swap generateSprites() with an image loader later.
//
// Each sprite is cached by key and can be drawn via drawSprite().
// Animation support: pass a frame index for sprites that
// have multiple frames (e.g. enemy walk cycles).
// ============================================================

const cache = new Map();

// ---------- Helpers ----------

function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return c;
}

// Pixel-art drawing helpers
function px(ctx, x, y, color, size = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
}

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

// ---------- Sprite generators ----------

function generatePlayerSprite(facing = 1, frame = 0) {
  // Frame 0 = idle, frame 1/2 = walk cycle
  const W = 32, H = 48;
  const c = makeCanvas(W, H);
  const ctx = c.getContext("2d");

  // Colors
  const SKIN = "#fcd7b0";
  const HAIR = "#3b2518";
  const BODY = "#4ea8ff";
  const BODY_DARK = "#2d78c8";
  const PANTS = "#2a3a5e";
  const BOOT = "#1a1a2a";

  // Head
  rect(ctx, 10, 4, 12, 10, SKIN);
  // Hair
  rect(ctx, 9, 3, 14, 4, HAIR);
  rect(ctx, 9, 7, 3, 3, HAIR);
  rect(ctx, 20, 7, 3, 3, HAIR);
  // Eyes
  if (facing === 1) {
    rect(ctx, 17, 9, 2, 2, "#000");
  } else {
    rect(ctx, 13, 9, 2, 2, "#000");
  }
  // Body
  rect(ctx, 9, 14, 14, 14, BODY);
  rect(ctx, 9, 26, 14, 2, BODY_DARK);
  // Arms (animated)
  const armOffset = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  rect(ctx, 6, 16 + armOffset, 4, 10, BODY);
  rect(ctx, 22, 16 - armOffset, 4, 10, BODY);
  // Legs
  const legSplit = frame === 1 ? 2 : frame === 2 ? -2 : 0;
  rect(ctx, 10, 28, 5, 14 + legSplit, PANTS);
  rect(ctx, 17, 28, 5, 14 - legSplit, PANTS);
  // Boots
  rect(ctx, 10, 42 + legSplit, 5, 4, BOOT);
  rect(ctx, 17, 42 - legSplit, 5, 4, BOOT);

  // Flip if facing left
  if (facing === -1) {
    const flipped = makeCanvas(W, H);
    const fctx = flipped.getContext("2d");
    fctx.translate(W, 0);
    fctx.scale(-1, 1);
    fctx.drawImage(c, 0, 0);
    return flipped;
  }
  return c;
}

function generateSlimeSprite(frame = 0) {
  const W = 36, H = 28;
  const c = makeCanvas(W, H);
  const ctx = c.getContext("2d");
  const BODY = "#6bdc6b";
  const DARK = "#3fa53f";
  const SHINE = "#c4f5c4";

  // Squish animation: frame 1 = flatter
  const squash = frame === 1 ? 3 : 0;

  // Body (rounded blob shape with pixel art)
  rect(ctx, 4, 8 + squash, W - 8, H - 10 - squash, BODY);
  rect(ctx, 2, 12 + squash, 2, H - 14 - squash, BODY);
  rect(ctx, W - 4, 12 + squash, 2, H - 14 - squash, BODY);
  rect(ctx, 6, 5 + squash, W - 12, 3, BODY);
  // Top shine
  rect(ctx, 10, 7 + squash, 3, 2, SHINE);
  rect(ctx, 14, 6 + squash, 2, 2, SHINE);
  // Darker bottom
  rect(ctx, 4, H - 4, W - 8, 2, DARK);
  // Eyes
  rect(ctx, 11, 13 + squash, 3, 4, "#000");
  rect(ctx, 22, 13 + squash, 3, 4, "#000");
  rect(ctx, 12, 13 + squash, 1, 2, "#fff");
  rect(ctx, 23, 13 + squash, 1, 2, "#fff");

  return c;
}

function generateMushroomSprite(frame = 0) {
  const W = 40, H = 40;
  const c = makeCanvas(W, H);
  const ctx = c.getContext("2d");
  const CAP = "#e07a5f";
  const CAP_DARK = "#a8503a";
  const STEM = "#f4e4c1";
  const STEM_DARK = "#c9b88a";

  const wobble = frame === 1 ? 1 : 0;

  // Cap
  rect(ctx, 4, 4 + wobble, W - 8, 14, CAP);
  rect(ctx, 2, 8 + wobble, 2, 8, CAP);
  rect(ctx, W - 4, 8 + wobble, 2, 8, CAP);
  rect(ctx, 6, 2 + wobble, W - 12, 2, CAP);
  // Cap spots
  rect(ctx, 10, 8 + wobble, 3, 3, "#fff0d0");
  rect(ctx, 22, 10 + wobble, 4, 3, "#fff0d0");
  rect(ctx, 17, 6 + wobble, 2, 2, "#fff0d0");
  // Cap shadow bottom
  rect(ctx, 4, 16 + wobble, W - 8, 2, CAP_DARK);
  // Stem
  rect(ctx, 10, 18 + wobble, W - 20, H - 22 - wobble, STEM);
  rect(ctx, 10, H - 4, W - 20, 2, STEM_DARK);
  // Eyes
  rect(ctx, 14, 22 + wobble, 3, 4, "#000");
  rect(ctx, 23, 22 + wobble, 3, 4, "#000");
  rect(ctx, 15, 22 + wobble, 1, 2, "#fff");
  rect(ctx, 24, 22 + wobble, 1, 2, "#fff");
  // Mouth
  rect(ctx, 18, 29 + wobble, 4, 1, "#000");

  return c;
}

function generateWolfSprite(facing = 1, frame = 0) {
  const W = 48, H = 34;
  const c = makeCanvas(W, H);
  const ctx = c.getContext("2d");
  const FUR = "#9a9a9a";
  const DARK = "#5a5a5a";
  const DARKER = "#3a3a3a";

  const legBob = frame === 1 ? 1 : 0;

  // Body
  rect(ctx, 8, 12, W - 16, 14, FUR);
  rect(ctx, 6, 14, 2, 10, FUR);
  rect(ctx, W - 8, 14, 2, 10, FUR);
  // Back
  rect(ctx, 10, 10, W - 20, 2, FUR);
  // Shading
  rect(ctx, 8, 24, W - 16, 2, DARK);
  // Head
  rect(ctx, W - 14, 8, 12, 12, FUR);
  rect(ctx, W - 4, 12, 2, 6, FUR);
  // Ears
  rect(ctx, W - 13, 5, 3, 4, DARK);
  rect(ctx, W - 7, 5, 3, 4, DARK);
  // Eye
  rect(ctx, W - 7, 12, 2, 2, "#f0c040");
  // Snout
  rect(ctx, W - 3, 14, 1, 2, DARKER);
  // Legs
  rect(ctx, 10, 26, 4, 7 + legBob, DARK);
  rect(ctx, 18, 26, 4, 7 - legBob, DARK);
  rect(ctx, W - 22, 26, 4, 7 - legBob, DARK);
  rect(ctx, W - 14, 26, 4, 7 + legBob, DARK);
  // Tail
  rect(ctx, 2, 12, 6, 3, FUR);
  rect(ctx, 0, 10, 3, 3, FUR);

  // Flip if facing left
  if (facing === -1) {
    const flipped = makeCanvas(W, H);
    const fctx = flipped.getContext("2d");
    fctx.translate(W, 0);
    fctx.scale(-1, 1);
    fctx.drawImage(c, 0, 0);
    return flipped;
  }
  return c;
}

function generateBossSprite(facing = 1, frame = 0, phase = 1) {
  const W = 96, H = 96;
  const c = makeCanvas(W, H);
  const ctx = c.getContext("2d");
  // Phase-based palette
  const base = phase >= 2 ? "#8b1e3f" : "#4b2058";
  const dark = phase >= 2 ? "#5a1229" : "#2a0f35";
  const accent = phase >= 2 ? "#ff4060" : "#c040ff";
  const eye = phase >= 2 ? "#ffd040" : "#ff8040";

  const bob = frame === 1 ? 1 : 0;

  // Shadow / aura
  ctx.fillStyle = accent + "40";
  ctx.fillRect(0, 8, W, H - 8);

  // Main body
  rect(ctx, 16, 20 + bob, W - 32, H - 36 - bob, base);
  rect(ctx, 12, 24 + bob, 4, H - 44, base);
  rect(ctx, W - 16, 24 + bob, 4, H - 44, base);
  // Shoulders / spikes
  rect(ctx, 10, 16 + bob, 8, 8, dark);
  rect(ctx, W - 18, 16 + bob, 8, 8, dark);
  rect(ctx, 8, 12 + bob, 4, 4, accent);
  rect(ctx, W - 12, 12 + bob, 4, 4, accent);
  // Head
  rect(ctx, 28, 12 + bob, W - 56, 18, dark);
  rect(ctx, 32, 10 + bob, W - 64, 4, dark);
  // Horns
  rect(ctx, 28, 4 + bob, 6, 10, accent);
  rect(ctx, W - 34, 4 + bob, 6, 10, accent);
  rect(ctx, 30, 0 + bob, 4, 6, accent);
  rect(ctx, W - 34, 0 + bob, 4, 6, accent);
  // Eyes (glowing)
  rect(ctx, 36, 18 + bob, 6, 5, eye);
  rect(ctx, W - 42, 18 + bob, 6, 5, eye);
  rect(ctx, 38, 19 + bob, 2, 2, "#fff");
  rect(ctx, W - 40, 19 + bob, 2, 2, "#fff");
  // Mouth
  rect(ctx, 38, 26 + bob, W - 76, 2, "#000");
  // Chest core
  rect(ctx, W / 2 - 6, 40 + bob, 12, 12, accent);
  rect(ctx, W / 2 - 4, 42 + bob, 8, 8, "#fff");
  // Legs
  rect(ctx, 22, H - 16, 12, 14, dark);
  rect(ctx, W - 34, H - 16, 12, 14, dark);

  if (facing === -1) {
    const flipped = makeCanvas(W, H);
    const fctx = flipped.getContext("2d");
    fctx.translate(W, 0);
    fctx.scale(-1, 1);
    fctx.drawImage(c, 0, 0);
    return flipped;
  }
  return c;
}

function generatePortalSprite(frame = 0) {
  const W = 48, H = 72;
  const c = makeCanvas(W, H);
  const ctx = c.getContext("2d");

  const inner = frame === 1 ? "#c0a0ff" : "#a080ff";
  const outer = "#6040c0";
  const glow = "#e0c0ff";

  // Outer ring
  rect(ctx, 4, 8, W - 8, H - 16, outer);
  rect(ctx, 2, 12, 2, H - 24, outer);
  rect(ctx, W - 4, 12, 2, H - 24, outer);
  rect(ctx, 8, 4, W - 16, 4, outer);
  rect(ctx, 8, H - 8, W - 16, 4, outer);

  // Inner swirl
  rect(ctx, 8, 12, W - 16, H - 24, inner);
  rect(ctx, 6, 16, 2, H - 32, inner);
  rect(ctx, W - 8, 16, 2, H - 32, inner);

  // Swirl lines (animate via frame)
  const swirl = frame === 1 ? 2 : -2;
  rect(ctx, 12, 20 + swirl, W - 24, 2, glow);
  rect(ctx, 16, 32 + swirl, W - 32, 2, glow);
  rect(ctx, 14, 44 + swirl, W - 28, 2, glow);
  rect(ctx, 18, 56 + swirl, W - 36, 2, glow);

  return c;
}

// ---------- Public API ----------

export function generateSprites() {
  // Player: idle + 2 walk frames, each direction
  cache.set("player_right_0", generatePlayerSprite(1, 0));
  cache.set("player_right_1", generatePlayerSprite(1, 1));
  cache.set("player_right_2", generatePlayerSprite(1, 2));
  cache.set("player_left_0",  generatePlayerSprite(-1, 0));
  cache.set("player_left_1",  generatePlayerSprite(-1, 1));
  cache.set("player_left_2",  generatePlayerSprite(-1, 2));

  // Enemies
  cache.set("slime_0", generateSlimeSprite(0));
  cache.set("slime_1", generateSlimeSprite(1));
  cache.set("mushroom_0", generateMushroomSprite(0));
  cache.set("mushroom_1", generateMushroomSprite(1));
  cache.set("wolf_right_0", generateWolfSprite(1, 0));
  cache.set("wolf_right_1", generateWolfSprite(1, 1));
  cache.set("wolf_left_0",  generateWolfSprite(-1, 0));
  cache.set("wolf_left_1",  generateWolfSprite(-1, 1));

  // Boss (two phases)
  cache.set("boss_right_p1_0", generateBossSprite(1, 0, 1));
  cache.set("boss_right_p1_1", generateBossSprite(1, 1, 1));
  cache.set("boss_left_p1_0",  generateBossSprite(-1, 0, 1));
  cache.set("boss_left_p1_1",  generateBossSprite(-1, 1, 1));
  cache.set("boss_right_p2_0", generateBossSprite(1, 0, 2));
  cache.set("boss_right_p2_1", generateBossSprite(1, 1, 2));
  cache.set("boss_left_p2_0",  generateBossSprite(-1, 0, 2));
  cache.set("boss_left_p2_1",  generateBossSprite(-1, 1, 2));

  // Portal
  cache.set("portal_0", generatePortalSprite(0));
  cache.set("portal_1", generatePortalSprite(1));
}

export function getSprite(key) { return cache.get(key) || null; }

export function drawSprite(ctx, key, x, y, w, h) {
  const img = cache.get(key);
  if (!img) {
    // Fallback: visible magenta rect so missing sprites are obvious
    ctx.fillStyle = "#f0f";
    ctx.fillRect(x, y, w, h);
    return;
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, x, y, w, h);
}
