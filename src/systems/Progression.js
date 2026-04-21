// ============================================================
// Progression.js
// EXP / level tracking. On level-up, grants stat points (to the
// Stats system) and skill points, then fires onLevelUp so the
// Player can recalc derived stats and the UI can notify.
// ============================================================

import { PROGRESSION } from "../config/Constants.js";
import { audio } from "./Audio.js";

export class Progression {
  constructor() {
    this.level = 1;
    this.exp = 0;
    this.expToNext = this.calcExpRequired(1);
    this.skillPoints = 0;
    this.onLevelUp = null; // callback set by Game
    this.statsRef = null;  // set by Game so we can grant stat points
  }

  bindStats(stats) { this.statsRef = stats; }

  calcExpRequired(level) {
    return Math.floor(PROGRESSION.EXP_BASE * Math.pow(level, PROGRESSION.EXP_CURVE));
  }

  gainExp(amount) {
    this.exp += amount;
    while (this.exp >= this.expToNext) {
      this.exp -= this.expToNext;
      this.level++;
      this.expToNext = this.calcExpRequired(this.level);
      // Grant points
      if (this.statsRef) {
        this.statsRef.grantPoints(PROGRESSION.STAT_POINTS_PER_LEVEL);
      }
      this.skillPoints += PROGRESSION.SKILL_POINTS_PER_LEVEL;
      audio.levelUp();
      if (this.onLevelUp) this.onLevelUp(this.level);
    }
  }

  get progress() { return this.exp / this.expToNext; }

  serialize() {
    return { level: this.level, exp: this.exp, skillPoints: this.skillPoints };
  }

  load(data) {
    if (!data) return;
    this.level = data.level ?? 1;
    this.exp = data.exp ?? 0;
    this.skillPoints = data.skillPoints ?? 0;
    this.expToNext = this.calcExpRequired(this.level);
  }
}
