import { resolvePlayerAttacks, resolveProjectiles } from "./Combat.js";
import { cleanupTransientEntities, updateEnemies, updateRespawns } from "./EntityLifecycle.js";
import { handleSkillInput } from "./InteractionRouter.js";

export function updateWorld(game) {
  game.player.update(game.input, game.platforms);
  game.skills.tick();
  handleSkillInput(game);

  resolvePlayerAttacks(
    game.player,
    game.enemies,
    game.damageNumbers,
    game.camera,
    game.particles,
    game,
    (target) => game.onEnemyKilled(target),
    game.boss
  );

  resolveProjectiles(
    game.projectiles,
    game.enemies,
    game.damageNumbers,
    game.camera,
    game.particles,
    game.player,
    game,
    (target) => game.onEnemyKilled(target),
    game.boss
  );

  updateEnemies(game);
  updateRespawns(game);

  if (game.boss && !game.boss.dead) game.boss.update(game.player, game.platforms, game);
  if (game.boss && game.boss.dead) game.handleBossDefeated();

  for (const p of game.portals) p.update();
  cleanupTransientEntities(game);

  game.camera.worldWidth = game.worldWidth;
  game.camera.follow(game.player);
  game.ui.update();
}
