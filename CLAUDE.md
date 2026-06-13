# Wardenfall — Project Context

## What this is
A 2D dark-fantasy dungeon crawler. Lone hooded hero, cursed-kingdom theme. The
entire game lives in a single file: `index.html` (~4950 lines, no external assets).

## Stack (hard constraints — do not violate)
- Vanilla JS only. No frameworks, no libraries, no build step, no dependencies,
  no `package.json`.
- HTML5 Canvas for rendering. Web Audio API for sound (synth only — no audio files).
- All sprites are procedurally drawn to offscreen canvases at boot. No image files.
- Pixel-art style. Mobile-first (touch joystick + buttons must keep working).
- **Output is always a single, complete, working `index.html`.** Never split into
  multiple shipped files, never hand me a diff or a partial — edit the real file in place.
- Preserve every existing system when adding features. Do not regress combat, loot,
  HUD, minimap, BSP generation, floor progression, spells, projectiles, pathfinding,
  enemy variety, bosses, biomes, inventory, lighting, audio, keybinds, the death
  screen, or touch controls.

## How I want you to work
- Senior game-systems engineer. Assume advanced knowledge. Be concise, no filler.
- Prefer one recommended path over a menu of options, unless tradeoffs genuinely matter.
- Implement ONE roadmap phase per instruction. Do not jump ahead or invent scope.
- After each change: confirm it runs, list what changed, and state the next action.
- Format substantial plans as: Phase -> Goal -> Deliverable -> Next Action.
- Challenge weak assumptions rather than agreeing by default.

## Engineering priorities (in order)
1. Performance  2. Simplicity  3. Scalability  4. Maintainability

## How to run
Single static HTML file. Serve over HTTP (some browser APIs prefer it):
```sh
python -m http.server 8000   # then open http://localhost:8000/
```
Any static server works (`npx serve`, `caddy`). Dev-server launch config lives at
`.claude/launch.json`. Opening `file://.../index.html` directly also works.
No test suite, no linter, no CI — verification is manual: load it and play.

## Architecture notes
- Logical modules are marked with `// ── MODULE: X ──` divider comments inside the
  single file. Search those headers to navigate. Current modules, in file order:
  - **RNG** — seeded mulberry32; reproducible floors.
  - **PALETTE** — shared `{base, hi, sh}` per material (`PAL`); biome tint defs (`BIOMES`).
  - **PROCEDURAL SPRITE CACHE** — `buildSprites()` draws every entity/tile to an
    offscreen canvas once; `getBiomeSprites()` lazily tints tiles per biome.
  - **BSP** — binary space-partition node tree.
  - **DUNGEON** — BSP-driven floor generator (`buildDungeon`); rooms, corridors,
    decoration, pillars (collision + Z-sort), hazards.
  - **SPELLS** — slots 2–4; reuse particle/hitFlash FX + the projectile module.
  - **PROJECTILES** — shared by player spells and ranged enemies; wall collision via
    the same `isSolid` check `moveEntity` uses.
  - **LIGHTING** — near-blackout fog-of-war via an offscreen `lightCanvas`,
    destination-out radial cuts around player + torches; biome-tinted veil.
  - **AUDIO** — Web Audio synth SFX (`SFX.*`), no asset files; persisted prefs.
  - **FLOOR PROGRESSION** — `loadFloor()` / `descendFloor()`; biome assignment,
    walkGrid bake, boss-floor setup.
  - **BINDINGS & SETTINGS** — single source of truth for keyboard input; live
    rebinding through `actionActive()`; presets (default / WoW / arrows).
- **State lives in a few namespaces / objects:**
  - `GameState` — run-level: `floorNum`, `runSeed`, `transitioning`, `biome`.
  - `player` — all hero stats incl. spell cooldowns, HoT state, slow debuff.
  - `RunStats` — per-run telemetry for the death screen (damage, kills, floors…).
  - Plus module-level arrays: `enemies`, `pickups`, `particles`, `hitFlashes`,
    `projectiles`, `ambientParticles`, `floatingTexts`.
- Grid is 40×30 tiles, `TILE=32` → world `WW×WH = 1280×960`.
  Tile types in the `T` enum: `WALL, FLOOR, TORCH, CHEST, SPIKE, STAIR, PILLAR, LAVA`.
- **Viewport ≠ world.** Phase C added a zoomed camera: `VIEW_W×VIEW_H = 384×256`
  (12×8 tiles), letterboxed by `resize()`. The camera follows + clamps the player.
