// ============================================================
// Game.js
// Main orchestrator. Wires together all systems and entities,
// owns the main loop, and handles global input (menus, potions,
// portal transitions, save/load).
// ============================================================

import { Player } from "../entities/Player.js";
import { Loot } from "../entities/Loot.js";
import { Input } from "./Input.js";
import { Camera } from "./Camera.js";
import { Progression } from "../systems/Progression.js";
import { Stats } from "../systems/Stats.js";
import { Inventory } from "../systems/Inventory.js";
import { SkillSystem } from "../systems/Skills.js";
import { ParticleSystem } from "../systems/Particles.js";
import { MapManager } from "../systems/MapManager.js";
import { UI } from "../systems/UI.js";
import { rollDrops } from "../systems/LootSystem.js";
import { loadGame, hasSave } from "../systems/SaveLoad.js";
import { audio } from "../systems/Audio.js";
import { WORLD, COLORS, PARTICLES, ENEMY } from "../config/Constants.js";
import { ITEMS } from "../config/Items.js";
import { MAPS, STARTING_MAP } from "../config/Maps.js";
import { getNode, canUnlock } from "../config/SkillTree.js";
import { handleGlobalInput as routeGlobalInput, tryEnterPortal as routeTryEnterPortal, tryUsePotion as routeTryUsePotion } from "../systems/InteractionRouter.js";
import { updateWorld } from "../systems/WorldUpdatePipeline.js";

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    // Core systems
    this.input = new Input();
    this.camera = new Camera(canvas.width, canvas.height);
    this.progression = new Progression();
    this.stats = new Stats();
    this.inventory = new Inventory();
    this.skills = new SkillSystem();
    this.particles = new ParticleSystem();
    this.maps = new MapManager();
    this.ui = new UI();
    this.audio = audio;

    // Wire progression
    this.progression.bindStats(this.stats);
    this.progression.onLevelUp = (lvl) => {
      this.player.recalcStats();
      this.player.hp = this.player.maxHp;
      this.player.mp = this.player.maxMp;
      this.ui.showMessage(`LEVEL UP! Lv. ${lvl}`);
      this.camera.shake(6, 20);
      this.particles.spawn(
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height / 2,
        {
          count: PARTICLES.LEVELUP_COUNT,
          color: "#ffd23f",
          speedMin: 2, speedMax: 6,
          life: 45, size: 4, gravity: -0.05,
        }
      );
    };

    // Map-owned entity arrays — MapManager resets these
    this.platforms = [];
    this.enemies = [];
    this.loot = [];
    this.damageNumbers = [];
    this.projectiles = [];
    this.bossProjectiles = [];
    this.effects = [];
    this.portals = [];
    this.boss = null;
    this.respawnQueue = [];
    this.currentSpawnPoints = [];
    this.worldWidth = WORLD.WIDTH;
    this.worldHeight = WORLD.HEIGHT;
    this.backgroundColors = { far: COLORS.BG_FAR, near: COLORS.BG_NEAR };

    // Skill tree state
    this.unlockedTreeNodes = new Set();

    // Frame state
    this.hitstopFrames = 0;
    this.metrics = { updateMs: 0, renderMs: 0 };
    this.showDebugOverlay = false;

    // Player (must exist before loadMap since Portal.update doesn't need it,
    // but Enemy.update and respawn do)
    this.player = new Player(100, 300, this.progression, this.stats, this.inventory);

    // Load starting map
    this.maps.loadMap(STARTING_MAP, this);
    this.camera.worldWidth = this.worldWidth;
    this.player.x = MAPS[STARTING_MAP].playerStart.x;
    this.player.y = MAPS[STARTING_MAP].playerStart.y;

    // Attempt to load save (overrides map + player + state)
    if (hasSave()) {
      const data = loadGame();
      if (data) {
        this.applySave(data);
        this.ui.showMessage("WELCOME BACK", 80);
      }
    } else {
      this.ui.showMessage("GRIND TIME", 60);
    }

    // Queue BGM for the current map — will actually start on first keypress
    // since AudioContext requires a user gesture.
    this._pendingBgmMap = this.maps.currentId;

    this.running = false;
  }

  // ---------- LOOP ----------
  start() {
    this.running = true;
    requestAnimationFrame(() => this.tick());
  }

  tick() {
    if (!this.running) return;
    const t0 = performance.now();
    this.update();
    const t1 = performance.now();
    this.render();
    const t2 = performance.now();
    this.metrics.updateMs = t1 - t0;
    this.metrics.renderMs = t2 - t1;
    this.input.endFrame();
    requestAnimationFrame(() => this.tick());
  }

  // ---------- UPDATE ----------
  update() {
    this.handleGlobalInput();

    // Start any pending BGM once audio has been initialized by a user gesture
    if (this._pendingBgmMap && this.audio._initialized) {
      this.audio.playMapMusic(this._pendingBgmMap);
      this._pendingBgmMap = null;
    }

    // Menus freeze world
    if (this.ui.openMenu) {
      this.ui.handleMenuInput(this.input, this);
      this.ui.update();
      return;
    }

    // Death
    if (this.player.isDead) {
      if (this.input.wasPressed("r")) this.respawnPlayer();
      this.ui.update();
      return;
    }

    // Hitstop
    if (this.hitstopFrames > 0) {
      this.hitstopFrames--;
      this.ui.update();
      return;
    }

    updateWorld(this);
  }

  // ---------- INPUT ----------
  handleGlobalInput() {
    routeGlobalInput(this);
  }

  handleSkillInput() {
    // Kept for API compatibility; world pipeline handles skill input.
  }

  // ---------- CALLBACKS ----------
  onEnemyKilled(target) {
    // Boss kills are handled specially in handleBossDefeated
    if (target === this.boss) return;

    this.progression.gainExp(target.exp);
    const drops = rollDrops(target, this.player);
    this.loot.push(...drops);

    this.particles.spawn(target.x + target.width / 2, target.y + target.height / 2, {
      count: PARTICLES.DEATH_BURST_COUNT,
      color: target.type?.color || "#fff",
      speedMin: 2, speedMax: 5, life: 28, size: 4, gravity: 0.2,
    });
    this.camera.shake(3, 6);
  }

  handleBossDefeated() {
    if (!this.boss) return;
    const b = this.boss;
    this.maps.markBossDefeated(b.bossId);

    // Big death burst
    this.particles.spawn(b.x + b.width / 2, b.y + b.height / 2, {
      count: 40, color: "#ff4060",
      speedMin: 3, speedMax: 9, life: 50, size: 5, gravity: 0.15,
    });
    this.camera.shake(14, 40);

    // Huge XP + guaranteed legendary
    this.progression.gainExp(b.exp);
    this.loot.push(new Loot(
      b.x + b.width / 2, b.y + b.height / 2,
      "item", { itemId: "sharp_fang", rarity: "LEGENDARY" }
    ));
    this.loot.push(new Loot(
      b.x + b.width / 2, b.y + b.height / 2,
      "item", { itemId: "greater_hp_potion", rarity: "COMMON" }
    ));

    this.ui.showMessage("BOSS DEFEATED!", 180);
    this.audio.bossRoar();

    this.boss = null;
  }

  onLootPickup(loot) {
    if (loot.kind === "coin") {
      this.player.coins += loot.payload.value;
      this.audio.coin();
      this.particles.spawn(loot.x, loot.y, {
        count: PARTICLES.COIN_PICKUP_COUNT,
        color: "#ffd23f",
        speedMin: 1, speedMax: 3, life: 20, size: 2, gravity: -0.1,
      });
    } else if (loot.kind === "item") {
      const { itemId, rarity } = loot.payload;
      const added = this.inventory.addItem(itemId, rarity);
      if (added) {
        const tpl = ITEMS[itemId];
        this.audio.itemPickup(rarity);
        // Auto-equip gear upgrades (but not consumables)
        let equipped = false;
        if (!tpl.consumable) {
          const lastInst = this.inventory.items[this.inventory.items.length - 1];
          if (lastInst) {
            equipped = this.inventory.autoEquipIfBetter(lastInst.uid);
            if (equipped) this.player.recalcStats();
          }
        }
        const label = itemId.replace(/_/g, " ");
        this.ui.showMessage(
          `+ ${rarity.toLowerCase()} ${label}${equipped ? " (equipped!)" : ""}`,
          90
        );
        this.particles.spawn(loot.x, loot.y, {
          count: 8, color: "#fff",
          speedMin: 1, speedMax: 3, life: 22, size: 3, gravity: -0.05,
        });
      } else {
        this.ui.showMessage("BAG FULL!", 70);
      }
    }
  }

  // ---------- ACTIONS ----------
  tryUsePotion(itemId) {
    routeTryUsePotion(this, itemId);
  }

  tryEnterPortal() {
    return routeTryEnterPortal(this);
  }

  tryUnlockNode(nodeId) {
    if (!canUnlock(nodeId, this.unlockedTreeNodes, this.progression.skillPoints)) return false;
    const node = getNode(nodeId);
    if (!node) return false;
    this.progression.skillPoints -= node.cost;
    this.unlockedTreeNodes.add(nodeId);
    node.effect(this);
    this.audio.levelUp();
    this.ui.showMessage(`Unlocked: ${node.name}`, 70);
    return true;
  }

  findSpawnPointFor(enemy) {
    const candidates = this.currentSpawnPoints.filter((sp) => {
      const t = ENEMY[sp.typeId];
      return t && t.id === enemy.type.id;
    });
    return candidates[Math.floor(Math.random() * candidates.length)] || null;
  }

  respawnPlayer() {
    // Return to current map's starting point
    const mapDef = MAPS[this.maps.currentId] || MAPS[STARTING_MAP];
    this.player.hp = this.player.maxHp;
    this.player.mp = this.player.maxMp;
    this.player.x = mapDef.playerStart.x;
    this.player.y = mapDef.playerStart.y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.invuln = 60;
    this.player.comboCount = 0;
    this.player.comboWindow = 0;
    this.ui.showMessage("RESPAWNED", 60);
  }

  triggerHitstop(frames) {
    this.hitstopFrames = Math.max(this.hitstopFrames, frames);
  }

  // ---------- SAVE/LOAD ----------
  applySave(data) {
    try {
      this.progression.load(data.progression);
      this.stats.load(data.stats);
      this.inventory.load(data.inventory);
      this.skills.load(data.skills);
      this.maps.load(data.maps);

      this.unlockedTreeNodes = new Set(data.unlockedTreeNodes || []);

      // Re-load the saved map (replacing starter)
      if (data.maps?.currentId && MAPS[data.maps.currentId]) {
        this.maps.loadMap(data.maps.currentId, this);
        this.camera.worldWidth = this.worldWidth;
        this._pendingBgmMap = data.maps.currentId;
      }

      // Re-apply skill tree effects from a clean modifier state.
      this.player.clearAllModifiers();
      for (const id of this.unlockedTreeNodes) {
        const node = getNode(id);
        if (node) node.effect(this);
      }
      this.player.recalcStats();

      if (data.player) {
        this.player.x = data.player.x ?? this.player.x;
        this.player.y = data.player.y ?? this.player.y;
        this.player.coins = data.player.coins ?? 0;
        this.player.hp = Math.min(this.player.maxHp, data.player.hp ?? this.player.maxHp);
        this.player.mp = Math.min(this.player.maxMp, data.player.mp ?? this.player.maxMp);
      }
    } catch (err) {
      console.error("Failed to apply save:", err);
    }
  }

  // ---------- RENDER ----------
  render() {
    const { ctx, canvas } = this;

    // Background
    ctx.fillStyle = this.backgroundColors.far;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cam = this.camera.getOffset();
    ctx.save();
    ctx.translate(-cam.x, -cam.y);

    this.renderParallax(ctx, cam);

    // Platforms
    for (const p of this.platforms) {
      ctx.fillStyle = p.oneWay ? COLORS.PLATFORM : COLORS.GROUND;
      ctx.fillRect(p.x, p.y, p.width, p.height);
      ctx.fillStyle = p.oneWay ? COLORS.PLATFORM_TOP : COLORS.GROUND_TOP;
      ctx.fillRect(p.x, p.y, p.width, 4);
    }

    // Portals (behind entities)
    for (const portal of this.portals) {
      portal.render(ctx, portal.overlapsPlayer(this.player));
    }

    // Effects
    for (const e of this.effects) e.render(ctx);

    // Loot
    for (const l of this.loot) l.render(ctx);

    // Enemies
    for (const e of this.enemies) e.render(ctx);

    // Boss
    if (this.boss) this.boss.render(ctx);

    // Boss projectiles
    for (const bp of this.bossProjectiles) bp.render(ctx);

    // Player projectiles
    for (const p of this.projectiles) p.render(ctx);

    // Player
    this.player.render(ctx);

    // Particles
    this.particles.render(ctx);

    // Damage numbers
    for (const d of this.damageNumbers) d.render(ctx);

    ctx.restore();

    // UI (screen-space)
    this.ui.render(ctx, this);
  }

  renderParallax(ctx, cam) {
    const p = cam.x * 0.3;
    ctx.fillStyle = this.backgroundColors.near;
    for (let i = 0; i < 10; i++) {
      const x = i * 400 - (p % 400);
      const h = 120 + (i % 3) * 40;
      ctx.fillRect(x + cam.x, this.worldHeight - 40 - h, 280, h);
    }
  }
}
