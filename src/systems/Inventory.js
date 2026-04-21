// ============================================================
// Inventory.js
// Holds a list of owned item instances, plus equipped slots.
// An "item instance" is { uid, itemId, rarity } — the template
// lives in Items.js.
// ============================================================

import { ITEMS } from "../config/Items.js";
import { RARITY } from "../config/Constants.js";

let _uid = 1;
const nextUid = () => _uid++;

export class Inventory {
  constructor() {
    this.items = [];                          // all owned item instances
    this.equipped = { weapon: null, armor: null, accessory: null };
    this.capacity = 20;
  }

  // Add a new instance; returns true if successful.
  // Stackable items (potions) merge into an existing stack.
  addItem(itemId, rarity = "COMMON") {
    const tpl = ITEMS[itemId];
    if (!tpl) return false;

    // Stack with existing if possible
    if (tpl.stackable) {
      const existing = this.items.find((it) => it.itemId === itemId && it.rarity === rarity);
      if (existing) {
        existing.count = (existing.count || 1) + 1;
        return true;
      }
    }

    if (this.items.length >= this.capacity) return false;
    const inst = { uid: nextUid(), itemId, rarity };
    if (tpl.stackable) inst.count = 1;
    this.items.push(inst);
    return true;
  }

  // Consume one unit of an item; returns the template if consumed, else null
  use(uid) {
    const idx = this.items.findIndex((it) => it.uid === uid);
    if (idx === -1) return null;
    const inst = this.items[idx];
    const tpl = ITEMS[inst.itemId];
    if (!tpl || !tpl.consumable) return null;

    if (inst.count && inst.count > 1) {
      inst.count--;
    } else {
      this.items.splice(idx, 1);
    }
    return tpl;
  }

  // Use the first item matching predicate (e.g. first HP potion). Returns template or null.
  useFirst(predicate) {
    const inst = this.items.find((it) => {
      const tpl = ITEMS[it.itemId];
      return tpl && tpl.consumable && predicate(tpl, it);
    });
    if (!inst) return null;
    return this.use(inst.uid);
  }

  removeByUid(uid) {
    const idx = this.items.findIndex((it) => it.uid === uid);
    if (idx === -1) return null;
    return this.items.splice(idx, 1)[0];
  }

  // Equip an item in inventory; moves current equipped back to bag
  equip(uid) {
    const inst = this.items.find((it) => it.uid === uid);
    if (!inst) return false;
    const tpl = ITEMS[inst.itemId];
    if (!tpl) return false;
    if (tpl.consumable) return false;             // can't equip potions
    if (!["weapon", "armor", "accessory"].includes(tpl.slot)) return false;
    const slot = tpl.slot;

    // Remove from bag
    this.removeByUid(uid);

    // If something is equipped there already, move it back to bag
    const current = this.equipped[slot];
    if (current) this.items.push(current);

    this.equipped[slot] = inst;
    return true;
  }

  unequip(slot) {
    const current = this.equipped[slot];
    if (!current) return false;
    if (this.items.length >= this.capacity) return false;
    this.items.push(current);
    this.equipped[slot] = null;
    return true;
  }

  // Sum equipped-gear stat bonuses (with rarity multiplier)
  getEquippedBonuses() {
    const totals = { damage: 0, maxHp: 0, critChance: 0, dropRate: 0 };
    for (const slot of Object.keys(this.equipped)) {
      const inst = this.equipped[slot];
      if (!inst) continue;
      const tpl = ITEMS[inst.itemId];
      if (!tpl) continue;
      const mult = RARITY[inst.rarity]?.mult ?? 1;
      for (const [k, v] of Object.entries(tpl.stats || {})) {
        totals[k] = (totals[k] || 0) + v * mult;
      }
    }
    return totals;
  }

  // Quality-of-life: auto-equip if slot is empty or the new item is strictly better
  autoEquipIfBetter(uid) {
    const inst = this.items.find((it) => it.uid === uid);
    if (!inst) return false;
    const tpl = ITEMS[inst.itemId];
    if (!tpl) return false;
    if (tpl.consumable) return false;
    if (!["weapon", "armor", "accessory"].includes(tpl.slot)) return false;

    const current = this.equipped[tpl.slot];
    if (!current) { this.equip(uid); return true; }

    // Compare effective power (sum of stat values * rarity mult)
    const powerOf = (i) => {
      const t = ITEMS[i.itemId];
      const m = RARITY[i.rarity]?.mult ?? 1;
      return Object.values(t.stats || {}).reduce((s, v) => s + v, 0) * m;
    };
    if (powerOf(inst) > powerOf(current)) { this.equip(uid); return true; }
    return false;
  }

  serialize() {
    return {
      items: this.items.map((it) => ({ ...it })),
      equipped: Object.fromEntries(
        Object.entries(this.equipped).map(([slot, inst]) => [slot, inst ? { ...inst } : null])
      ),
      _uid,
    };
  }

  load(data) {
    if (!data) return;
    this.items = (data.items || []).map((it) => ({ ...it }));
    const eq = data.equipped || {};
    this.equipped = {
      weapon: eq.weapon ? { ...eq.weapon } : null,
      armor: eq.armor ? { ...eq.armor } : null,
      accessory: eq.accessory ? { ...eq.accessory } : null,
    };
    if (typeof data._uid === "number") _uid = data._uid;
  }
}
