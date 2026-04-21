import { MAPS } from "../config/Maps.js";
import { SKILLS } from "../config/Constants.js";
import { clearSave, saveGame } from "./SaveLoad.js";

export function handleGlobalInput(game) {
  const { input, ui, player } = game;

  if (input.wasPressed("c")) ui.toggleMenu("stats");
  if (input.wasPressed("b")) ui.toggleMenu("inventory");
  if (input.wasPressed("t")) ui.toggleMenu("tree");
  if (input.wasPressed("escape")) ui.openMenu = null;

  if (!ui.openMenu && !player.isDead) {
    if (input.wasPressed("1")) tryUsePotion(game, "hp_potion");
    if (input.wasPressed("2")) tryUsePotion(game, "mp_potion");
    if (input.wasPressed("3")) tryUsePotion(game, "greater_hp_potion");
    if (input.wasPressed("arrowup", "w")) tryEnterPortal(game);
  }

  if (input.wasPressed("f5")) {
    if (saveGame(game)) {
      game.audio.save();
      game.ui.flashSave();
    }
  }
  if (input.wasPressed("f8")) {
    clearSave();
    game.ui.showMessage("SAVE CLEARED", 80);
  }
  if (input.wasPressed("m")) {
    const enabled = game.audio.toggle();
    game.ui.showMessage(enabled ? "SOUND ON" : "MUTED", 50);
  }
  if (input.wasPressed("f3")) {
    game.showDebugOverlay = !game.showDebugOverlay;
    game.ui.showMessage(game.showDebugOverlay ? "DEBUG ON" : "DEBUG OFF", 40);
  }
}

export function handleSkillInput(game) {
  const ctx = {
    player: game.player,
    enemies: game.enemies,
    boss: game.boss,
    damageNumbers: game.damageNumbers,
    effects: game.effects,
    particles: game.particles,
    projectiles: game.projectiles,
    camera: game.camera,
    game,
  };

  if (game.input.wasPressed(SKILLS.PROJECTILE.key)) game.skills.tryCast("projectile", ctx);
  if (game.input.wasPressed(SKILLS.DASH_SLASH.key)) game.skills.tryCast("dash_slash", ctx);
  if (game.input.wasPressed(SKILLS.AOE_SLAM.key)) game.skills.tryCast("aoe_slam", ctx);
}

export function tryUsePotion(game, itemId) {
  const tpl = game.inventory.useFirst((t) => t.id === itemId);
  if (!tpl) return;
  if (tpl.effect.heal) game.player.heal(tpl.effect.heal);
  if (tpl.effect.restoreMp) {
    game.player.mp = Math.min(game.player.maxMp, game.player.mp + tpl.effect.restoreMp);
  }
  game.audio.potion();
  game.particles.spawn(
    game.player.x + game.player.width / 2,
    game.player.y + game.player.height / 2,
    {
      count: 10,
      color: tpl.effect.heal ? "#ff6b6b" : "#3b82f6",
      speedMin: 1,
      speedMax: 3,
      life: 25,
      size: 3,
      gravity: -0.1,
    }
  );
}

export function tryEnterPortal(game) {
  for (const portal of game.portals) {
    if (!portal.overlapsPlayer(game.player)) continue;

    const targetMap = portal.targetMap;
    game.audio.portal();
    game.maps.loadMap(targetMap, game);
    game.camera.worldWidth = game.worldWidth;
    game.player.x = portal.targetX;
    game.player.y = portal.targetY;
    game.player.vx = 0;
    game.player.vy = 0;
    game.player.invuln = 60;
    game.player.comboCount = 0;
    game.player.comboWindow = 0;
    game.ui.showMessage(MAPS[targetMap].name, 80);
    game.particles.spawn(
      game.player.x + game.player.width / 2,
      game.player.y + game.player.height / 2,
      { count: 20, color: "#c080ff", speedMin: 2, speedMax: 5, life: 30, size: 4, gravity: -0.05 }
    );
    if (game.audio._initialized && game.audio.currentBgmMap() !== targetMap) {
      game.audio.playMapMusic(targetMap);
    }
    return true;
  }
  return false;
}

