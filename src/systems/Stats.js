// ============================================================
// Stats.js
// Owns STR/DEX/VIT/LUK + available stat points.
// Computes bonuses that the Player reads when recalculating
// derived stats (maxHp, damage, critChance, dropRate).
// ============================================================

import { STATS } from "../config/Constants.js";

export class Stats {
  constructor() {
    this.str = 5;
    this.dex = 5;
    this.vit = 5;
    this.luk = 5;
    this.availablePoints = 0;
  }

  allocate(stat) {
    if (this.availablePoints <= 0) return false;
    const key = stat.toLowerCase();
    if (!(key in this) || key === "availablepoints") return false;
    this[key]++;
    this.availablePoints--;
    return true;
  }

  grantPoints(n) {
    this.availablePoints += n;
  }

  // Bonuses contributed to the Player's derived stats
  getBonuses() {
    return {
      damage:    this.str * STATS.STR.damage,
      crit:      this.dex * STATS.DEX.crit,
      maxHp:     this.vit * STATS.VIT.maxHp,
      dropRate:  this.luk * STATS.LUK.dropRate,
    };
  }

  serialize() {
    return {
      str: this.str, dex: this.dex, vit: this.vit, luk: this.luk,
      availablePoints: this.availablePoints,
    };
  }

  load(data) {
    if (!data) return;
    this.str = data.str ?? 5;
    this.dex = data.dex ?? 5;
    this.vit = data.vit ?? 5;
    this.luk = data.luk ?? 5;
    this.availablePoints = data.availablePoints ?? 0;
  }
}
