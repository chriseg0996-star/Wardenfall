import assert from "node:assert/strict";
import { MapManager } from "../src/systems/MapManager.js";
import { Progression } from "../src/systems/Progression.js";
import { Stats } from "../src/systems/Stats.js";
import { Inventory } from "../src/systems/Inventory.js";
import { Player } from "../src/entities/Player.js";
import { SkillSystem } from "../src/systems/Skills.js";
import { UI } from "../src/systems/UI.js";
import { migrateSaveData } from "../src/systems/SaveLoad.js";
import { handleMenuInput } from "../src/systems/ui/MenuController.js";

function makeMapRuntime() {
  return {
    platforms: [],
    enemies: [],
    loot: [],
    damageNumbers: [],
    projectiles: [],
    bossProjectiles: [],
    effects: [],
    respawnQueue: [],
    portals: [],
    boss: null,
    currentSpawnPoints: [],
    worldWidth: 0,
    worldHeight: 0,
    backgroundColors: {},
  };
}

function testMapLoad() {
  const maps = new MapManager();
  const game = makeMapRuntime();
  const ok = maps.loadMap("meadow", game);
  assert.equal(ok, true, "meadow should load");
  assert.ok(game.platforms.length > 0, "platforms should populate");
  assert.ok(game.enemies.length > 0, "enemies should populate");
  assert.ok(game.portals.length > 0, "portals should populate");
}

function testPlayerModifiers() {
  const progression = new Progression();
  const stats = new Stats();
  const inventory = new Inventory();
  const player = new Player(0, 0, progression, stats, inventory);
  const baseDamage = player.damage;
  const baseHp = player.maxHp;

  player.setModifier("test_dmg", { damageMult: 1.25 });
  player.setModifier("test_hp", { maxHpFlat: 30 });

  assert.ok(player.damage > baseDamage, "damage modifier should apply");
  assert.ok(player.maxHp > baseHp, "hp modifier should apply");

  player.clearModifier("test_dmg");
  assert.ok(player.damage <= Math.round(baseDamage * 1.01), "damage should reset");

  player.clearAllModifiers();
  assert.ok(player.maxHp <= baseHp, "all modifiers should reset");
}

function testSkillSystemBasics() {
  const skills = new SkillSystem();
  assert.equal(skills.isReady("projectile"), true, "projectile starts unlocked");
  assert.equal(skills.isReady("dash_slash"), true, "dash starts unlocked");
  assert.equal(skills.isReady("aoe_slam"), false, "slam starts locked");
  skills.unlock("aoe_slam");
  assert.equal(skills.isReady("aoe_slam"), true, "unlock should enable slam");
}

function testUiFacadeApi() {
  const ui = new UI();
  ui.showMessage("test", 3);
  assert.equal(ui.message, "test");
  ui.update();
  assert.equal(ui.messageTimer, 2);
  ui.toggleMenu("stats");
  assert.equal(ui.openMenu, "stats");
  ui.toggleMenu("stats");
  assert.equal(ui.openMenu, null);
}

function testUiMenuParity() {
  const ui = new UI();
  const stats = new Stats();
  stats.availablePoints = 1;
  const player = {
    recalcStatsCalled: 0,
    recalcStats() { this.recalcStatsCalled++; },
  };
  const game = {
    stats,
    player,
    inventory: { items: [], equipped: {}, unequip: () => true },
    tryUsePotion: () => {},
    tryUnlockNode: () => true,
  };
  const input = {
    wasPressed: (...keys) => keys.includes("1"),
  };

  ui.openMenu = "stats";
  handleMenuInput(ui, input, game);
  assert.equal(stats.str, 6, "stats menu should allocate STR with key 1");
  assert.ok(player.recalcStatsCalled > 0, "stats allocation should trigger recalc");
}

function testSaveMigration() {
  const migrated = migrateSaveData({
    version: 1,
    progression: {},
    stats: {},
    inventory: {},
    skills: {},
    player: {},
  });
  assert.ok(migrated, "migration should produce data");
  assert.equal(migrated.version, 2, "save should migrate to current version");
  assert.ok(Array.isArray(migrated.unlockedTreeNodes), "tree nodes should normalize");
}

function run() {
  testMapLoad();
  testPlayerModifiers();
  testSkillSystemBasics();
  testUiFacadeApi();
  testUiMenuParity();
  testSaveMigration();
  console.log("runtime smoke tests passed");
}

run();
