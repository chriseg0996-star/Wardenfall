// ============================================================
// SkillTree.js
// Unlockable nodes. Each node:
//   - id
//   - name, description
//   - cost (skill points)
//   - requires[]: other node ids that must be unlocked first
//   - effect(game): function called when unlocked
// Nodes persist across saves via unlockedNodes set.
// ============================================================

export const SKILL_TREE = {
  // ----- Offensive branch -----
  combat_mastery_1: {
    id: "combat_mastery_1",
    name: "Combat Mastery I",
    description: "+10% base damage",
    cost: 1,
    requires: [],
    category: "offense",
    position: { col: 0, row: 0 },
    effect: (game) => { game.player.setModifier("combat_mastery_1", { damageMult: 1.10 }); },
  },
  combat_mastery_2: {
    id: "combat_mastery_2",
    name: "Combat Mastery II",
    description: "+15% base damage",
    cost: 2,
    requires: ["combat_mastery_1"],
    category: "offense",
    position: { col: 0, row: 1 },
    effect: (game) => { game.player.setModifier("combat_mastery_2", { damageMult: 1.15 }); },
  },
  crit_focus: {
    id: "crit_focus",
    name: "Crit Focus",
    description: "+10% crit chance",
    cost: 2,
    requires: ["combat_mastery_1"],
    category: "offense",
    position: { col: 1, row: 1 },
    effect: (game) => { game.player.setModifier("crit_focus", { critBonus: 0.10 }); },
  },

  // ----- Skill unlock branch -----
  aoe_slam_unlock: {
    id: "aoe_slam_unlock",
    name: "Ground Slam",
    description: "Unlock the Ground Slam skill (L)",
    cost: 2,
    requires: [],
    category: "skills",
    position: { col: 2, row: 0 },
    effect: (game) => { game.skills.unlock("aoe_slam"); },
  },
  skill_power: {
    id: "skill_power",
    name: "Arcane Power",
    description: "+25% skill damage",
    cost: 2,
    requires: ["aoe_slam_unlock"],
    category: "skills",
    position: { col: 2, row: 1 },
    effect: (game) => { game.player.setModifier("skill_power", { skillDamageMult: 1.25 }); },
  },
  mana_pool: {
    id: "mana_pool",
    name: "Deep Reserves",
    description: "+50 max MP",
    cost: 1,
    requires: [],
    category: "skills",
    position: { col: 3, row: 0 },
    effect: (game) => {
      game.player.setModifier("mana_pool", { maxMpFlat: 50 });
      game.player.mp = Math.min(game.player.maxMp, game.player.mp + 50);
    },
  },

  // ----- Defensive branch -----
  toughness: {
    id: "toughness",
    name: "Toughness",
    description: "+50 max HP",
    cost: 1,
    requires: [],
    category: "defense",
    position: { col: 4, row: 0 },
    effect: (game) => {
      game.player.setModifier("toughness", { maxHpFlat: 50 });
      game.player.hp = Math.min(game.player.maxHp, game.player.hp + 50);
    },
  },
  regeneration: {
    id: "regeneration",
    name: "Regeneration",
    description: "Slowly regenerate 1 HP/sec",
    cost: 2,
    requires: ["toughness"],
    category: "defense",
    position: { col: 4, row: 1 },
    effect: (game) => { game.player.setModifier("regeneration", { hpRegenPerFrame: 1 / 60 }); },
  },
};

export const TREE_CATEGORIES = [
  { id: "offense", name: "Combat",  color: "#ff6b6b" },
  { id: "skills",  name: "Arcane",  color: "#c084fc" },
  { id: "defense", name: "Vitality", color: "#4ade80" },
];

export function getNode(id) { return SKILL_TREE[id] || null; }
export function allNodes() { return Object.values(SKILL_TREE); }

export function canUnlock(nodeId, unlockedSet, availablePoints) {
  const node = SKILL_TREE[nodeId];
  if (!node) return false;
  if (unlockedSet.has(nodeId)) return false;
  if (availablePoints < node.cost) return false;
  return node.requires.every((r) => unlockedSet.has(r));
}
