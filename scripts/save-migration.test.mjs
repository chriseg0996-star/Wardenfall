import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { migrateSaveData, __saveTestables } from "../src/systems/SaveLoad.js";

async function loadFixture(name) {
  const raw = await readFile(new URL(`./fixtures/${name}`, import.meta.url), "utf-8");
  return JSON.parse(raw);
}

async function run() {
  const legacy = await loadFixture("save-v1.json");
  const migrated = migrateSaveData(legacy);
  assert.ok(migrated, "legacy save should migrate");
  assert.equal(migrated.version, __saveTestables.CURRENT_SAVE_VERSION);
  assert.deepEqual(migrated.maps, { currentId: null, defeatedBosses: [] });
  assert.deepEqual(migrated.unlockedTreeNodes, []);

  const partial = await loadFixture("save-v2-partial.json");
  const normalized = migrateSaveData(partial);
  assert.ok(normalized, "partial save should normalize");
  assert.equal(typeof normalized.timestamp, "number");
  assert.deepEqual(normalized.maps.defeatedBosses, ["ancient_warden"]);
  assert.deepEqual(normalized.unlockedTreeNodes, ["combat_mastery_1", "mana_pool"]);

  const invalid = migrateSaveData(null);
  assert.equal(invalid, null, "invalid root should return null");

  console.log("save migration tests passed");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
