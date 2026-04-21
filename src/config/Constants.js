// ============================================================
// Constants.js
// Central place for all tunable values. Tweak game feel here.
// ============================================================

export const WORLD = {
  WIDTH: 2400,
  HEIGHT: 540,
  GRAVITY: 0.8,
  FRICTION: 0.82,
  MAX_FALL_SPEED: 16,
};

export const PLAYER = {
  WIDTH: 28,
  HEIGHT: 48,
  MOVE_SPEED: 4.2,
  ACCEL: 0.9,
  JUMP_POWER: 14,
  ATTACK_COOLDOWN: 18,
  ATTACK_DURATION: 10,
  ATTACK_RANGE: 55,
  ATTACK_WIDTH: 60,
  ATTACK_HEIGHT: 40,
  INVULN_FRAMES: 40,
  BASE_HP: 100,
  BASE_MP: 50,
  MP_REGEN_PER_FRAME: 5 / 60,   // ~5 MP/sec
  BASE_DAMAGE: 15,
  BASE_CRIT: 0.1,
  // Combo system
  COMBO_WINDOW: 45,             // frames to chain next attack
  COMBO_FINISHER_MULT: 1.6,
  COMBO_FINISHER_WIDTH: 80,
  COMBO_FINISHER_HEIGHT: 55,
  // Jump attack
  JUMP_ATTACK_MULT: 1.25,
};

export const ENEMY = {
  SLIME: {
    id: "slime",
    name: "Slime",
    width: 32, height: 24,
    hp: 30, damage: 8, exp: 12,
    moveSpeed: 1.1,
    color: "#6bdc6b",
    detectRange: 220,
    knockback: 4,
    attackCooldown: 40,
    staggerResist: 0,
  },
  MUSHROOM: {
    id: "mushroom",
    name: "Mushroom",
    width: 36, height: 36,
    hp: 60, damage: 14, exp: 25,
    moveSpeed: 1.6,
    color: "#e07a5f",
    detectRange: 280,
    knockback: 5,
    attackCooldown: 35,
    staggerResist: 0.3,
  },
  WOLF: {
    id: "wolf",
    name: "Wolf",
    width: 44, height: 30,
    hp: 90, damage: 20, exp: 45,
    moveSpeed: 2.4,
    color: "#9a9a9a",
    detectRange: 340,
    knockback: 6,
    attackCooldown: 30,
    staggerResist: 0.5,
  },
  ALPHA_WOLF: {
    id: "alpha_wolf",
    name: "Alpha Wolf",
    width: 48, height: 32,
    hp: 150, damage: 28, exp: 80,
    moveSpeed: 2.9,
    color: "#b8b8b8",
    detectRange: 420,
    knockback: 7,
    attackCooldown: 24,
    staggerResist: 0.7,
  },
};

export const PROGRESSION = {
  EXP_BASE: 50,
  EXP_CURVE: 1.5,
  STAT_POINTS_PER_LEVEL: 3,
  SKILL_POINTS_PER_LEVEL: 1,
};

// Stat effects — each point in a stat gives these bonuses
export const STATS = {
  STR: { damage: 1.2 },         // +1.2 damage per STR
  DEX: { crit: 0.005 },         // +0.5% crit per DEX
  VIT: { maxHp: 6 },            // +6 HP per VIT
  LUK: { dropRate: 0.01 },      // +1% drop rate per LUK
};

export const COMBAT = {
  HIT_FLASH_FRAMES: 6,
  KNOCKBACK_DECAY: 0.85,
  CRIT_MULTIPLIER: 1.8,
  STAGGER_FRAMES: 18,
  HITSTOP_FRAMES: 2,            // tiny freeze on hit — HUGE for game feel
  HITSTOP_CRIT: 4,
  HITSTOP_FINISHER: 5,
  HITSTOP_KILL: 6,
};

// Encounter pacing knobs to tune pressure per archetype.
export const ENCOUNTER = {
  ZONER_IDEAL_RANGE: 150,
  ZONER_RETREAT_RANGE: 80,
  BRUISER_COMMIT_SPEED_MULT: 1.12,
};

export const LOOT = {
  COIN_DROP_CHANCE: 0.9,
  COIN_VALUE_MIN: 1,
  COIN_VALUE_MAX: 5,
  ITEM_DROP_CHANCE: 0.08,       // base chance for any item drop
  PICKUP_RADIUS: 36,
  MAGNET_RADIUS: 90,
  MAGNET_SPEED: 5,
  LIFETIME: 600,
};

export const RARITY = {
  COMMON:    { name: "Common",    color: "#cccccc", mult: 1.0 },
  UNCOMMON:  { name: "Uncommon",  color: "#4ade80", mult: 1.3 },
  RARE:      { name: "Rare",      color: "#60a5fa", mult: 1.7 },
  EPIC:      { name: "Epic",      color: "#c084fc", mult: 2.2 },
  LEGENDARY: { name: "Legendary", color: "#fbbf24", mult: 3.0 },
};

export const SKILLS = {
  DASH_SLASH: {
    id: "dash_slash",
    name: "Dash Slash",
    key: "k",
    hotkey: "K",
    mpCost: 8,
    cooldown: 90,
    damageMult: 1.5,
    dashDistance: 140,
    dashFrames: 10,
    color: "#60a5fa",
    description: "Dash forward, damaging enemies in path.",
  },
  AOE_SLAM: {
    id: "aoe_slam",
    name: "Ground Slam",
    key: "l",
    hotkey: "L",
    mpCost: 15,
    cooldown: 180,
    damageMult: 2.0,
    radius: 110,
    color: "#fbbf24",
    description: "Slam the ground, damaging all nearby enemies.",
  },
  PROJECTILE: {
    id: "projectile",
    name: "Energy Bolt",
    key: "i",
    hotkey: "I",
    mpCost: 5,
    cooldown: 35,
    damageMult: 0.9,
    projectileSpeed: 9,
    projectileLife: 90,
    color: "#c084fc",
    description: "Fire a piercing energy bolt.",
  },
};

export const PARTICLES = {
  HIT_SPARK_COUNT: 6,
  COIN_PICKUP_COUNT: 4,
  DEATH_BURST_COUNT: 10,
  LEVELUP_COUNT: 24,
};

export const COLORS = {
  BG_FAR: "#1a1a2e",
  BG_NEAR: "#2a2a4e",
  GROUND: "#3d2817",
  GROUND_TOP: "#5a4028",
  PLATFORM: "#4a3525",
  PLATFORM_TOP: "#6b5038",
  PLAYER: "#4ea8ff",
  PLAYER_HIT: "#ff6b6b",
  UI_TEXT: "#ffffff",
  UI_HP: "#e63946",
  UI_MP: "#3b82f6",
  UI_EXP: "#f4a261",
  UI_BG: "rgba(0,0,0,0.55)",
};

export const SAVE_KEY = "actionrpg_save_v1";

// Structured tuning presets for progression/economy iteration.
export const TUNING_PROFILES = {
  early: {
    expBase: 42,
    expCurve: 1.42,
    itemDropChance: 0.1,
  },
  standard: {
    expBase: 50,
    expCurve: 1.5,
    itemDropChance: 0.08,
  },
  late: {
    expBase: 56,
    expCurve: 1.6,
    itemDropChance: 0.065,
  },
};
