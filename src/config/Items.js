// ============================================================
// Items.js
// All gear and consumable definitions.
// Items are stateless templates — instances reference them by id.
// ============================================================

// slot: "weapon" | "armor" | "accessory"
export const ITEMS = {
  // ---- Weapons ----
  wooden_sword: {
    id: "wooden_sword",
    name: "Wooden Sword",
    slot: "weapon",
    icon: "🗡️",
    stats: { damage: 3 },
  },
  iron_blade: {
    id: "iron_blade",
    name: "Iron Blade",
    slot: "weapon",
    icon: "⚔️",
    stats: { damage: 8 },
  },
  sharp_fang: {
    id: "sharp_fang",
    name: "Sharp Fang",
    slot: "weapon",
    icon: "🦷",
    stats: { damage: 14, critChance: 0.05 },
  },

  // ---- Armor ----
  cloth_robe: {
    id: "cloth_robe",
    name: "Cloth Robe",
    slot: "armor",
    icon: "🥋",
    stats: { maxHp: 15 },
  },
  leather_vest: {
    id: "leather_vest",
    name: "Leather Vest",
    slot: "armor",
    icon: "🦺",
    stats: { maxHp: 35 },
  },
  steel_mail: {
    id: "steel_mail",
    name: "Steel Mail",
    slot: "armor",
    icon: "🛡️",
    stats: { maxHp: 60, damage: 2 },
  },

  // ---- Accessories ----
  copper_ring: {
    id: "copper_ring",
    name: "Copper Ring",
    slot: "accessory",
    icon: "💍",
    stats: { critChance: 0.04 },
  },
  lucky_charm: {
    id: "lucky_charm",
    name: "Lucky Charm",
    slot: "accessory",
    icon: "🍀",
    stats: { dropRate: 0.15, critChance: 0.02 },
  },

  // ---- Consumables (stackable; not equipped) ----
  hp_potion: {
    id: "hp_potion",
    name: "HP Potion",
    slot: "consumable",
    icon: "🧪",
    consumable: true,
    effect: { heal: 50 },
    stackable: true,
  },
  mp_potion: {
    id: "mp_potion",
    name: "MP Potion",
    slot: "consumable",
    icon: "🔮",
    consumable: true,
    effect: { restoreMp: 30 },
    stackable: true,
  },
  greater_hp_potion: {
    id: "greater_hp_potion",
    name: "Greater HP Potion",
    slot: "consumable",
    icon: "💊",
    consumable: true,
    effect: { heal: 150 },
    stackable: true,
  },
};

// Drop tables per enemy type — weighted rolls
// Format: [{ id, weight, rarity }]
export const DROP_TABLES = {
  slime: [
    { id: "wooden_sword", weight: 30, rarity: "COMMON" },
    { id: "cloth_robe",   weight: 30, rarity: "COMMON" },
    { id: "hp_potion",    weight: 20, rarity: "COMMON" },
    { id: "copper_ring",  weight: 15, rarity: "UNCOMMON" },
    { id: "iron_blade",   weight: 5,  rarity: "UNCOMMON" },
  ],
  mushroom: [
    { id: "wooden_sword", weight: 15, rarity: "COMMON" },
    { id: "cloth_robe",   weight: 15, rarity: "COMMON" },
    { id: "hp_potion",    weight: 20, rarity: "COMMON" },
    { id: "mp_potion",    weight: 15, rarity: "COMMON" },
    { id: "iron_blade",   weight: 20, rarity: "UNCOMMON" },
    { id: "leather_vest", weight: 20, rarity: "UNCOMMON" },
    { id: "copper_ring",  weight: 8,  rarity: "RARE" },
    { id: "lucky_charm",  weight: 2,  rarity: "EPIC" },
  ],
  wolf: [
    { id: "greater_hp_potion", weight: 15, rarity: "COMMON" },
    { id: "mp_potion",    weight: 10, rarity: "COMMON" },
    { id: "iron_blade",   weight: 15, rarity: "UNCOMMON" },
    { id: "leather_vest", weight: 15, rarity: "UNCOMMON" },
    { id: "sharp_fang",   weight: 20, rarity: "RARE" },
    { id: "steel_mail",   weight: 15, rarity: "RARE" },
    { id: "lucky_charm",  weight: 8,  rarity: "EPIC" },
    { id: "sharp_fang",   weight: 2,  rarity: "LEGENDARY" },
  ],
};

/**
 * Roll a weighted item from a drop table.
 * Returns { itemId, rarity } or null.
 */
export function rollItemFromTable(enemyId) {
  const table = DROP_TABLES[enemyId];
  if (!table) return null;

  const totalWeight = table.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * totalWeight;
  for (const entry of table) {
    r -= entry.weight;
    if (r <= 0) return { itemId: entry.id, rarity: entry.rarity };
  }
  return null;
}
