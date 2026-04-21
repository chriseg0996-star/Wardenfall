# Changelog

All notable changes to Wardenfall are documented in this file.

## [0.3.0] - 2026-04-21

### Added
- Combat pacing knobs for encounter design:
  - `COMBAT.HITSTOP_FINISHER`
  - `COMBAT.HITSTOP_KILL`
  - `ENCOUNTER` tuning group for zoner/bruiser pressure.
- Expanded tactical enemy composition in `forest` by introducing `ALPHA_WOLF` packs.

### Changed
- Enemy readability and fairness:
  - Added clearer per-archetype telegraph styling.
  - Added post-attack recovery windows to improve punish/counterplay.
  - Added role-based behavior (`chaser`, `zoner`, `bruiser`) for better encounter variety.
- Boss cadence and anti-frustration:
  - Replaced pure RNG attack selection with phase-based attack queue cadence.
  - Added anti-chain constraints for dash usage.
  - Added contact/dash hit cooldowns to reduce unfair overlap damage.
  - Increased attack expressiveness with per-attack telegraph styling and labels.
- Hit feel consistency:
  - Unified hitstop/shake behavior across melee, projectiles, and skills.
  - Added audio micro-variation to `hit`, `crit`, `enemyDie`, and `skillCast` to reduce repetition.
- Analytics improvements:
  - Added `deathsByMap` tracking for balancing and fairness diagnostics.
  - Added map-entry timing markers for pacing review.

### Validation
- `node scripts/run-quality-gates.mjs` passes after Combat & Feel changes.

## [0.2.0] - 2026-04-21

### Added
- New late-game zone: `Skyreach Cliffs` with bidirectional portal routing from `Ancient Ruins`.
- New enemy tier: `Alpha Wolf` with stronger stats and longer detection range.
- Multiplayer-ready simulation foundations:
  - `CommandBus` for input command and world event capture.
  - `Snapshot` builder for serializable world-state export hooks.
- New project docs:
  - `docs/release-checklist.md`
  - `docs/balance-targets.md`
  - `docs/playtest-triage.md`

### Changed
- Enemy combat readability improvements:
  - Added attack windup and telegraph bar before contact damage.
  - Expanded wolf rendering logic to support alpha variants.
- HUD improvements:
  - Objective display panel.
  - Debug overlay now includes death and potion analytics counters.
- Runtime analytics integration:
  - Session counters for deaths, potions used, map transitions, and level-up timestamps.
- Smoke test expansion:
  - Added coverage for new map loading, defeated-boss persistence behavior, and command/snapshot hooks.

### Notes
- This release focuses on roadmap alignment: content growth + combat clarity + networking-ready architecture boundaries.
