// ============================================================
// Combat.js
// Resolves the player's melee hitbox + projectiles against
// enemies AND the boss. Responsibilities:
//   - One hit per target per swing
//   - Combo finisher + jump-attack multipliers
//   - Crit rolls
//   - Damage numbers + hit-spark particles + sounds
//   - Camera shake + hitstop freeze
//   - onKill callback for XP / loot / boss-cleanup
// ============================================================

import { aabbOverlap } from "./Physics.js";
import { DamageNumber } from "../entities/DamageNumber.js";
import { COMBAT, PARTICLES } from "../config/Constants.js";
import { audio } from "./Audio.js";

/**
 * Build a list of all currently-alive damageable targets.
 * Currently: enemies + boss (if present).
 */
function gatherTargets(enemies, boss) {
  const list = enemies.filter((e) => !e.dead);
  if (boss && !boss.dead) list.push(boss);
  return list;
}

export function resolvePlayerAttacks(
  player, enemies, damageNumbers, camera, particles, game, onKill, boss = null
) {
  if (!player.hitbox || player.attackActive <= 0) return;

  let anyHit = false;
  let anyCrit = false;
  let anyKill = false;

  const targets = gatherTargets(enemies, boss);

  for (const target of targets) {
    if (player.hitEnemiesThisSwing.has(target)) continue;

    if (aabbOverlap(player.hitbox, target)) {
      const isCrit = Math.random() < player.critChance;
      const attackMult = player.getAttackMultiplier();
      const critMult = isCrit ? COMBAT.CRIT_MULTIPLIER : 1;
      const variance = 0.9 + Math.random() * 0.2;

      const dmg = Math.max(1, Math.round(
        player.damage * attackMult * critMult * variance
      ));

      target.takeDamage(dmg, player.x + player.width / 2);
      player.hitEnemiesThisSwing.add(target);

      damageNumbers.push(
        new DamageNumber(target.x + target.width / 2, target.y - 4, dmg, isCrit)
      );

      const dir = player.facing;
      particles.spawn(target.x + target.width / 2, target.y + target.height / 2, {
        count: PARTICLES.HIT_SPARK_COUNT,
        color: isCrit ? "#ffd23f" : "#ffffff",
        speedMin: 2, speedMax: 5,
        life: 18, size: isCrit ? 4 : 3,
        gravity: 0.12,
        angle: dir === 1 ? 0 : Math.PI,
        spread: Math.PI * 0.9,
      });

      // Audio — per-hit so rapid hits produce rapid sounds
      if (isCrit) audio.crit(player.isFinisher ? 1 : 0);
      else audio.hit(player.isFinisher ? 1 : 0);

      anyHit = true;
      if (isCrit) anyCrit = true;

      if (target.dead) {
        anyKill = true;
        audio.enemyDie(player.isFinisher ? 1 : 0);
        if (onKill) onKill(target);
      }
    }
  }

  if (anyHit) {
    const base = player.isFinisher ? 6 : 2;
    const duration = anyKill ? 14 : anyCrit ? 10 : 6;
    camera.shake(anyCrit ? base + 2 : base, duration);
    let stop = anyCrit ? COMBAT.HITSTOP_CRIT : COMBAT.HITSTOP_FRAMES;
    if (player.isFinisher) stop = Math.max(stop, COMBAT.HITSTOP_FINISHER);
    if (anyKill) stop = Math.max(stop, COMBAT.HITSTOP_KILL);
    if (game) game.triggerHitstop(stop);
  }
}

// Resolve projectiles against enemies AND boss.
export function resolveProjectiles(
  projectiles, enemies, damageNumbers, camera, particles, player, game, onKill, boss = null
) {
  const targets = gatherTargets(enemies, boss);

  for (const proj of projectiles) {
    if (proj.dead) continue;

    for (const target of targets) {
      if (proj.hitEnemies.has(target)) continue;

      if (aabbOverlap(proj, target)) {
        const isCrit = Math.random() < player.critChance;
        const critMult = isCrit ? COMBAT.CRIT_MULTIPLIER : 1;
        const dmg = Math.max(1, Math.round(proj.damage * critMult));

        target.takeDamage(dmg, proj.x);
        proj.hitEnemies.add(target);

        damageNumbers.push(
          new DamageNumber(target.x + target.width / 2, target.y - 4, dmg, isCrit)
        );
        particles.spawn(target.x + target.width / 2, target.y + target.height / 2, {
          count: 5, color: proj.color,
          speedMin: 1, speedMax: 3, life: 16, size: 3,
        });

        if (isCrit) audio.crit(1); else audio.hit(1);
        camera.shake(isCrit ? 4 : 2, isCrit ? 8 : 5);
        game?.triggerHitstop(isCrit ? COMBAT.HITSTOP_CRIT : COMBAT.HITSTOP_FRAMES);

        if (target.dead) {
          audio.enemyDie(1);
          if (onKill) onKill(target);
        }
      }
    }
  }
}
