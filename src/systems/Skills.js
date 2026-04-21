// ============================================================
// Skills.js
// Manages skill cooldowns and executes skill effects.
// Each skill:
//   - Reserves MP (checked before cast)
//   - Spawns visual effects / projectiles
//   - Deals damage via the Combat system
// ============================================================

import { SKILLS } from "../config/Constants.js";
import { Projectile } from "../entities/Projectile.js";
import { ShockwaveEffect, DashStreakEffect } from "../entities/Effect.js";
import { DamageNumber } from "../entities/DamageNumber.js";
import { COMBAT } from "../config/Constants.js";
import { audio } from "./Audio.js";

export class SkillSystem {
  constructor() {
    // Unlocked skills — new characters start with DASH_SLASH & PROJECTILE
    this.unlocked = new Set(["dash_slash", "projectile"]);
    this.cooldowns = {}; // id -> remaining frames
    for (const k of Object.keys(SKILLS)) this.cooldowns[SKILLS[k].id] = 0;
  }

  tick() {
    for (const id in this.cooldowns) {
      if (this.cooldowns[id] > 0) this.cooldowns[id]--;
    }
  }

  isReady(id) {
    return this.unlocked.has(id) && (this.cooldowns[id] || 0) <= 0;
  }

  unlock(id) { this.unlocked.add(id); }

  // Try to cast a skill by id. Returns true if cast succeeded.
  tryCast(id, ctx) {
    const def = Object.values(SKILLS).find((s) => s.id === id);
    if (!def) return false;
    if (!this.isReady(id)) return false;
    if (ctx.player.mp < def.mpCost) return false;

    ctx.player.mp -= def.mpCost;
    this.cooldowns[id] = def.cooldown;

    // Dispatch to handler
    switch (id) {
      case "dash_slash":  return this.#dashSlash(def, ctx);
      case "aoe_slam":    return this.#aoeSlam(def, ctx);
      case "projectile":  return this.#projectile(def, ctx);
    }
    return false;
  }

  // -------- Skill implementations --------

  #dashSlash(def, { player, enemies, boss, damageNumbers, effects, particles, camera, game }) {
    const facing = player.facing;
    const startX = player.x;
    const targetX = player.x + facing * def.dashDistance;

    // Apply dash velocity (consumes a few frames of control)
    player.vx = facing * (def.dashDistance / def.dashFrames);
    player.invuln = Math.max(player.invuln, def.dashFrames + 4);

    // Streak visual
    effects.push(new DashStreakEffect(
      Math.min(startX, targetX), player.y + 8,
      Math.abs(def.dashDistance), player.height - 16, def.color
    ));

    audio.skillCast("dash");

    // Damage a horizontal strip along the dash
    const dmg = Math.round(player.damage * def.damageMult * (player.skillDamageMult || 1));
    const strip = {
      x: Math.min(startX, targetX),
      y: player.y + 4,
      width: Math.abs(def.dashDistance) + player.width,
      height: player.height - 8,
    };
    this.#damageInBox(strip, enemies, boss, dmg, player, damageNumbers, particles, camera, game);

    return true;
  }

  #aoeSlam(def, { player, enemies, boss, damageNumbers, effects, particles, camera, game }) {
    const cx = player.x + player.width / 2;
    const cy = player.y + player.height;

    effects.push(new ShockwaveEffect(cx, cy, def.radius, def.color));
    particles.spawn(cx, cy, {
      count: 14, color: def.color,
      speedMin: 2, speedMax: 6, life: 26, size: 4, gravity: 0.2,
    });

    audio.skillCast("slam");

    const dmg = Math.round(player.damage * def.damageMult * (player.skillDamageMult || 1));

    // Build list of all potential targets for unified logic
    const targets = enemies.filter((e) => !e.dead);
    if (boss && !boss.dead) targets.push(boss);

    for (const e of targets) {
      const ex = e.x + e.width / 2;
      const ey = e.y + e.height / 2;
      const d = Math.hypot(ex - cx, ey - cy);
      if (d <= def.radius) {
        const isCrit = Math.random() < player.critChance;
        const final = Math.round(dmg * (isCrit ? COMBAT.CRIT_MULTIPLIER : 1));
        e.takeDamage(final, cx);
        damageNumbers.push(new DamageNumber(ex, e.y - 4, final, isCrit));
        particles.spawn(ex, ey, { count: 5, color: "#fff", speedMin: 1, speedMax: 3, life: 18, size: 2 });
        if (isCrit) audio.crit(); else audio.hit();
        if (e.dead) {
          audio.enemyDie();
          if (game) game.onEnemyKilled(e);
        }
      }
    }
    camera.shake(8, 14);
    game?.triggerHitstop(COMBAT.HITSTOP_FRAMES + 2);
    return true;
  }

  #projectile(def, { player, projectiles, particles }) {
    const facing = player.facing;
    const px = facing === 1 ? player.x + player.width : player.x - 16;
    const py = player.y + player.height / 2 - 4;
    const dmg = Math.round(player.damage * def.damageMult * (player.skillDamageMult || 1));
    projectiles.push(new Projectile(
      px, py, facing * def.projectileSpeed, dmg, def.projectileLife, def.color
    ));
    particles.spawn(px + 8, py + 4, {
      count: 5, color: def.color, speedMin: 1, speedMax: 3, life: 14, size: 2,
    });
    audio.skillCast("projectile");
    return true;
  }

  // Shared helper: apply damage to enemies + boss whose AABB overlaps `box`
  #damageInBox(box, enemies, boss, baseDmg, player, damageNumbers, particles, camera, game) {
    const hit = new Set();
    const targets = enemies.filter((e) => !e.dead);
    if (boss && !boss.dead) targets.push(boss);

    for (const e of targets) {
      if (hit.has(e)) continue;
      const overlap =
        e.x < box.x + box.width &&
        e.x + e.width > box.x &&
        e.y < box.y + box.height &&
        e.y + e.height > box.y;
      if (overlap) {
        const isCrit = Math.random() < player.critChance;
        const final = Math.round(baseDmg * (isCrit ? COMBAT.CRIT_MULTIPLIER : 1));
        e.takeDamage(final, player.x + player.width / 2);
        damageNumbers.push(new DamageNumber(e.x + e.width / 2, e.y - 4, final, isCrit));
        particles.spawn(e.x + e.width / 2, e.y + e.height / 2, {
          count: 5, color: "#fff", speedMin: 1, speedMax: 3, life: 16, size: 2,
        });
        hit.add(e);
        if (isCrit) audio.crit(); else audio.hit();
        if (e.dead) {
          audio.enemyDie();
          if (game) game.onEnemyKilled(e);
        }
      }
    }
    if (hit.size > 0) camera.shake(4, 8);
  }

  serialize() {
    return {
      unlocked: [...this.unlocked],
    };
  }
  load(data) {
    if (!data) return;
    this.unlocked = new Set(data.unlocked || ["dash_slash", "projectile"]);
  }
}