- Floors are reproducible: seeded from `GameState.runSeed ^ floorNum`.
- Enemy scaling: `floorStatMul()` geometric (`1.22^(floor-1)`, ~+22%/floor) on HP/ATK;
  `floorRewardBonus()` additive (`+18%/floor`) on XP/gold; stacks with per-level mult.
- `isSolid(t)` is the one collision predicate (`WALL` + `PILLAR`); `moveEntity`,
  projectiles, and the A* walkGrid all route through it.
- localStorage keys: `wardenfall.audio.v1`, `wardenfall.scores.v1` (top-5
  leaderboard), `wardenfall.bindings.v1`.

## Key systems (current state)
- **Spells** — `SPELLS` map, ordered by `SPELL_ORDER = ['firebolt','mend','nova']`
  → hotbar slots 2/3/4. Each has `mp`, `cd`, and a `cast(p)`. Per-slot cooldown in
  `player.spellCd[]`. Cast via `castSpell(slot)`.
- **A\* pathfinding** — `walkGrid` baked per floor in `loadFloor()`; binary-heap A*,
  4-connected, staggered recalc to avoid thundering-herd, node cap as a freeze guard,
  direct-chase shortcut at close range. Tunables in the CONFIG block (`PATH_*`).
- **Enemy variety** — `ENEMY_DEFS`: spider, skeleton, archer (ranged), shielder
  (directional block via `shieldedDamage`), necromancer (summons). Per-type AI helpers
  + attack telegraphs.
- **Bosses** — every 5th floor. `setupBossFloor()` carves an arena and gates the stair
  until the boss dies (`isBoss` flag; alternates Bone Colossus / Brood Mother). Boss HP bar.
- **Biomes** — `BIOMES`: Cursed Keep / Bone Crypt / Infernal Depths on a 10-floor cycle;
  shifts tile tint, light color, torch color, enemy bias, hazard (spike→lava), and
  ambient particles. Boss floors keep visuals but override the label.
- **Inventory / loot** — 15-item `LOOT` table with rarities; chest opens a decision
  modal. Equip deltas (`dAtk/dDef/dHp/dMp/dSpd`) fold into player stats.
- **Death screen & leaderboard** — `RunStats` summary on death; top-5 persisted score list.

## Controls
- Default: `WASD`/arrows move, `Space` attack, `H` potion, `2/3/4` spells, `Esc` pause.
- Every action is rebindable in the settings overlay; presets: default / WoW / arrows.
- Touch: on-screen joystick + buttons. Mobile-first — never regress these.

## Roadmap status — ALL SHIPPED (v0.7+, "all phases A–N complete")
- DONE — Phase 1: Combat, loot, HUD, minimap, touch controls.
- DONE — Phase 2: BSP procedural map, multi-floor via stairs, per-floor difficulty scaling.
- DONE — Phase 3: Spells & MP (Firebolt / Mend / Nova) + reusable projectile system.
- DONE — Phase A: Hooded player redesign + lantern lighting / fog-of-war.
- DONE — Phase B: Enemy redesigns + per-type death FX.
- DONE — Phase C: Zoomed viewport + pillars (collision + Z-sort).
- DONE — Phases D/E: Playtest polish; lighting comfort + UI shrink.
- DONE — Phase F: Keybinds & settings overlay (+F.1 collision fix).
- DONE — Phase G: Web Audio synth SFX core.
- DONE — Phase H: A* pathfinding (`walkGrid` + heap + 4-connected).
- DONE — Phase I: Enemy variety (archer, shielder, necromancer).
- DONE — Phase J: Inventory & item-decision chest modal (15-item LOOT).
- DONE — Phase K: Boss floors (Bone Colossus + Brood Mother, every 5th floor).
- DONE — Phase L: Death screen & run meta (stats + leaderboard).
- DONE — Phase M: Biome variety (Cursed Keep / Bone Crypt / Infernal Depths).
- DONE — Phase N: Polish (floating damage/heal text, ambient particles, footstep dust).

**No further roadmap is defined.** The original Phase 1→7 / A→N plan is fully shipped.
Before starting new work, get an explicit instruction defining the next phase's
Goal + Deliverable — do not invent scope.

## Resolved notes
- The old camera-clamp bug (`Math.min(WW-WW, …)` pinning the camera to 0) is FIXED.
  Phase C introduced a real `VIEW_W/VIEW_H` viewport smaller than the world, and the
  clamp now uses `WW - VIEW_W` / `WH - VIEW_H`. The camera follows + clamps correctly.

## First instruction to expect
"Read index.html and this file, then implement <the next phase I describe>."
