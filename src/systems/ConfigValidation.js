import { MAPS } from "../config/Maps.js";
import { ITEMS } from "../config/Items.js";
import { SKILL_TREE } from "../config/SkillTree.js";

function assert(condition, message, errors) {
  if (!condition) errors.push(message);
}

function validateMaps(errors) {
  for (const [id, map] of Object.entries(MAPS)) {
    assert(map.id === id, `Map id mismatch for ${id}`, errors);
    assert(Array.isArray(map.platforms), `Map ${id} missing platforms[]`, errors);
    assert(Array.isArray(map.spawnPoints), `Map ${id} missing spawnPoints[]`, errors);
    assert(Array.isArray(map.portals), `Map ${id} missing portals[]`, errors);
    assert(typeof map.width === "number" && typeof map.height === "number", `Map ${id} missing dimensions`, errors);
  }
}

function validateItems(errors) {
  for (const [id, item] of Object.entries(ITEMS)) {
    assert(item.id === id, `Item id mismatch for ${id}`, errors);
    assert(typeof item.name === "string", `Item ${id} missing name`, errors);
    assert(typeof item.icon === "string", `Item ${id} missing icon`, errors);
    assert(item.consumable || item.slot, `Item ${id} missing slot/consumable`, errors);
  }
}

function validateSkillTree(errors) {
  const ids = new Set(Object.keys(SKILL_TREE));
  for (const [id, node] of Object.entries(SKILL_TREE)) {
    assert(node.id === id, `Skill node id mismatch for ${id}`, errors);
    assert(typeof node.cost === "number", `Skill node ${id} missing cost`, errors);
    assert(Array.isArray(node.requires), `Skill node ${id} missing requires[]`, errors);
    for (const req of node.requires || []) {
      assert(ids.has(req), `Skill node ${id} requires unknown node ${req}`, errors);
    }
  }
}

export function validateConfigs() {
  const errors = [];
  validateMaps(errors);
  validateItems(errors);
  validateSkillTree(errors);
  if (errors.length > 0) {
    console.warn("[config validation] found issues:");
    for (const err of errors) console.warn(` - ${err}`);
  }
}
