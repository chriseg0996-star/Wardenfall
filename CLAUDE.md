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
- DONE — RPG Phase T: bosses & endgame (Grave Monarch ch3 + Grave Lurch, The Warden ch4 w/ 3-phase AI + Shadow Lances + wraith summon + Crown drop, victory overlay, Nightmare difficulty + rage timer).
- DONE — RPG Phase U: procedural music (MODULE: MUSIC, 5 synthesized tracks — cursed_keep/bone_crypt/infernal_depths/black_bastion/boss, 800ms crossfade, musicMasterGain child of masterGain, music slider + mute in settings, persists in wardenfall.audio.v1).
- DONE — RPG Phase V: balance pass (ENEMY_HP/ATK_SCALE_BY_LEVEL tables replace 1.22^f blowup, lvMul slope 0.40→0.18, mitigateDmg %-based DR replaces flat atk-def, boss base stats sim-tuned to hit 50/45/35/25% clear-rate windows, Nightmare softened to ×1.35 hp/×1.15 atk, XP curve tiered ×1.6/×1.45@L10, +22%/rl reward bonus, window.__simBalance() + __simBossClearRates() dev harness).
- NEXT — RPG Phase W: release v1.0 (README rewrite, canvas context-loss recovery, OG + favicon meta, full QA, git tag v1.0).
- ACTIVE — Side-scroll pivot: vertical slice behind GAME_MODE (spec/plan docs/superpowers/.../2026-06-12-sidescroll-*). Feel-gate pending user sign-off.

## First instruction to expect
"Read index.html and this file, then implement Phase 3."
