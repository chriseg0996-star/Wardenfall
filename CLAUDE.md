# Wardenfall — Project Context

## What this is
A 2D dungeon crawler. Lone hero, cursed-kingdom theme. The entire game lives in a
single file: `index.html`.

## Stack (hard constraints — do not violate)
- Vanilla JS only. No frameworks, no libraries, no build step, no dependencies.
- HTML5 Canvas for rendering. Web Audio API for sound.
- Pixel-art style. Mobile-first (touch joystick + buttons must keep working).
- **Output is always a single, complete, working `index.html`.** Never split into
  multiple shipped files, never hand me a diff or a partial — edit the real file in place.
- Preserve every existing system when adding features. Do not regress combat, loot,
  HUD, minimap, BSP generation, floor progression, or touch controls.

## How I want you to work
- Senior game-systems engineer. Assume advanced knowledge. Be concise, no filler.
- Prefer one recommended path over a menu of options, unless tradeoffs genuinely matter.
- Implement ONE roadmap phase per instruction. Do not jump ahead or invent scope.
- After each change: confirm it runs, list what changed, and state the next action.
- Format substantial plans as: Phase -> Goal -> Deliverable -> Next Action.
- Challenge weak assumptions rather than agreeing by default.

## Engineering priorities (in order)
1. Performance  2. Simplicity  3. Scalability  4. Maintainability

## Architecture notes
- Logical modules are marked with `// ── MODULE: X ──` comments inside the single file.
  Current modules: RNG (seeded mulberry32), BSP, DUNGEON, FLOOR PROGRESSION.
- Run-level state lives in the `GameState` namespace (floorNum, runSeed, transitioning).
- Grid is 40x30 tiles, TILE=32. Tile types in `T` enum.
- Floors are reproducible: seeded from `GameState.runSeed ^ floorNum`.
- Enemy scaling: `floorStatMul()` geometric on HP/ATK, `floorRewardBonus()` additive
  on XP/gold; stacks with the per-player-level multiplier.

## Roadmap status
- DONE — Phase 1: Combat, loot, HUD, minimap, touch controls.
- DONE — Phase 2: BSP procedural map, multi-floor via stairs, per-floor difficulty scaling.
- NEXT — Phase 3: Spells & MP. MP currently regenerates but does nothing. Add 2-3 spells
  bound to hotbar slots 2-4 (e.g. firebolt projectile, heal-over-time, AoE), with MP cost,
  cooldowns, and FX reusing existing particle/hitFlash systems. Build a reusable projectile
  system (Phase 4 ranged enemies will depend on it). Projectiles must collide with walls
  using the same `isSolid` tile check `moveEntity` uses.
- Phase 4: Bosses & enemy variety (state-machine AI, boss every 5th floor gating the stairs).
- Phase 5: Gear & inventory (equip slots; refactor player stats to base + equipped derived total).
- Phase 6: Audio & game feel (Web Audio synth SFX — no asset files; unlock AudioContext on
  first user gesture in startGame; juice pass). First real module file-split candidate.
- Phase 7: Meta-progression & release (run-summary death screen, localStorage save,
  full balance pass floors 1-20, title/credits).

## Known issue to be aware of (pre-existing, not urgent)
- Camera clamp uses `Math.min(WW-WW, ...)` which pins camera to 0. Harmless today
  because canvas == world size, so the whole floor renders scaled-to-fit. Only revisit
  if a viewport smaller than the world is ever wanted.

## First instruction to expect
"Read index.html and this file, then implement Phase 3."
