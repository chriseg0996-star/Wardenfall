// ============================================================
// MapManager.js
// Handles loading, switching, and state of maps.
// The Game keeps entity arrays (enemies/loot/etc.) per-map
// and repopulates them on transition.
// ============================================================

import { MAPS } from "../config/Maps.js";
import { ENEMY } from "../config/Constants.js";
import { Enemy } from "../entities/Enemy.js";
import { Portal } from "../entities/Portal.js";
import { Boss } from "../entities/Boss.js";

export class MapManager {
  constructor() {
    this.currentId = null;
    this.current = null;
    this.defeatedBosses = new Set();  // boss ids that are gone forever
  }

  loadMap(mapId, game) {
    const def = MAPS[mapId];
    if (!def) {
      console.warn(`Map not found: ${mapId}`);
      return false;
    }
    this.currentId = mapId;
    this.current = def;

    // Reset world entities for the new map
    game.platforms = def.platforms.map((p) => ({ ...p }));
    game.enemies = [];
    game.loot = [];
    game.damageNumbers = [];
    game.projectiles = [];
    game.bossProjectiles = [];
    game.effects = [];
    game.respawnQueue = [];
    game.portals = [];
    game.boss = null;

    // Spawn enemies
    for (const sp of def.spawnPoints) {
      const type = ENEMY[sp.typeId];
      if (!type) { console.warn(`Unknown enemy type: ${sp.typeId}`); continue; }
      game.enemies.push(new Enemy(sp.x, sp.y, type));
    }

    // Store spawn-point defs for respawning
    game.currentSpawnPoints = def.spawnPoints.slice();

    // Portals
    for (const p of def.portals || []) {
      game.portals.push(new Portal(p));
    }

    // Boss
    if (def.boss && !this.defeatedBosses.has(def.boss.id)) {
      game.boss = new Boss(def.boss.spawnX, def.boss.spawnY);
      game.boss.bossId = def.boss.id;
    }

    // World bounds
    game.worldWidth = def.width;
    game.worldHeight = def.height;
    game.backgroundColors = def.background;

    return true;
  }

  markBossDefeated(bossId) {
    if (bossId) this.defeatedBosses.add(bossId);
  }

  serialize() {
    return {
      currentId: this.currentId,
      defeatedBosses: [...this.defeatedBosses],
    };
  }

  load(data) {
    if (!data) return;
    this.currentId = data.currentId || null;
    this.defeatedBosses = new Set(data.defeatedBosses || []);
  }
}
