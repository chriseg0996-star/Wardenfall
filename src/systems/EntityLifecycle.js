import { Enemy } from "../entities/Enemy.js";
import { ENEMY } from "../config/Constants.js";

export function updateEnemies(game) {
  for (const e of game.enemies) if (!e.dead) e.update(game.player, game.platforms);

  game.enemies = game.enemies.filter((e) => {
    if (e.dead) {
      const sp = game.findSpawnPointFor(e);
      if (sp) game.respawnQueue.push({ point: sp, timer: 180 });
      return false;
    }
    return true;
  });
}

export function updateRespawns(game) {
  game.respawnQueue = game.respawnQueue.filter((r) => {
    r.timer--;
    if (r.timer <= 0) {
      const type = ENEMY[r.point.typeId];
      if (type) game.enemies.push(new Enemy(r.point.x, r.point.y, type));
      return false;
    }
    return true;
  });
}

export function cleanupTransientEntities(game) {
  for (const bp of game.bossProjectiles) bp.update(game.player);
  game.bossProjectiles = game.bossProjectiles.filter((bp) => !bp.dead);

  for (const l of game.loot) l.update(game.player, game.platforms, (pickup) => game.onLootPickup(pickup));
  game.loot = game.loot.filter((l) => !l.dead);

  for (const p of game.projectiles) {
    p.update();
    if (p.x < -50 || p.x > game.worldWidth + 50) p.dead = true;
  }
  game.projectiles = game.projectiles.filter((p) => !p.dead);

  for (const e of game.effects) e.update();
  game.effects = game.effects.filter((e) => !e.dead);

  for (const d of game.damageNumbers) d.update();
  game.damageNumbers = game.damageNumbers.filter((d) => !d.dead);

  game.particles.update();
}
