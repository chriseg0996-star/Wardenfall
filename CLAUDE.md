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
- DONE — Phases 1-3 and A-O: full game through render-perf pass (see git log).
- ACTIVE — RPG pivot: spec at docs/superpowers/specs/2026-06-12-wardenfall-rpg-pivot-design.md,
  phase index at docs/superpowers/plans/2026-06-12-rpg-pivot-master.md.
- DONE — RPG Phase P: derived stat model (classBase + gearStats) + CLASS_DEFS (knight/ranger/mage).
- DONE — RPG Phase Q: gear system core (generateItem, equip/stash, gear screen, loot cards).
- DONE — RPG Phase R: SKILLS kits (knight/ranger/mage), class sprites+portraits, account save, title/char-select.
- DONE — RPG Phase S: chapter/stage select (4×5), stage seeds, stars, results screen, touch pause.
- NEXT — RPG Phase T: bosses & endgame (Grave Monarch ch3, The Warden ch4, victory, Nightmare unlock).
- ACTIVE — Side-scroll pivot: vertical slice behind GAME_MODE (spec/plan docs/superpowers/.../2026-06-12-sidescroll-*). Feel-gate pending user sign-off.

## First instruction to expect
"Read index.html and this file, then implement Phase 3."
