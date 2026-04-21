// ============================================================
// Physics.js
// Axis-aligned bounding-box (AABB) physics.
// - Applies gravity to entities
// - Resolves collisions against ground + platforms
// - Platforms are "one-way" (solid only from above)
// ============================================================

import { WORLD } from "../config/Constants.js";

export function aabbOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Apply gravity + resolve collisions against platform list.
 * Entity must have: x, y, width, height, vx, vy, onGround.
 * Platforms: { x, y, width, height, oneWay }
 */
export function applyPhysics(entity, platforms) {
  // ---- Gravity ----
  entity.vy += WORLD.GRAVITY;
  if (entity.vy > WORLD.MAX_FALL_SPEED) entity.vy = WORLD.MAX_FALL_SPEED;

  // ---- Horizontal movement + collision ----
  const prevX = entity.x;
  entity.x += entity.vx;

  for (const p of platforms) {
    if (p.oneWay) continue; // one-way platforms don't block horizontally
    if (aabbOverlap(entity, p)) {
      if (entity.vx > 0) entity.x = p.x - entity.width;
      else if (entity.vx < 0) entity.x = p.x + p.width;
      entity.vx = 0;
    }
  }

  // World bounds
  if (entity.x < 0) { entity.x = 0; entity.vx = 0; }
  if (entity.x + entity.width > WORLD.WIDTH) {
    entity.x = WORLD.WIDTH - entity.width;
    entity.vx = 0;
  }

  // ---- Vertical movement + collision ----
  const prevY = entity.y;
  entity.y += entity.vy;
  entity.onGround = false;

  for (const p of platforms) {
    if (!aabbOverlap(entity, p)) continue;

    // One-way: only collide if we were fully above on the previous frame
    if (p.oneWay) {
      const prevBottom = prevY + entity.height;
      if (entity.vy > 0 && prevBottom <= p.y + 1) {
        entity.y = p.y - entity.height;
        entity.vy = 0;
        entity.onGround = true;
      }
    } else {
      if (entity.vy > 0) {
        entity.y = p.y - entity.height;
        entity.vy = 0;
        entity.onGround = true;
      } else if (entity.vy < 0) {
        entity.y = p.y + p.height;
        entity.vy = 0;
      }
    }
  }

  // Hard floor fallback (in case entity falls off everything)
  if (entity.y + entity.height > WORLD.HEIGHT + 200) {
    entity.y = 0;
    entity.vy = 0;
  }
}
