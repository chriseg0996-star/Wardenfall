// ============================================================
// SaveLoad.js
// Persists game state to localStorage. One save slot for now.
// ============================================================

import { SAVE_KEY } from "../config/Constants.js";

const CURRENT_SAVE_VERSION = 2;

function isRecord(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function sanitizeNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function sanitizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((entry) => typeof entry === "string");
}

function migrateV1ToV2(data) {
  const next = { ...data };
  if (!isRecord(next.maps)) next.maps = { currentId: null, defeatedBosses: [] };
  if (!Array.isArray(next.unlockedTreeNodes)) next.unlockedTreeNodes = [];
  next.version = 2;
  return next;
}

const MIGRATIONS = {
  1: migrateV1ToV2,
};

function normalizeSaveShape(data) {
  const next = { ...data };
  next.version = CURRENT_SAVE_VERSION;
  next.timestamp = sanitizeNumber(next.timestamp, Date.now());
  next.player = isRecord(next.player) ? next.player : {};
  next.progression = isRecord(next.progression) ? next.progression : {};
  next.stats = isRecord(next.stats) ? next.stats : {};
  next.inventory = isRecord(next.inventory) ? next.inventory : {};
  next.skills = isRecord(next.skills) ? next.skills : {};
  next.maps = isRecord(next.maps) ? next.maps : { currentId: null, defeatedBosses: [] };
  next.maps.defeatedBosses = sanitizeStringArray(next.maps.defeatedBosses);
  next.unlockedTreeNodes = sanitizeStringArray(next.unlockedTreeNodes);
  return next;
}

export function migrateSaveData(data) {
  if (!isRecord(data)) return null;

  let next = { ...data };
  let version = sanitizeNumber(next.version, 1);
  while (version < CURRENT_SAVE_VERSION) {
    const migrate = MIGRATIONS[version];
    if (!migrate) break;
    next = migrate(next);
    version = sanitizeNumber(next.version, version + 1);
  }

  return normalizeSaveShape(next);
}

export function saveGame(game) {
  try {
    const data = {
      version: CURRENT_SAVE_VERSION,
      timestamp: Date.now(),
      player: {
        x: game.player.x,
        y: game.player.y,
        hp: game.player.hp,
        mp: game.player.mp,
        coins: game.player.coins,
      },
      progression: game.progression.serialize(),
      stats: game.stats.serialize(),
      inventory: game.inventory.serialize(),
      skills: game.skills.serialize(),
      maps: game.maps ? game.maps.serialize() : null,
      unlockedTreeNodes: game.unlockedTreeNodes ? [...game.unlockedTreeNodes] : [],
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error("Save failed:", err);
    return false;
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const migrated = migrateSaveData(parsed);
    if (!migrated) return null;
    return migrated;
  } catch (err) {
    console.error("Load failed:", err);
    return null;
  }
}

export function hasSave() {
  return !!localStorage.getItem(SAVE_KEY);
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}

export const __saveTestables = {
  CURRENT_SAVE_VERSION,
  normalizeSaveShape,
};
