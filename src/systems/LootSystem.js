// ============================================================
// LootSystem.js
// Rolls drops for a killed enemy. Now supports coins + items.
// Item drop chance is boosted by the player's dropRateBonus.
// ============================================================

import { Loot } from "../entities/Loot.js";
import { LOOT } from "../config/Constants.js";
import { rollItemFromTable } from "../config/Items.js";

export function rollDrops(enemy, player) {
  const drops = [];

  // ---- Coins ----
  if (Math.random() < LOOT.COIN_DROP_CHANCE) {
    const count = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const value = LOOT.COIN_VALUE_MIN +
        Math.floor(Math.random() * (LOOT.COIN_VALUE_MAX - LOOT.COIN_VALUE_MIN + 1));
      drops.push(new Loot(
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2,
        "coin",
        { value }
      ));
    }
  }

  // ---- Items ----
  const itemChance = LOOT.ITEM_DROP_CHANCE + (player?.dropRateBonus || 0);
  if (Math.random() < itemChance) {
    const roll = rollItemFromTable(enemy.type.id);
    if (roll) {
      drops.push(new Loot(
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2,
        "item",
        { itemId: roll.itemId, rarity: roll.rarity }
      ));
    }
  }

  return drops;
}
